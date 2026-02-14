# Feature Specification: Repository Structure Analysis

**Feature Branch**: `001-repo-structure-analysis`  
**Created**: 2026-02-13  
**Status**: Draft  
**Input**: User description: "The awesome-palette repository has the ability to be configured with custom repositories from which it can pull configuration files. Now, the awesome-copilot repo has a well-organized structure where agents, instructions and such reside in defined locations. I am not sure how the current code looks at the repo structure and pulls in information. What I need to implement (by building this specification first) is the ability to analyze repo structure for the custom repositories and pull in information from them. What happens if the custom repo is not structured properly? How does awesome-palette decide what types the available files are? This is supporting code in the framework that needs to be built (assuming it is not there already)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Directory Discovery (Priority: P1)

A developer adds a custom repository to their awesome-palette configuration. The repository organizes its Copilot assets in non-standard directory names (e.g., `custom-instructions/` instead of `instructions/`, or `guides/` instead of `prompts/`). When awesome-palette indexes this repository, it scans the repository's root-level directory structure, identifies directories that contain recognized file types (based on file naming conventions), and maps those directories to the appropriate categories—without requiring the repo owner to follow a rigid directory layout.

**Why this priority**: This is the foundational capability for the **discovery phase** (WHERE to look). Without dynamic discovery, custom repositories that deviate from the hardcoded `awesome-copilot` directory layout are silently ignored, rendering the "custom repository" feature unreliable. This story focuses on the scanning mechanism, while User Story 2 focuses on the classification rules that work with this discovery process.

**Independent Test**: Can be tested by configuring a custom repository with non-standard directory names containing properly-named files (e.g., `my-guides/code-review.prompt.md`) and verifying they appear in the catalog.

**Acceptance Scenarios**:

1. **Given** a custom repository with a `guides/` directory containing `.prompt.md` files, **When** the system indexes the repository, **Then** the files are discovered and categorized as prompts.
2. **Given** a custom repository with standard directory names (`instructions/`, `agents/`, `prompts/`), **When** the system indexes the repository, **Then** files are discovered identically to the current behavior (no regression).
3. **Given** a custom repository whose root contains directories with no recognized file types, **When** the system indexes the repository, **Then** those directories are skipped without error.
4. **Given** a custom repository with files placed directly in the root (not inside subdirectories), **When** the system indexes the repository, **Then** the system still categorizes those files by their naming convention.

---

### User Story 2 - File Type Detection by Naming Convention (Priority: P1)

A developer adds a custom repository containing Copilot configuration files. The system determines each file's type (instruction, prompt, agent, skill, cookbook) based on the established naming conventions (e.g., `*.instructions.md`, `*.prompt.md`, `*.agent.md`, `SKILL.md` marker within a directory, `*.cookbook.md`) regardless of which directory the file resides in. This ensures files are correctly categorized even if the directory structure is unconventional.

**Why this priority**: File type detection is the core **classification phase** (WHAT each file is). Directory structure provides hints, but naming conventions are the authoritative signal. This works in conjunction with User Story 1's discovery mechanism but addresses a separate concern: applying the correct type label to discovered files. This must work correctly for any downstream feature (installation, display, filtering).

**Independent Test**: Can be tested by placing files with each naming convention in arbitrary directories and verifying that each file is assigned the correct type.

**Acceptance Scenarios**:

1. **Given** a file named `python.instructions.md` in a directory called `stuff/`, **When** the system indexes it, **Then** it is categorized as type `instruction`.
2. **Given** a file named `code-review.prompt.md` in a directory called `templates/`, **When** the system indexes it, **Then** it is categorized as type `prompt`.
3. **Given** a file named `Expert.agent.md` in the repository root, **When** the system indexes it, **Then** it is categorized as type `agent`.
4. **Given** a directory (folder) containing a `SKILL.md` marker file, **When** the system indexes it, **Then** the directory is categorized as type `skill` and the full folder contents are captured as a single skill unit.
5. **Given** a standalone `SKILL.md` file not within a dedicated directory structure, **When** the system indexes it, **Then** it is excluded from the catalog (skills must be folder-based).
6. **Given** a file named `testing.cookbook.md`, **When** the system indexes it, **Then** it is categorized as type `cookbook`.
7. **Given** a file named `README.md` that matches no naming convention, **When** the system indexes it, **Then** it is excluded from the catalog.

---

### User Story 3 - Structure Validation and Reporting (Priority: P2)

A developer adds a custom repository that is poorly structured—perhaps it contains no recognized files, has ambiguous naming, or has directories that mix file types. The system analyzes the repository structure and provides a clear report indicating what was found, what could not be categorized, and any structural issues. This helps repository owners understand whether their repo is compatible and how to fix it.

**Why this priority**: Without validation feedback, developers face a silent failure mode: they add a custom repo, nothing appears, and they have no idea why. Validation turns this into a diagnosable situation.

**Independent Test**: Can be tested by indexing a repository with known structural problems and verifying the validation report contains the expected warnings and findings.

**Acceptance Scenarios**:

1. **Given** a custom repository with no recognized file types in any directory, **When** the system completes indexing, **Then** a validation report is generated and included in the `StructureAnalysisResult` object, indicating that zero compatible files were found.
2. **Given** a custom repository with some directories containing recognized files and some that are empty or contain unrecognized files, **When** the system completes indexing, **Then** the `StructureAnalysisResult` report lists the discovered files by type and notes directories that were skipped.
3. **Given** a custom repository with a `copilot-instructions.md` file at the root level, **When** the system indexes the repository, **Then** the file is discovered and reported in `StructureAnalysisResult` as a root-level copilot instruction file.
4. **Given** a custom repository that returns a GitHub API error (404, rate limit, timeout), **When** the system attempts to index it, **Then** an appropriate error is recorded in the `StructureAnalysisResult` without crashing or blocking other repositories.

### User Story 4 - Per-Repository Path Overrides (Priority: P3)

A developer configures a custom repository and knows in advance that its assets live in specific directories (e.g., `.copilot/instructions/` instead of `instructions/`). They can optionally provide path overrides in the repository configuration so the system looks in the specified locations rather than relying solely on automatic discovery.

**Why this priority**: Path overrides serve as a fallback for repositories whose structure cannot be auto-detected or where the developer wants to constrain the scope of scanning. This is an optimization and power-user feature, not a core requirement.

**Independent Test**: Can be tested by configuring a repository with explicit path overrides and verifying only those paths are scanned.

**Acceptance Scenarios**:

1. **Given** a repository configuration with explicit path overrides for instructions and prompts, **When** the system indexes the repository, **Then** only the specified directories are scanned for those types.
2. **Given** a repository configuration with path overrides for some types but not others, **When** the system indexes the repository, **Then** the overridden types use the specified paths and the remaining types fall back to automatic discovery.
3. **Given** a repository configuration with a path override pointing to a non-existent directory, **When** the system indexes the repository, **Then** a warning is reported and that type is skipped gracefully.

---

### Edge Cases

- What happens when a file matches multiple naming conventions (e.g., `testing.instructions.prompt.md`)? The system uses the most specific (rightmost) convention match: this file would be categorized as a `prompt`.
- What happens when a repository has deeply nested directories (e.g., `src/config/copilot/instructions/`)? The system scans up to a configurable depth limit (default: 3 levels) to avoid excessive API calls.
- What happens when a repository configuration specifies a path override that contains files not matching the type's naming convention (e.g., `instructionsPath: "guides"` containing `.md` files without the `instructions` suffix)? Those files are excluded; only files matching the type's naming convention are included, even within overridden paths.
- What happens when a repository contains thousands of files? The system respects GitHub API rate limits and only indexes directories that appear relevant based on initial root-level discovery.
- What happens when a skill directory lacks a `SKILL.md` marker file? The directory is not categorized as a skill; individual files within it are still evaluated by naming convention.
- What happens when a `SKILL.md` file is found at the repository root or in a non-directory context (not in a dedicated folder)? It is excluded from the catalog, as skills must be folder-based structures where the entire directory constitutes the skill unit.
- What happens when a `copilot-instructions.md` file exists in both the root and inside a subdirectory? Both are discovered; the root-level one is flagged as the primary copilot instruction file.
- What happens when the repository is private and no token is configured? The system reports an authentication error with guidance to configure a GitHub token.
- What happens when multiple configured repositories contain files with the same name and type (e.g., `python.instructions.md` in both `repo-a` and `repo-b`)? Both files are included in the catalog, each tagged with its source repository name. Users can disambiguate and select the version they prefer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST scan the root-level directory listing of a custom repository to discover directories that may contain Copilot configuration files.
- **FR-002**: System MUST determine each file's type based on its filename convention: `*.instructions.md` → instruction, `*.prompt.md` → prompt, `*.agent.md` → agent, `SKILL.md` marker within a directory → skill (folder-based), `*.cookbook.md` → cookbook. Standalone `SKILL.md` files not within a dedicated directory structure are excluded.
- **FR-003**: System MUST support discovering files regardless of which directory they reside in, using naming conventions as the authoritative type signal rather than directory name alone.
- **FR-004**: System MUST detect `copilot-instructions.md` files at the repository root level and in `.github/` if present.
- **FR-005**: System MUST produce a structure analysis result after indexing a repository, containing: a per-type count of discovered files, a list of directories that were scanned, a list of directories or files that were skipped, and the source repository name for each discovered file.
- **FR-006**: System MUST support optional per-repository path overrides in the repository configuration, allowing users to specify explicit directory paths for each file type.
- **FR-007**: When path overrides are provided for a type, the system MUST use those paths exclusively for discovering that type AND continue applying naming convention filtering within those paths (e.g., only files matching `*.instructions.md` are included from an overridden instructions path).
- **FR-008**: When path overrides are not provided, the system MUST fall back to automatic directory discovery and naming-convention-based detection. Path overrides do not bypass naming convention filtering; they only restrict which directories are scanned.
- **FR-009**: System MUST limit directory traversal to a configurable maximum depth (default: 3 levels, configured globally via `RepositoryManager` settings, applied to all repositories) to avoid excessive API usage.
- **FR-010**: System MUST skip directories commonly excluded from scanning (e.g., `.git`, `node_modules`, `.github/workflows`, `dist`, `build`, `__pycache__`).
- **FR-011**: System MUST handle malformed or inaccessible repositories gracefully, reporting explicit errors (e.g., GitHub API errors, authentication failures) without crashing or blocking the indexing of other configured repositories.
- **FR-011b**: System MUST generate validation warnings in the `StructureAnalysisResult` when: (a) the repository contains zero recognized files of any type, OR (b) any examined directory is scanned but yields zero file matches (indicating structural misalignment).
- **FR-012**: System MUST maintain backward compatibility with the existing `awesome-copilot` repository structure so that current users experience no regression.
- **FR-013**: System MUST cache the structure analysis result alongside existing index caches to avoid redundant API calls on repeated access.

### Key Entities

- **RepositoryStructure**: Represents the analyzed layout of a repository. Contains a mapping of discovered directories to the file types they contain, a list of recognized files with their types, and a list of skipped/unrecognized paths.
- **StructureAnalysisResult**: The output of analyzing a repository. Contains per-type file counts, the directory-to-type mapping, any validation warnings, a readiness indicator (whether the repo contains any usable files), and source repository attribution for each discovered file to handle duplicates across repositories.
- **DirectoryMapping**: Associates a discovered directory path with the file types found within it. A single directory may contain multiple file types.
- **FileTypeRule**: Defines a naming convention pattern and its corresponding file type. Used as the basis for file classification.

## Clarifications

### Session 2026-02-13

- Q: When multiple repositories contain files with the same name/type, how are duplicates handled? → A: Both files are included in the catalog, each tagged with its source repository, allowing users to select the version they prefer.
- Q: Where is the validation report exposed? → A: Integrated into the `StructureAnalysisResult` object as part of the standard catalog indexing pipeline, accessible to both programmatic and CLI consumers.
- Q: Should directory scan depth be configurable or fixed? → A: Configurable globally via `RepositoryManager` configuration, applying to all repositories, with a default of 3 levels.
- Q: Do path overrides bypass naming convention filtering? → A: No; naming convention filtering is always applied. Path overrides only restrict which directories are scanned.
- Q: When should validation warnings be raised? → A: Warn when repo contains zero recognized files OR any examined directory yields zero matches; also report explicit errors (API failures, auth errors) without suppressing them.
- Q: What's the difference between User Story 1 and User Story 2? → A: Story 1 addresses the discovery phase (WHERE to look — scanning without hardcoded paths), while Story 2 addresses the classification phase (WHAT each file is — applying naming conventions). They work together but solve separate concerns.
- Q: Should standalone SKILL.md files (not in a directory) be treated as skills? → A: No. Skills are folder-based structures; the entire directory constitutes the skill. A standalone SKILL.md file is excluded.

## Assumptions
- File naming conventions already established in the codebase (`*.instructions.md`, `*.prompt.md`, `*.agent.md`, `SKILL.md`, `*.cookbook.md`) are sufficient and authoritative for type detection.
- Repository owners are not expected to add metadata files or manifests to declare their structure; the system infers structure from conventions.
- The default scan depth of 3 levels is sufficient for the vast majority of repository structures while remaining API-efficient.
- Excluded directory names (`.git`, `node_modules`, etc.) are consistent across repositories and do not need per-repo customization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Custom repositories with non-standard directory structures have their files discovered and categorized correctly in 95% of cases where files follow the established naming conventions.
- **SC-002**: Users receive a clear validation report within 5 seconds of adding a new custom repository, indicating how many files were found per type and whether any issues were detected.
- **SC-003**: Repositories following the standard `awesome-copilot` structure continue to work identically with zero behavioral changes (full backward compatibility).
- **SC-004**: Structure analysis adds no more than 2 additional API calls beyond what the current indexing process uses for standard-structure repositories.
- **SC-005**: When a custom repository contains zero recognized files, users see a clear, actionable message explaining what naming conventions are expected rather than a silent empty result.
- **SC-006**: 100% of supported file types (instruction, prompt, agent, skill, cookbook) are correctly detected by naming convention regardless of directory placement.
