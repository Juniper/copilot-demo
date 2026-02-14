# Data Model: Repository Structure Analysis

**Feature**: 001-repo-structure-analysis  
**Date**: 2026-02-13  
**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

## Entity Relationship Overview

```text
┌─────────────────────────┐
│   RepositoryManager     │
│  (existing, modified)   │
│                         │
│  repositories: Map      │
│  indexes: Map           │──────────── owns ────────────┐
│  structureAnalyzer      │                               │
└──────────┬──────────────┘                               ▼
           │ delegates                        ┌───────────────────────┐
           ▼                                  │   RepositoryIndex     │
┌─────────────────────────┐                   │  (existing, extended) │
│   StructureAnalyzer     │                   │                       │
│      (NEW)              │                   │  files: RemoteFile[]  │
│                         │──── produces ────►│  structureAnalysis?:  │
│  analyze(repo, config)  │                   │   StructureAnalysis   │
│  classifyFile(name)     │                   │       Result          │
└──────────┬──────────────┘                   └───────────────────────┘
           │ uses                                         │
           ▼                                              │ contains
┌─────────────────────────┐                               ▼
│   FileTypeRule[]        │                   ┌───────────────────────┐
│      (NEW)              │                   │ StructureAnalysis     │
│                         │                   │       Result          │
│  pattern: RegExp        │                   │      (NEW)            │
│  type: FileType         │                   │                       │
│  priority: number       │                   │  discoveredFiles[]    │
│  description: string    │                   │  directoryMappings[]  │
└─────────────────────────┘                   │  warnings[]           │
                                              │  rootCopilot          │
                                              │   Instructions?       │
                                              │  statistics           │
                                              └──────────┬────────────┘
                                                         │ contains
                                              ┌──────────┴────────────┐
                                              ▼                       ▼
                                  ┌──────────────────┐  ┌─────────────────┐
                                  │ DirectoryMapping  │  │ AnalysisWarning │
                                  │    (NEW)          │  │    (NEW)        │
                                  │                   │  │                 │
                                  │  directoryPath    │  │  code           │
                                  │  fileTypes[]      │  │  message        │
                                  │  fileCount        │  │  directoryPath? │
                                  └──────────────────┘  └─────────────────┘
```

## New Entities

### StructureAnalysisResult

The primary output of analyzing a repository's structure. Produced by `StructureAnalyzer.analyze()` and attached to `RepositoryIndex`.

| Field | Type | Description |
|-------|------|-------------|
| `repository` | `string` | Repository identifier (`owner/repo`) |
| `discoveredFiles` | `DiscoveredFile[]` | All files that matched a naming convention |
| `directoryMappings` | `DirectoryMapping[]` | Per-directory summary of which types were found |
| `skippedDirectories` | `string[]` | Directories excluded from scanning (matched exclusion list) |
| `scannedDirectories` | `string[]` | Directories that were examined |
| `warnings` | `AnalysisWarning[]` | Validation warnings and errors |
| `rootCopilotInstructions` | `DiscoveredFile \| null` | `copilot-instructions.md` at repo root, if found |
| `githubCopilotInstructions` | `DiscoveredFile \| null` | `.github/copilot-instructions.md`, if found |
| `statistics` | `AnalysisStatistics` | Per-type counts |
| `analyzedAt` | `Date` | Timestamp of analysis |
| `treeWasTruncated` | `boolean` | Whether the Git Trees API response was truncated |
| `isUsable` | `boolean` | `true` if at least one file was discovered |

### DiscoveredFile

A file found during structure analysis, before conversion to `RemoteFile`.

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Full path within repository (e.g., `guides/python.instructions.md`) |
| `name` | `string` | Filename only (e.g., `python.instructions.md`) |
| `type` | `FileType` | Classified type based on naming convention |
| `sha` | `string` | Git blob SHA |
| `size` | `number` | File size in bytes |
| `directory` | `string` | Parent directory path (e.g., `guides`) |
| `depth` | `number` | Nesting depth from root (0 = root, 1 = first-level dir, etc.) |

### DirectoryMapping

Associates a directory path with the file types discovered within it.

| Field | Type | Description |
|-------|------|-------------|
| `directoryPath` | `string` | Directory path relative to repo root |
| `depth` | `number` | Nesting depth |
| `fileTypes` | `FileType[]` | Distinct types found in this directory |
| `fileCount` | `number` | Total recognized files in this directory |
| `hasMixedTypes` | `boolean` | `true` if directory contains multiple file types |

### FileTypeRule

Defines a naming convention pattern and its corresponding file type.

| Field | Type | Description |
|-------|------|-------------|
| `pattern` | `RegExp` | Pattern matched against filename (case-insensitive) |
| `type` | `FileType` | The classified type when pattern matches |
| `priority` | `number` | Evaluation order (lower = checked first, higher priority) |
| `description` | `string` | Human-readable description of the rule |

### AnalysisWarning

A diagnostic message generated during analysis.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `AnalysisWarningCode` | Machine-readable warning code |
| `message` | `string` | Human-readable description |
| `directoryPath` | `string \| undefined` | Relevant directory, if applicable |
| `severity` | `'warning' \| 'error'` | Warning (non-blocking) or error (structural issue) |

### AnalysisStatistics

Per-type file counts from the analysis.

| Field | Type | Description |
|-------|------|-------------|
| `totalFiles` | `number` | Total recognized files |
| `instructions` | `number` | Count of instruction files |
| `prompts` | `number` | Count of prompt files |
| `agents` | `number` | Count of agent files |
| `skills` | `number` | Count of skill directories |
| `cookbooks` | `number` | Count of cookbook files |
| `unrecognized` | `number` | Files examined but not matching any convention |

### AnalyzerConfig

Configuration for the structure analyzer, extracted from `RepositoryManagerConfig`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxScanDepth` | `number` | `3` | Maximum directory nesting depth to scan |
| `excludedDirectories` | `string[]` | *(see research.md RQ-7)* | Directory prefixes to skip |

## Extended Entities

### OnlineRepository (extended)

Existing fields preserved. No fields removed.

| New/Modified Field | Type | Description |
|-------------------|------|-------------|
| *(all existing fields)* | — | Unchanged |

The existing `instructionsPath`, `promptsPath`, `agentsPath`, `skillsPath`, `cookbooksPath` fields are reinterpreted as **path overrides**. When set, they constrain scanning to those directories only for the given type. When absent (`undefined`), auto-discovery via `StructureAnalyzer` applies.

### RepositoryConfig (extended)

| New Field | Type | Description |
|-----------|------|-------------|
| `pathOverrides` | `PathOverrides \| undefined` | Optional per-type directory overrides |

### PathOverrides

| Field | Type | Description |
|-------|------|-------------|
| `instructions` | `string \| undefined` | Override directory for instruction files |
| `prompts` | `string \| undefined` | Override directory for prompt files |
| `agents` | `string \| undefined` | Override directory for agent files |
| `skills` | `string \| undefined` | Override directory for skill directories |
| `cookbooks` | `string \| undefined` | Override directory for cookbook files |

### RepositoryManagerConfig (extended)

| New Field | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxScanDepth` | `number` | `3` | Maximum directory depth for structure analysis (FR-009) |
| `excludedDirectories` | `string[]` | *(fixed list)* | Directory prefixes excluded from scanning (FR-010) |

### RepositoryIndex (extended)

| New Field | Type | Description |
|-----------|------|-------------|
| `structureAnalysis` | `StructureAnalysisResult \| undefined` | Analysis result, attached when auto-discovery was used |

## Enumerations

### FileType

```text
'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook' | 'copilot-instruction'
```

The existing `'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook'` union is extended with `'copilot-instruction'` for root-level `copilot-instructions.md` files. The `'other'` type on existing `RemoteFile` is preserved for backward compatibility but not emitted by the analyzer.

### AnalysisWarningCode

| Code | Severity | When Emitted |
|------|----------|-------------|
| `NO_RECOGNIZED_FILES` | warning | Repository contains zero files matching any naming convention (FR-011b.a) |
| `EMPTY_DIRECTORY` | warning | A scanned directory yielded zero file matches (FR-011b.b) |
| `TREE_TRUNCATED` | warning | Git Trees API response was truncated (>100k entries) |
| `API_ERROR` | error | GitHub API returned an error (4xx/5xx) |
| `AUTH_REQUIRED` | error | Repository is private and no token is configured |
| `PATH_OVERRIDE_NOT_FOUND` | warning | A configured path override points to a non-existent directory |
| `STANDALONE_SKILL_MD` | warning | A `SKILL.md` file found outside a directory context (excluded per spec) |

## State Transitions

### Analysis Lifecycle

```text
                    ┌────────────┐
                    │ NOT_ANALYZED│ (initial state for new repos)
                    └──────┬─────┘
                           │ indexRepository() called
                           ▼
                    ┌────────────┐
                    │  ANALYZING │ (StructureAnalyzer.analyze() in progress)
                    └──────┬─────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             ┌────────────┐ ┌──────────┐
             │  ANALYZED   │ │  FAILED  │ (API error, auth error)
             │  (isUsable) │ │          │
             └──────┬──────┘ └──────┬───┘
                    │               │
                    │  cache TTL    │  retry after TTL
                    │  expires      │
                    ▼               ▼
             ┌────────────────────────┐
             │     STALE              │ (re-analyze on next access)
             └────────────────────────┘
```

## Validation Rules

1. **File naming conventions** are the authoritative type signal (FR-003). Directory names provide no classification weight.
2. **Standalone `SKILL.md`** at root depth (no parent directory other than root) is **excluded** — skills must be folder-based.
3. **`copilot-instructions.md`** is only recognized at repo root (`depth: 0`) or under `.github/` (`depth: 1, directory: '.github'`).
4. **Path overrides bypass auto-discovery** for the overridden type, but naming convention filtering still applies within the overridden directory (FR-007).
5. **Depth filtering**: Entries deeper than `maxScanDepth` are excluded from classification.
6. **Excluded directories**: Any entry whose path starts with an excluded prefix is skipped before classification.
