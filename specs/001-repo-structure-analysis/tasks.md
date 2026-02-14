# Tasks: Repository Structure Analysis

**Input**: Design documents from `/specs/001-repo-structure-analysis/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks are omitted.

**Organization**: Tasks are grouped by user story. US2 precedes US1 in implementation order because the `StructureAnalyzer` (US1) depends on `FileTypeRules` (US2). US3 (validation/reporting) is folded into the US1 phase since validation warnings are integral to `StructureAnalysisResult` produced by `analyze()`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/core/src/` is the primary target (Constitution Principle I)
- All new code in `packages/core/src/analyzer/` module
- Type definitions in `packages/core/src/types/`
- Config interfaces in `packages/core/src/interfaces/`
- Existing integration target: `packages/core/src/repository/RepositoryManager.ts`

---

## Phase 1: Foundational Types & Config

**Purpose**: Define all new types, interfaces, and config extensions. These are blocking prerequisites for all implementation work.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T001 [P] Create analyzer type definitions in `packages/core/src/types/analyzer.ts`

  Create a new file with all types from the contract at `specs/001-repo-structure-analysis/contracts/analyzer-types.ts`. This includes: `FileType` union type (`'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook' | 'copilot-instruction'`), `FileTypeRule` interface, `DiscoveredFile` interface, `DiscoveredSkill` interface, `DiscoveredSkillFile` interface, `DirectoryMapping` interface, `AnalysisWarningCode` union type (7 codes: `NO_RECOGNIZED_FILES`, `EMPTY_DIRECTORY`, `TREE_TRUNCATED`, `API_ERROR`, `AUTH_REQUIRED`, `PATH_OVERRIDE_NOT_FOUND`, `STANDALONE_SKILL_MD`), `AnalysisWarning` interface, `AnalysisStatistics` interface, `StructureAnalysisResult` interface, `AnalyzerConfig` interface (with `maxScanDepth` and `excludedDirectories`), `GitHubApiRequestFn` type, and `IStructureAnalyzer` interface. All interface fields must be `readonly`. Export all types. Reference the contract file for exact field signatures.

- [ ] T002 [P] Add `PathOverrides` interface and extend `RepositoryConfig` in `packages/core/src/interfaces/Config.ts`

  Add a new `PathOverrides` interface with optional string fields: `instructions`, `prompts`, `agents`, `skills`, `cookbooks`. Add an optional `pathOverrides?: PathOverrides` field to the existing `RepositoryConfig` interface. Do NOT modify `PaletteConfig` or `createDefaultConfig()`. Reference contract at `specs/001-repo-structure-analysis/contracts/config-extensions.ts`. Existing fields and behavior must be preserved exactly.

- [ ] T003 Extend `RepositoryManagerConfig` and `RepositoryIndex` in `packages/core/src/types/repository.ts`

  Add two new fields to `RepositoryManagerConfig`: `maxScanDepth: number` (default 3) and `excludedDirectories: string[]` (default list from research.md RQ-7: `.git/`, `node_modules/`, `.github/workflows/`, `dist/`, `build/`, `__pycache__/`, `.venv/`, `.env/`, `vendor/`, `coverage/`, `.next/`, `.nuxt/`, `out/`, `target/`, `bin/`, `obj/`). Add an optional `structureAnalysis?: StructureAnalysisResult` field to `RepositoryIndex` — this requires importing `StructureAnalysisResult` from `./analyzer.js`. All existing fields and interfaces must remain unchanged.

- [ ] T004 [P] Add analyzer type re-exports to `packages/core/src/types/index.ts`

  Add a new export block re-exporting all public types from `./analyzer.js`: `FileType`, `FileTypeRule`, `DiscoveredFile`, `DiscoveredSkill`, `DiscoveredSkillFile`, `DirectoryMapping`, `AnalysisWarningCode`, `AnalysisWarning`, `AnalysisStatistics`, `StructureAnalysisResult`, `AnalyzerConfig`, `GitHubApiRequestFn`, `IStructureAnalyzer`. Append to the existing file, do not modify existing exports.

**Checkpoint**: All types and config extensions defined. Implementation can begin.

**Fleet Batch Note**: T001 and T002 have zero inter-dependencies — launch as parallel sub-agents. T003 depends on T001 (imports `StructureAnalysisResult`). T004 depends on T001 (re-exports from `analyzer.js`). T003 and T004 can be parallel with each other once T001 completes.

---

## Phase 2: US2 — File Type Detection by Naming Convention (Priority: P1)

**Goal**: Implement naming convention rules that classify files by their filename suffix, regardless of directory placement. This is the classification engine used by the discovery phase (US1).

**Independent Test**: Place files with each naming convention (`*.instructions.md`, `*.prompt.md`, `*.agent.md`, `SKILL.md`, `*.cookbook.md`, `copilot-instructions.md`) in arbitrary directories and verify `classifyFile()` returns the correct `FileType`.

### Implementation for User Story 2

- [ ] T005 [US2] Create `FileTypeRules` module in `packages/core/src/analyzer/FileTypeRules.ts`

  Create a new file that exports: (1) a `DEFAULT_FILE_TYPE_RULES` array of `FileTypeRule` objects sorted by priority (lower number = checked first), and (2) a `classifyFile(fileName: string, rules?: FileTypeRule[]): FileType | undefined` function. The rules, in priority order per research.md RQ-6, are:

  | Priority | Pattern | Type | Notes |
  |----------|---------|------|-------|
  | 1 | `SKILL.md` exact match (case-insensitive) | `skill` | Marker file for skill directories |
  | 2 | `copilot-instructions.md` exact match (case-insensitive) | `copilot-instruction` | Root/.github special file |
  | 3 | `*.instructions.md` or `*.instruction.md` | `instruction` | |
  | 4 | `*.prompt.md` | `prompt` | |
  | 5 | `*.agent.md` | `agent` | |
  | 6 | `*.cookbook.md` | `cookbook` | |

  For ambiguous filenames like `testing.instructions.prompt.md`, the function must match on the **rightmost** (most specific) convention: this returns `prompt`. Implementation: check patterns from most-specific suffix to least-specific, or evaluate in the given priority order where patterns are crafted to match the rightmost suffix. The `DEFAULT_EXCLUDED_DIRECTORIES` constant should also be exported from this file: the fixed prefix list from research.md RQ-7 (`.git/`, `node_modules/`, `.github/workflows/`, `dist/`, `build/`, `__pycache__/`, `.venv/`, `.env/`, `vendor/`, `coverage/`, `.next/`, `.nuxt/`, `out/`, `target/`, `bin/`, `obj/`). Import types from `../types/analyzer.js`.

**Checkpoint**: `classifyFile()` can independently classify any filename. This module has no external dependencies beyond the type definitions.

---

## Phase 3: US1 + US3 — Dynamic Directory Discovery & Structure Validation (Priority: P1 + P2)

**Goal**: Scan a repository's full tree via the Git Trees API (single recursive call), classify all files using `FileTypeRules`, detect skill directories via `SKILL.md` markers, identify `copilot-instructions.md` at root/`.github/`, generate validation warnings, and produce a complete `StructureAnalysisResult`.

**Independent Test (US1)**: Configure a custom repository with non-standard directory names containing properly-named files (e.g., `my-guides/code-review.prompt.md`) and verify they appear in the analysis result with correct types.

**Independent Test (US3)**: Index a repository with known structural problems (no recognized files, empty directories, API errors) and verify the `warnings` array in `StructureAnalysisResult` contains the expected `AnalysisWarningCode` entries.

### Implementation for User Story 1 + User Story 3

- [ ] T006 [US1] Create `StructureAnalyzer` class in `packages/core/src/analyzer/StructureAnalyzer.ts`

  Create a new file implementing the `IStructureAnalyzer` interface from `types/analyzer.ts`. The class constructor takes a `Logger` (from `../interfaces/Logger.js`) and a `GitHubApiRequestFn`. Key implementation details:

  **`analyze(owner, repo, branch?, config?)` method**:
  1. Call Git Trees API: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`. The URL is passed to the injected `GitHubApiRequestFn`. Parse the response `tree` array (each entry has `path`, `type` ("blob"/"tree"), `sha`, `size`, `mode`).
  2. Check `response.truncated` — if `true`, add a `TREE_TRUNCATED` warning.
  3. Handle API errors: if the request fails, return a result with `isUsable: false` and an `API_ERROR` or `AUTH_REQUIRED` warning (check for 401/403 status patterns in error message).
  4. Filter tree entries: skip entries whose path starts with any prefix in `AnalyzerConfig.excludedDirectories` (default from `DEFAULT_EXCLUDED_DIRECTORIES`). Skip entries deeper than `config.maxScanDepth` (default 3). Depth is calculated by counting `/` separators in the path.
  5. For each remaining blob entry, call `classifyFile()` on its filename. If a type is returned, create a `DiscoveredFile`.
  6. **Skill detection**: Find all `SKILL.md` markers (type `blob`, filename `SKILL.md` case-insensitive). For each marker at depth > 0 (not repo root), collect all sibling entries sharing the same parent directory prefix → build a `DiscoveredSkill`. A standalone `SKILL.md` at root (depth 0) emits a `STANDALONE_SKILL_MD` warning and is excluded.
  7. **copilot-instructions.md detection**: Check for `copilot-instructions.md` at root (depth 0) and `.github/copilot-instructions.md` (depth 1, directory `.github`). Set `rootCopilotInstructions` and `githubCopilotInstructions` fields.
  8. Build `DirectoryMapping[]` by grouping discovered files by their parent directory.
  9. Build `AnalysisStatistics` with per-type counts.
  10. If zero files discovered, add `NO_RECOGNIZED_FILES` warning. For each scanned directory that yielded zero matches, add `EMPTY_DIRECTORY` warning.
  11. Set `isUsable = discoveredFiles.length > 0`.
  12. Return the complete `StructureAnalysisResult`.

  **`classifyFile(fileName)` method**: Delegate to the `classifyFile` function from `FileTypeRules.ts`.

  Import `classifyFile` and `DEFAULT_EXCLUDED_DIRECTORIES` from `./FileTypeRules.js`. Import all result types from `../types/analyzer.js`. Import `Logger` from `../interfaces/Logger.js`.

**Checkpoint**: `StructureAnalyzer` can be instantiated and called directly with a mock `GitHubApiRequestFn` to analyze any repository. Validation warnings (US3) are generated as part of the analysis flow. No dependency on `RepositoryManager`.

---

## Phase 4: US4 — Per-Repository Path Overrides & RepositoryManager Integration (Priority: P3)

**Goal**: Integrate `StructureAnalyzer` into the existing `RepositoryManager` indexing pipeline. When a repository has no path overrides, delegate discovery to `StructureAnalyzer` (auto-discovery). When path overrides are configured, use the existing Contents API approach for overridden types and auto-discovery for the rest. Attach `StructureAnalysisResult` to `RepositoryIndex`. Preserve full backward compatibility for the default `awesome-copilot` repository.

**Independent Test (US4)**: Configure a repository with explicit path overrides for some types and verify only those paths are scanned for the overridden types, while remaining types fall back to auto-discovery.

**Independent Test (Integration)**: Run `indexAllRepositories()` on a mix of repositories — one with path overrides, one without — and verify both produce valid `RepositoryIndex` objects with correct file counts.

### Implementation for User Story 4

- [ ] T007 [US1] [US4] Integrate `StructureAnalyzer` and path override handling into `packages/core/src/repository/RepositoryManager.ts`

  Modify the existing `RepositoryManager` class with the following changes:

  1. **New dependency**: Import `StructureAnalyzer` from `../analyzer/StructureAnalyzer.js`. Import `classifyFile` from `../analyzer/FileTypeRules.js`. Import relevant types (`StructureAnalysisResult`, `DiscoveredFile`, `DiscoveredSkill`, `PathOverrides`) from `../types/analyzer.js`. Import `PathOverrides` from `../interfaces/Config.js`.

  2. **Constructor changes**: Instantiate a `StructureAnalyzer` in the constructor, passing `this._logger` and a bound version of `this.makeGitHubApiRequest` as the `GitHubApiRequestFn`. Add `maxScanDepth` (default 3) and `excludedDirectories` (default list) to the `this.config` initialization.

  3. **`initializeDefaultRepositories()` changes**: Read `pathOverrides` from `RepositoryConfig` (if present). When `pathOverrides` is provided, set the corresponding `OnlineRepository` path fields (`instructionsPath`, `promptsPath`, etc.) to the override values. When `pathOverrides` is absent AND the repo is NOT the default `github/awesome-copilot`, leave path fields as `undefined` (triggering auto-discovery). The default `github/awesome-copilot` repo MUST keep its current hardcoded paths for backward compatibility (FR-012).

  4. **`indexRepository()` changes**: After the cache validity check, determine the indexing strategy:
     - **Auto-discovery path** (when ALL of `instructionsPath`, `promptsPath`, `agentsPath`, `skillsPath`, `cookbooksPath` are `undefined`): Call `this.structureAnalyzer.analyze(repo.owner, repo.repo, repo.branch, { maxScanDepth: this.config.maxScanDepth, excludedDirectories: this.config.excludedDirectories })`. Convert `DiscoveredFile[]` to `RemoteFile[]` (map fields, build `downloadUrl` as `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`). Convert `DiscoveredSkill[]` to `RemoteFile[]` with `isFolder: true` and `files` populated. Attach `StructureAnalysisResult` to the resulting `RepositoryIndex.structureAnalysis`.
     - **Override/legacy path** (when any path field is set): Use existing `indexDirectory()` loop for types that have a path set. For types where the path is `undefined`, extract those types from a `StructureAnalyzer.analyze()` call (or skip if all types have paths). Apply `classifyFile()` filtering within overridden directories (FR-007: only include files matching the type's naming convention, replacing the `isValidFileForType` calls).
     - **Hybrid path** (partial overrides): Combine both approaches per-type.

  5. **Error handling**: If `StructureAnalyzer.analyze()` returns a result with `isUsable: false`, log warnings and create a failed index (existing pattern). Do not crash or block other repositories.

  6. **`isValidFileForType` update**: This private method can delegate to `classifyFile()` for consistency, or remain as-is for the override path. Either approach is acceptable as long as naming convention filtering is always applied.

**Checkpoint**: `indexAllRepositories()` correctly uses auto-discovery for custom repos without path overrides, uses path overrides when configured, and preserves existing behavior for `github/awesome-copilot`.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Wire up public exports and verify everything compiles and works end-to-end.

- [ ] T008 [P] Update public API exports in `packages/core/src/index.ts`

  Add exports for the new `StructureAnalyzer` class (value export, not just type) from `./analyzer/StructureAnalyzer.js`. Add type re-exports for all analyzer types from `./types/analyzer.js` (or rely on the re-exports already in `./types/index.js` — verify which approach the existing export pattern uses and follow it). Add export for `classifyFile` function and `DEFAULT_FILE_TYPE_RULES` from `./analyzer/FileTypeRules.js`. Add type export for `PathOverrides` from `./interfaces/Config.js`. Preserve all existing exports exactly.

- [ ] T009 Verify TypeScript compilation succeeds across the monorepo

  Run `npx tsc --noEmit` from `packages/core/` to verify all new and modified files compile without errors under strict mode. Fix any type errors, missing imports, or circular dependency issues. Verify that `packages/vscode/` still compiles by running its build as well (it depends on `@awesome-palette/core`).

- [ ] T010 Validate quickstart.md usage patterns against implementation

  Review `specs/001-repo-structure-analysis/quickstart.md` and verify the documented API usage patterns compile and match the actual implementation. Specifically check: (1) `StructureAnalyzer` constructor signature matches, (2) `analyze()` return type matches documented field access, (3) `classifyFile()` returns expected types for documented examples, (4) `PathOverrides` in config matches documented shape. Flag any discrepancies as documentation updates needed.

---

## Dependencies & Execution Order

### Task Dependency Graph

```text
T001 ──────┬──────────────────────────────── T003 ──┐
           │                                        │
           ├── T004                                 │
           │                                        │
           └── T005 ── T006 ──┬── T007 ────────────┤
                              │                     │
T002 ─────────────────────────┘        T008 ────────┘
                                                    │
                                              T009 ─┤
                                                    │
                                              T010 ─┘
```

### Explicit Dependencies

| Task | Depends On | Reason |
|------|-----------|--------|
| T001 | — | No dependencies |
| T002 | — | No dependencies |
| T003 | T001 | Imports `StructureAnalysisResult` from `types/analyzer.ts` |
| T004 | T001 | Re-exports types from `types/analyzer.ts` |
| T005 | T001 | Imports `FileType`, `FileTypeRule` from `types/analyzer.ts` |
| T006 | T001, T005 | Imports types from `types/analyzer.ts`, uses `classifyFile` from `FileTypeRules.ts` |
| T007 | T001, T002, T003, T005, T006 | Imports from all type files, uses `StructureAnalyzer` and `classifyFile` |
| T008 | T001, T006 | Exports `StructureAnalyzer` class and analyzer types |
| T009 | T001–T008 | Compilation check requires all source files |
| T010 | T009 | Validation requires successful compilation |

### Fleet Batching (Copilot CLI `fleet`)

Optimized for maximum parallelism with sub-agents. Each batch completes before the next begins.

```text
Batch 1 — 2 parallel sub-agents:
  ├── T001: Create types/analyzer.ts (new file)
  └── T002: Extend Config.ts (modify existing)

Batch 2 — 3 parallel sub-agents:
  ├── T003: Extend repository.ts (modify existing)
  ├── T004: Update types/index.ts (modify existing)
  └── T005: Create FileTypeRules.ts (new file)

Batch 3 — 1 sub-agent:
  └── T006: Create StructureAnalyzer.ts (new file, largest task)

Batch 4 — 2 parallel sub-agents:
  ├── T007: Modify RepositoryManager.ts (modify existing, second largest task)
  └── T008: Update index.ts exports (modify existing)

Batch 5 — sequential:
  └── T009: Compile check

Batch 6 — sequential:
  └── T010: Quickstart validation
```

**Total: 6 batches, max 3 parallel sub-agents per batch.**

---

## Parallel Example: Batch 2

```bash
# Launch 3 sub-agents simultaneously (all depend only on T001, touch different files):

Agent 1 — "Extend RepositoryManagerConfig and RepositoryIndex in packages/core/src/types/repository.ts"
Agent 2 — "Add analyzer type re-exports to packages/core/src/types/index.ts"
Agent 3 — "Create FileTypeRules module in packages/core/src/analyzer/FileTypeRules.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Batch 1–2: Types and config (T001–T005)
2. Complete Batch 3: StructureAnalyzer (T006) — US1 + US2 + US3 are now independently usable via direct `StructureAnalyzer` API
3. **STOP and VALIDATE**: Instantiate `StructureAnalyzer` with a mock `GitHubApiRequestFn`, call `analyze()`, verify `StructureAnalysisResult` is correctly populated
4. This is the functional MVP — discovery, classification, and validation all work

### Full Integration (User Story 4)

5. Complete Batch 4: RepositoryManager integration + exports (T007, T008)
6. Complete Batch 5–6: Compile check + quickstart validation (T009, T010)
7. End-to-end: `indexAllRepositories()` uses auto-discovery for custom repos

### Incremental Delivery

Each checkpoint is independently verifiable:

| After | What Works |
|-------|-----------|
| T005 | `classifyFile()` classifies any filename correctly |
| T006 | `StructureAnalyzer.analyze()` produces full `StructureAnalysisResult` with validation warnings |
| T007 | `RepositoryManager.indexRepository()` uses auto-discovery, path overrides work, backward compatible |
| T009 | Full monorepo compiles cleanly |

---

## Notes

- Tasks T006 and T007 are the two largest tasks. T006 (`StructureAnalyzer`) is ~250–350 lines; T007 (`RepositoryManager` integration) modifies an existing ~350-line file with ~100 lines of changes. Both are within the scope of a single sub-agent session.
- The `StructureAnalyzer` is designed to be injectable (constructor takes `Logger` + `GitHubApiRequestFn`), making it testable with mock data without live API calls.
- The default `github/awesome-copilot` repository retains hardcoded paths in `initializeDefaultRepositories()` for backward compatibility (FR-012). Custom repos without `pathOverrides` trigger auto-discovery.
- All new code lives in `packages/core/src/` per Constitution Principle I (platform-agnostic library first).
- Commit after each batch or logical group of tasks.
