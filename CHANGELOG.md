# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.2] - 2026-02-24

### Added
- **[T001]** Created comprehensive analyzer type definitions in `packages/core/src/types/analyzer.ts`
  - `FileType` union type with 6 file types: `instruction`, `prompt`, `agent`, `skill`, `cookbook`, `copilot-instruction`
  - `FileTypeRule` interface for defining naming convention patterns
  - `DiscoveredFile` interface for representing files found during analysis
  - `DiscoveredSkill` and `DiscoveredSkillFile` interfaces for skill directory representation
  - `DirectoryMapping` interface for per-directory type summaries
  - `AnalysisWarningCode` union type with 7 diagnostic codes
  - `AnalysisWarning` interface for analysis diagnostics with severity levels
  - `AnalysisStatistics` interface for per-type file counts
  - `StructureAnalysisResult` interface as the primary analysis output type
  - `AnalyzerConfig` interface for configuring scan depth and exclusions
  - `GitHubApiRequestFn` type for injectable API request handling
  - `IStructureAnalyzer` interface defining the public analyzer API
  - All interfaces use `readonly` fields for immutability
  - All types exported via `packages/core/src/types/index.ts`
- **[T002]** Added `PathOverrides` interface to `packages/core/src/interfaces/Config.ts` with optional fields for overriding paths to instructions, prompts, agents, skills, and cookbooks directories
- **[T002]** Extended `RepositoryConfig` interface with optional `pathOverrides?: PathOverrides` field to support per-repository path customization
  - New field is backward-compatible (optional)
  - All existing fields (`owner`, `repo`, `branch`, `enabled`) remain unchanged
  - `PaletteConfig` interface remains unmodified
- **[T003]** Extended `RepositoryManagerConfig` interface in `packages/core/src/types/repository.ts`
  - Added `maxScanDepth: number` field (default: 3) for controlling directory scan depth
  - Added `excludedDirectories: string[]` field with 16 default exclusions: `.git/`, `node_modules/`, `.github/workflows/`, `dist/`, `build/`, `__pycache__/`, `.venv/`, `.env/`, `vendor/`, `coverage/`, `.next/`, `.nuxt/`, `out/`, `target/`, `bin/`, `obj/`
  - Updated `RepositoryManager` constructor to initialize these fields with appropriate defaults
  - All existing fields (`enableOnlineFetching`, `defaultCacheTtl`, `indexRefreshInterval`, `maxFileSize`, `requestTimeout`, `userAgent`, `githubToken`) remain unchanged
- **[T003]** Extended `RepositoryIndex` interface in `packages/core/src/types/repository.ts`
  - Added optional `structureAnalysis?: StructureAnalysisResult` field for storing structure analysis results
  - Imported `StructureAnalysisResult` type from `./analyzer.js`
  - All existing fields (`repository`, `files`, `indexedAt`, `ttl`, `isValid`, `stats`) remain unchanged
  - `createDefaultConfig()` function remains unmodified
- **[T005]** Created `FileTypeRules` module in `packages/core/src/analyzer/FileTypeRules.ts`
  - Exported `DEFAULT_FILE_TYPE_RULES` constant array with 6 classification rules sorted by priority:
    - Priority 1: `SKILL.md` exact match (case-insensitive) → `skill` type
    - Priority 2: `copilot-instructions.md` exact match (case-insensitive) → `copilot-instruction` type
    - Priority 3: `*.instructions.md` or `*.instruction.md` → `instruction` type
    - Priority 4: `*.prompt.md` → `prompt` type
    - Priority 5: `*.agent.md` → `agent` type
    - Priority 6: `*.cookbook.md` → `cookbook` type
  - Exported `classifyFile(fileName, rules?)` function for file type classification
    - Handles ambiguous filenames (e.g., `testing.instructions.prompt.md`) by matching rightmost (most specific) suffix
    - Returns matched `FileType` or `undefined` if no rule matches
    - Supports optional custom rules array (defaults to `DEFAULT_FILE_TYPE_RULES`)
    - Implements proper case-insensitive matching for all patterns
  - Exported `DEFAULT_EXCLUDED_DIRECTORIES` constant array with 16 directory exclusions:
    - `.git/`, `node_modules/`, `.github/workflows/`, `dist/`, `build/`, `__pycache__/`, `.venv/`, `.env/`, `vendor/`, `coverage/`, `.next/`, `.nuxt/`, `out/`, `target/`, `bin/`, `obj/`
  - All 23 test cases pass including exact matches, suffix patterns, rightmost matching, and edge cases
- **[T006]** Created `StructureAnalyzer` class in `packages/core/src/analyzer/StructureAnalyzer.ts` (670 lines)
  - Core component for analyzing repository structure using the Git Trees API
  - Implements `IStructureAnalyzer` interface with two public methods:
    - `analyze(owner, repo, branch?, config?)` - Performs comprehensive repository structure analysis
    - `classifyFile(fileName)` - Delegates to `FileTypeRules.classifyFile()` for single file classification
  - Constructor accepts `Logger` and `GitHubApiRequestFn` for dependency injection
  - **Step-by-step analysis algorithm:**
    1. **API Call**: Constructs `/repos/{owner}/{repo}/git/trees/{branch}?recursive=1` URL and fetches tree
    2. **Error Handling**: Catches API errors, detects 401/403 auth errors, returns `AUTH_REQUIRED` or `API_ERROR` warnings
    3. **Truncation Check**: Detects `response.truncated` field and adds `TREE_TRUNCATED` warning if true
    4. **Configuration**: Merges provided config with defaults (`maxScanDepth: 3`, `excludedDirectories: DEFAULT_EXCLUDED_DIRECTORIES`)
    5. **Filter Tree Entries**: Filters by depth (counts `/` separators), excludes directories, only processes `type: 'blob'` entries
    6. **File Classification**: Calls `classifyFile()` on each blob's filename, creates `ProcessedFile` objects with path, type, sha, size, depth
    7. **Skill Directory Detection**: Finds `SKILL.md` markers, validates not at root (adds `STANDALONE_SKILL_MD` warning), groups sibling files, creates `DiscoveredSkill` objects, removes from main file list
    8. **copilot-instructions.md Detection**: Extracts root `copilot-instructions.md` and `.github/copilot-instructions.md` as special fields
    9. **Directory Mappings**: Groups remaining files by parent directory, calculates `fileTypes`, `fileCount`, `hasMixedTypes`, `depth` for each directory
    10. **Statistics**: Counts files by type (`instructions`, `prompts`, `agents`, `cookbooks`), counts skill directories
    11. **Warnings**: Adds `NO_RECOGNIZED_FILES` warning if no files/skills discovered
    12. **isUsable Flag**: Sets to `true` if any files or skills discovered
    13. **Result**: Returns complete `StructureAnalysisResult` with all fields populated
  - **Private helper methods:**
    - `_buildErrorResult()` - Creates error result with appropriate warning
    - `_filterTreeEntries()` - Implements depth and exclusion filtering
    - `_classifyFiles()` - Classifies all filtered entries
    - `_detectSkillDirectories()` - Detects skill directories with SKILL.md markers
    - `_extractCopilotInstructions()` - Extracts special copilot-instructions.md files
    - `_buildDirectoryMappings()` - Groups files by directory and builds mappings
    - `_buildStatistics()` - Calculates per-type file counts
    - `_extractSkippedDirectories()` - Identifies directories excluded by filters
    - `_extractScannedDirectories()` - Identifies directories that were scanned
    - `_calculateDepth()` - Counts `/` separators to determine nesting depth
    - `_extractFileName()` - Gets last path segment
    - `_extractDirectory()` - Gets parent directory path
  - **Error recovery**: Always returns valid `StructureAnalysisResult`, even on API failures
  - **Logging**: Uses `Logger` for progress (`info`), warnings (`warn`), and errors (`error`)
  - **Type safety**: All imports use `type` keyword, proper TypeScript types throughout
  - **Depth calculation**: Root files (no `/`) = depth 0, `dir/file.md` = depth 1, `dir/subdir/file.md` = depth 2
  - **Rightmost matching**: Delegates to `classifyFile()` which handles ambiguous filenames correctly
  - **Edge cases handled**: Standalone SKILL.md, empty repositories, API errors, truncated responses, excluded directories, depth limits
  - TypeScript compilation successful with no errors
- **[T007]** Integrated `StructureAnalyzer` into `RepositoryManager` (`packages/core/src/repository/RepositoryManager.ts`)
  - **Added imports:**
    - `PathOverrides` from `../interfaces/Config.js`
    - `StructureAnalysisResult`, `DiscoveredFile`, `DiscoveredSkill`, `DiscoveredSkillFile` from `../types/analyzer.js`
    - `StructureAnalyzer` from `../analyzer/StructureAnalyzer.js`
    - `classifyFile`, `DEFAULT_EXCLUDED_DIRECTORIES` from `../analyzer/FileTypeRules.js`
  - **Constructor changes:**
    - Instantiated `StructureAnalyzer` and stored as private field `_structureAnalyzer`
    - Created API request adapter function to bridge `makeGitHubApiRequest` signature with `GitHubApiRequestFn` type
    - Passed logger and adapter to `StructureAnalyzer` constructor
    - Replaced hardcoded `excludedDirectories` array with `DEFAULT_EXCLUDED_DIRECTORIES` import
    - `maxScanDepth: 3` already present (no change needed)
  - **Updated `initializeDefaultRepositories()` method:**
    - Detects default `github/awesome-copilot` repository using `owner === 'github' && repo === 'awesome-copilot'`
    - When `pathOverrides` is provided: sets `instructionsPath`, `promptsPath`, `agentsPath`, `skillsPath`, `cookbooksPath` from override fields
    - When `pathOverrides` is absent AND repo is default: keeps hardcoded paths (`instructions`, `prompts`, `agents`, `skills`, `cookbook`) for backward compatibility (FR-012)
    - When `pathOverrides` is absent AND repo is NOT default: leaves all paths `undefined` to trigger auto-discovery
  - **Replaced `indexRepository()` method with three-path strategy:**
    - **Auto-discovery path** (when all paths are `undefined`):
      - Calls `_structureAnalyzer.analyze()` with owner, repo, branch, maxScanDepth, excludedDirectories
      - Checks `isUsable` flag; if false, logs warnings and returns failed index
      - Converts `DiscoveredFile[]` to `RemoteFile[]` via `_convertDiscoveredFilesToRemoteFiles()`
      - Converts `DiscoveredSkill[]` to `RemoteFile[]` via `_convertDiscoveredSkillsToRemoteFiles()`
      - Attaches `analysisResult` to `RepositoryIndex.structureAnalysis` field
      - Returns complete `RepositoryIndex` with auto-discovered files
    - **Override/Legacy path** (when any path is defined):
      - Loops through path fields (`instructionsPath`, `promptsPath`, etc.)
      - For paths that are defined: calls existing `indexDirectory()` method
      - For paths that are `undefined`: skips that type (could be extended to hybrid mode)
      - Returns `RepositoryIndex` using override paths
    - **Hybrid detection**: Method checks if any path is set to choose between auto-discovery and override mode
  - **Added helper methods:**
    - `_indexWithAutoDiscovery()` - Implements auto-discovery using StructureAnalyzer
    - `_indexWithPathOverrides()` - Implements override/legacy indexing
    - `_convertDiscoveredFilesToRemoteFiles()` - Converts `DiscoveredFile[]` to `RemoteFile[]`
      - Builds `downloadUrl` as `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
      - Maps all fields: `path`, `name`, `type`, `sha`, `size`, `downloadUrl`, `repository`, `lastIndexed`
      - Handles special case: `copilot-instruction` type maps to `instruction` for RemoteFile
      - Sets `isFolder: false` for all files
    - `_convertDiscoveredSkillsToRemoteFiles()` - Converts `DiscoveredSkill[]` to `RemoteFile[]`
      - Sets `isFolder: true` for skill directories
      - Maps `files` array from `DiscoveredSkillFile[]` to `RemoteSkillFile[]` format
      - Builds downloadUrls for nested files using same pattern as regular files
      - Maps skill metadata: `name`, `directoryPath`, `totalSize`
  - **Updated `isValidFileForType()` method:**
    - Delegates to `classifyFile()` function for consistency with StructureAnalyzer
    - Handles special case: `copilot-instruction` type is treated as valid for `instruction` type
    - Removes hardcoded pattern matching logic (replaced with centralized classification)
  - **Error handling:**
    - If `analyze()` returns `isUsable: false`, logs all warnings and creates failed index
    - Wraps all indexing logic in try-catch to prevent crashes
    - Returns valid (but possibly empty) indexes on errors
  - **Backward compatibility:**
    - Default `github/awesome-copilot` repository MUST keep hardcoded paths (FR-012)
    - Existing repositories without pathOverrides continue working as before
    - All existing functionality preserved (downloadFileContent, getEnhancedCatalog, etc.)
  - TypeScript compilation successful with no errors
- **[file-watcher-sync]** Added `refreshInstallationStatus()` public method to `CatalogWebviewProvider` (`packages/vscode/src/providers/CatalogWebviewProvider.ts`)
  - Pushes an `installationStatusUpdate` message to the catalog panel webview with fresh installation statuses
  - Self-sources the file list via `_collectCatalogData()` — no arguments required, making it callable from external contexts
  - No-op if the panel is not open (FR-006): guards `this._panel` before and after the async work
  - Double-checks `this._panel` after `_collectCatalogData()` to handle race condition where panel is disposed during async work
  - Wraps in try/catch; logs warning via `this._logger.warn()` on failure (e.g., network error during cache refresh)
- **[file-watcher-sync]** Registered `FileSystemWatcher` for `.github/**` in `packages/vscode/src/extension.ts`
  - Watches for file creation, modification, and deletion under any `.github/` directory in the workspace
  - Uses a 500 ms trailing-edge debounce to coalesce rapid successive file events (e.g., bulk installs/deletes)
  - Debounced handler calls `catalogProvider.refreshInstallationStatus()` and `sidebarProvider.refresh()` in sequence
  - Watcher registered unconditionally in `activate()` and pushed to `context.subscriptions` for automatic disposal on extension deactivation (FR-005, FR-008)
  - Satisfies US1 (deletion detection) and US2 (creation/modification detection)
- **[T008]** Updated public API exports in `packages/core/src/index.ts` to expose new analyzer functionality
  - **Value exports (classes, functions, constants):**
    - `StructureAnalyzer` class from `./analyzer/StructureAnalyzer.js`
    - `classifyFile` function from `./analyzer/FileTypeRules.js`
    - `DEFAULT_FILE_TYPE_RULES` constant from `./analyzer/FileTypeRules.js`
  - **Type exports:**
    - `PathOverrides` type from `./interfaces/Config.js` (added to existing Config interface exports)
    - All analyzer types from `./types/analyzer.js`: `FileType`, `FileTypeRule`, `DiscoveredFile`, `DiscoveredSkill`, `DiscoveredSkillFile`, `DirectoryMapping`, `AnalysisWarningCode`, `AnalysisWarning`, `AnalysisStatistics`, `StructureAnalysisResult`, `AnalyzerConfig`, `GitHubApiRequestFn`, `IStructureAnalyzer`
  - **Organization:**
    - Added new "Analyzer utilities" section for `classifyFile` and `DEFAULT_FILE_TYPE_RULES`
    - Grouped analyzer types in the existing "Types" section
    - Followed existing export patterns (grouped by module/category)
  - **Verification:**
    - All existing exports remain unchanged
    - Type vs value exports correctly distinguished
    - Export paths use `.js` extensions for ESM compatibility
  - **Developer experience:**
    - Users can now import analyzer functionality: `import { StructureAnalyzer, classifyFile, PathOverrides, FileType } from '@awesome-palette/core';`
    - All new analyzer features are now part of the public API

### Changed
_(No changes)_

### Deprecated
_(No deprecations)_

### Removed
_(No removals)_

### Fixed
- **[file-watcher-sync]** Fixed "Refresh Catalog" command (`awesome-palette.refreshCatalog`) to also refresh installation status in the catalog panel when it is open (`packages/vscode/src/extension.ts`)
  - Previously the command cleared the cache and refreshed the sidebar only; the catalog panel was left stale
  - Now calls `await catalogProvider.refreshInstallationStatus()` as a third step after `sidebarProvider.refresh()`
  - If the catalog panel is not open the call is a no-op — no forced panel open (FR-004)
  - Satisfies US3

### Security
_(No security updates)_

---

## Previous Versions

_(No previous versions documented yet)_
