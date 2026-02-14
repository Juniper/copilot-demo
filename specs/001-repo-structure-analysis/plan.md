# Implementation Plan: Repository Structure Analysis

**Branch**: `001-repo-structure-analysis` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-repo-structure-analysis/spec.md`

## Summary

Add dynamic repository structure analysis to `@awesome-palette/core` so that custom repositories are discovered and classified by file naming conventions rather than hardcoded directory paths. A new `StructureAnalyzer` class uses the GitHub Git Trees API (single API call, recursive) to fetch the full repository tree, applies `FileTypeRule` patterns to classify files, produces a `StructureAnalysisResult` with per-type counts, directory mappings, and validation warnings, and integrates into the existing `RepositoryManager` indexing pipeline. Path overrides remain supported as an opt-in constraint on scanning scope.

## Technical Context

**Language/Version**: TypeScript (strict mode), ES2022 target, Node16 module resolution  
**Primary Dependencies**: None at runtime (`@awesome-palette/core` is dependency-free). `@types/node ^20` as devDep.  
**Storage**: In-memory caching (existing `Map`-based cache in `RepositoryManager`). No persistent storage.  
**Testing**: Node.js built-in test runner (`node --test`). Integration tests for scan workflows; unit tests for naming convention matching.  
**Target Platform**: Platform-agnostic core library consumed by VS Code extension (`packages/vscode`) and CLI (`packages/cli`).  
**Project Type**: Monorepo — `packages/core`, `packages/vscode`, `packages/cli`  
**Performance Goals**: Structure analysis completes within 5 seconds (SC-002). ≤2 additional API calls beyond current indexing for standard repos (SC-004). Git Trees API provides single-call discovery.  
**Constraints**: GitHub API rate limits (60/hr unauthenticated, 5000/hr with token). Git Trees API truncates at 100k entries / 7MB response. Contents API limited to 1000 files per directory listing.  
**Scale/Scope**: Handful of configured repos (1–5 typical), each with tens to low hundreds of Copilot config files. Scan depth default 3 levels.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Platform-Agnostic Library First | PASS | All new code (`StructureAnalyzer`, `FileTypeRules`, types) lives in `@awesome-palette/core`. No VS Code or Node.js platform imports. GitHub API requests delegated via injectable function interface. |
| II | Lightweight Testing | PASS | Integration tests for discovery+classification workflow. Unit tests for `FileTypeRule` matching (complex pattern logic). No coverage mandates. |
| III | Dependency Direction Rule | PASS | New code is in core. Adapters (vscode, cli) consume via existing exports. No reverse dependencies. |
| IV | Strict TypeScript Required | PASS | All new types fully defined. `strict: true` inherited from `tsconfig.base.json`. GitHub API responses typed with `GitHubApiResponse` (existing pattern for opaque external data). |
| V | Pre-1.0 Flexibility | PASS | Core is 0.1.0. New types and interface extensions are non-breaking additions. `OnlineRepository` field additions are optional. Existing `RepositoryIndex` extended with optional `structureAnalysis` field. |

**Gate result: PASS — no violations. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-repo-structure-analysis/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interface contracts)
│   ├── analyzer-types.ts
│   └── config-extensions.ts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/core/src/
├── analyzer/                    # NEW — Structure analysis module
│   ├── StructureAnalyzer.ts     # Core analysis class
│   └── FileTypeRules.ts         # Naming convention rules
├── catalog/
│   ├── CatalogManager.ts        # UNCHANGED
│   └── entries.ts               # UNCHANGED
├── defaults/
│   ├── ConsoleLogger.ts         # UNCHANGED
│   └── NodeFileSystem.ts        # UNCHANGED
├── installer/
│   └── FileInstaller.ts         # UNCHANGED
├── interfaces/
│   ├── Config.ts                # MODIFIED — RepositoryConfig extended with path overrides
│   ├── FileSystem.ts            # UNCHANGED
│   └── Logger.ts                # UNCHANGED
├── repository/
│   └── RepositoryManager.ts     # MODIFIED — delegates discovery to StructureAnalyzer
├── types/
│   ├── analyzer.ts              # NEW — StructureAnalysisResult, DirectoryMapping, etc.
│   ├── catalog.ts               # UNCHANGED
│   ├── index.ts                 # MODIFIED — re-exports new analyzer types
│   ├── installer.ts             # UNCHANGED
│   └── repository.ts            # MODIFIED — OnlineRepository + RepositoryManagerConfig extended
└── index.ts                     # MODIFIED — exports StructureAnalyzer + new types
```

**Structure Decision**: Follows existing monorepo layout. New `analyzer/` module added alongside existing `catalog/`, `repository/`, `installer/` modules. All changes in `packages/core/src/` per Constitution Principle I.

## Complexity Tracking

> No constitution violations detected. This section is intentionally empty.
