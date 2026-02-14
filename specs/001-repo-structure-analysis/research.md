# Research: Repository Structure Analysis

**Feature**: 001-repo-structure-analysis  
**Date**: 2026-02-13  
**Status**: Complete

## Research Questions

### RQ-1: Which GitHub API should be used for repository structure discovery?

**Decision**: Use the **Git Trees API** (`GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`) as the primary discovery mechanism.

**Rationale**:

- Returns the entire repository tree (files + directories) in a **single API call**, including `path`, `type` (blob/tree), `sha`, `size`, and `mode` for every entry.
- Directly aligns with SC-004 ("≤2 additional API calls beyond current indexing for standard repos"). The structure analysis itself costs exactly 1 API call regardless of repository size or depth.
- GitHub's own documentation for the Contents API explicitly recommends: *"To get a repository's contents recursively, you can recursively get the tree."*
- The Contents API is limited to 1,000 files per directory listing and requires one API call per directory, making it O(N) in directories scanned. For a 3-level repo with 10 directories, that's 10+ calls vs 1.

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Contents API (`GET /repos/{owner}/{repo}/contents/{path}`) per directory | O(N) API calls. Would exhaust rate limits quickly for deep or wide repos. Only lists 1 directory per call (max 1,000 items). |
| Clone repository locally via `git clone --depth 1` | Requires git binary on host. Downloads file contents (unnecessary for structure analysis). Not HTTP-only. Violates platform-agnostic principle (assumes CLI tools). |
| GitHub Archive API (tarball/zipball) | Downloads entire repo contents. Massive overhead for structure-only analysis. Requires archive extraction logic. |

**Truncation handling**: The Git Trees API sets `truncated: true` when the tree exceeds 100,000 entries or 7MB response size. For Copilot config repos (typically <100 files), truncation is extremely unlikely. If truncation occurs, the system should:

1. Log a warning in `StructureAnalysisResult`.
2. Fall back to Contents API for targeted directory scanning (only scan root-level directories that look promising based on the partial tree data).
3. This fallback is an edge case and can be deferred to a future iteration if needed.

### RQ-2: How should the StructureAnalyzer integrate with the existing RepositoryManager?

**Decision**: `StructureAnalyzer` is a **standalone class** in `packages/core/src/analyzer/` that `RepositoryManager` delegates to during the `indexRepository()` method.

**Rationale**:

- **Separation of concerns**: `RepositoryManager` owns repository lifecycle (add/remove/cache). `StructureAnalyzer` owns the analysis logic (discovery + classification). This is consistent with the existing pattern where `CatalogManager` owns catalog logic and delegates repo work to `RepositoryManager`.
- **Testability**: `StructureAnalyzer` can be unit-tested in isolation by injecting a mock API request function, without needing a full `RepositoryManager` instance.
- **Constitution Principle I**: Both classes live in core with no platform dependencies.

**Integration flow**:

```text
RepositoryManager.indexRepository(repo)
  │
  ├── Has path overrides? ──YES──► Use existing Contents API approach (current behavior)
  │                                 ↓
  │                          indexDirectory() for each overridden path
  │                                 ↓
  │                          Apply FileTypeRules within those directories
  │
  └── No path overrides? ──YES──► Delegate to StructureAnalyzer
                                    ↓
                             StructureAnalyzer.analyze(repo)
                                    ↓
                             Git Trees API (single call)
                                    ↓
                             FileTypeRules applied to all entries
                                    ↓
                             StructureAnalysisResult returned
                                    ↓
                             RepositoryManager converts to RemoteFile[]
                                    ↓
                             RepositoryIndex built as before
```

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Add analysis methods directly to `RepositoryManager` | Violates single responsibility. `RepositoryManager` is already 400+ lines. Would make unit testing harder. |
| Create an `Analyzer` interface with `StructureAnalyzer` as implementation | Over-engineering for a single implementation. No foreseeable need for alternative analyzers. Can extract interface later if needed (Pre-1.0 Flexibility). |

### RQ-3: How do existing `OnlineRepository` path fields interact with the new dynamic discovery?

**Decision**: The existing `instructionsPath`, `promptsPath`, `agentsPath`, `skillsPath`, `cookbooksPath` fields on `OnlineRepository` are **reinterpreted as path overrides** (FR-006). When any of these fields are set, they override auto-discovery for that specific type only.

**Rationale**:

- **Backward compatibility** (FR-012): The current `initializeDefaultRepositories()` sets these fields to `'instructions'`, `'prompts'`, `'agents'`, `'skills'`, `'cookbook'` for the default `awesome-copilot` repo. This means the default repo will continue to use hardcoded paths — identical to current behavior.
- **Per-type granularity**: A user can override paths for some types but let auto-discovery handle others (FR-008).
- **No new fields needed on `OnlineRepository`**: The existing optional path fields already serve the override purpose. We just need to change the semantics from "required directory name" to "optional override; if absent, use auto-discovery."

**Migration path**:

1. Current code hardcodes paths in `initializeDefaultRepositories()` → keeps current behavior.
2. `RepositoryConfig` in `Config.ts` is extended with optional `pathOverrides` map so users can configure overrides through settings.
3. When `pathOverrides` are absent in the config AND path fields are absent on `OnlineRepository`, auto-discovery via `StructureAnalyzer` kicks in.

### RQ-4: How should `copilot-instructions.md` at root level be handled?

**Decision**: Treat `copilot-instructions.md` as a **special-case file** detected during structure analysis, reported separately in `StructureAnalysisResult`.

**Rationale**:

- `copilot-instructions.md` at the repository root is the standard GitHub Copilot project-level instruction file. It's not an "instruction" in the catalog sense — it's a repo-level configuration file.
- The Git Trees API returns root-level files naturally (e.g., `path: "copilot-instructions.md"`, no `/` prefix). The analyzer checks for this filename at root and `.github/copilot-instructions.md`.
- It's included in the `StructureAnalysisResult` as a distinct finding (`rootCopilotInstructions` field) rather than mixed into the typed file lists.

### RQ-5: How should skill directory detection work with the Git Trees API?

**Decision**: Detect skill directories by finding `SKILL.md` marker files in the tree data, then collect all sibling entries under the same parent directory path.

**Rationale**:

- The Git Trees API returns flat paths like `skills/my-skill/SKILL.md`, `skills/my-skill/README.md`, etc.
- A skill directory is identified when any entry has `path` ending in `/SKILL.md` (case-insensitive).
- The parent directory of the `SKILL.md` file is the skill root.
- All sibling entries (same parent path prefix) are included as the skill's file set.
- A standalone `SKILL.md` at the repo root (`path: "SKILL.md"`) is excluded because skills must be folder-based (spec clarification).
- A `SKILL.md` file that is `path: "some-dir/SKILL.md"` where `some-dir/` also contains files with other naming conventions (e.g., `some-dir/test.instructions.md`) — the directory is treated as a skill directory AND the individual files within are classified independently. This is consistent with the spec's statement that directories can contain multiple file types.

### RQ-6: What is the optimal `FileTypeRule` evaluation order?

**Decision**: Rules are evaluated in a fixed priority order. The **most specific match** (rightmost convention in the filename) wins, as specified in the spec's edge cases.

**Rules in evaluation order**:

| Priority | Pattern | Type | Notes |
|----------|---------|------|-------|
| 1 | `SKILL.md` (exact, case-insensitive, within a directory) | skill | Marker file; triggers directory-as-skill detection |
| 2 | `copilot-instructions.md` (exact, case-insensitive) | copilot-instruction | Special root/`.github` file |
| 3 | `*.instructions.md` or `*.instruction.md` | instruction | |
| 4 | `*.prompt.md` | prompt | |
| 5 | `*.agent.md` | agent | |
| 6 | `*.cookbook.md` | cookbook | |
| 7 | No match | unrecognized | Excluded from catalog |

For ambiguous filenames like `testing.instructions.prompt.md`, the rightmost convention match applies: `.prompt.md` → classified as `prompt`. This is implemented by checking patterns from most-specific (longest suffix) to least-specific.

### RQ-7: What directories should be excluded from scanning?

**Decision**: A fixed exclusion list applied during tree filtering, before classification.

**Excluded directory prefixes**:

```text
.git/
node_modules/
.github/workflows/
dist/
build/
__pycache__/
.venv/
.env/
vendor/
coverage/
.next/
.nuxt/
out/
target/
bin/
obj/
```

**Rationale**: These are build artifacts, dependency caches, or CI directories that never contain Copilot configuration files. `.github/` itself is NOT excluded (it may contain `copilot-instructions.md`), but `.github/workflows/` is excluded. Filtering in the tree data is a simple prefix check — no API calls needed.

**Note**: The exclusion list is not configurable per-repo (spec assumption). If a future need arises, this can be promoted to a config field.

## Summary of Resolved NEEDS CLARIFICATION

All technical context items were resolved during specification clarification sessions. No NEEDS CLARIFICATION items remained at research start. This research addresses implementation-level decisions not covered by the specification.

| Item | Resolution | Source |
|------|-----------|--------|
| API strategy for discovery | Git Trees API (single recursive call) | RQ-1 |
| `StructureAnalyzer` placement | Standalone class in `core/src/analyzer/` | RQ-2 |
| Path override interaction | Existing `OnlineRepository` path fields reinterpreted as overrides | RQ-3 |
| `copilot-instructions.md` handling | Special-case detection, reported separately in result | RQ-4 |
| Skill directory detection | `SKILL.md` marker in flat tree → parent directory = skill | RQ-5 |
| Rule evaluation order | Fixed priority, rightmost convention wins for ambiguous names | RQ-6 |
| Directory exclusion list | Fixed prefix list, `.github/workflows/` excluded but `.github/` allowed | RQ-7 |
