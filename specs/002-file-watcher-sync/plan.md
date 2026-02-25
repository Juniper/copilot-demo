# Implementation Plan: File Watcher for Installation State Sync

**Branch**: `002-file-watcher-sync` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-file-watcher-sync/spec.md`

## Summary

Add a filesystem watcher to the VS Code extension so that changes to files under `.github/` are automatically detected, installation statuses are recomputed via the existing `FileInstaller.getInstallationStatus()` API, and updated statuses are pushed to the open catalog panel and sidebar without user intervention. Also fix the "Refresh Catalog" command to refresh the catalog panel when it is already open. No new message types or core library changes are needed — the existing `installationStatusUpdate` webview protocol and `updateAllFileStatuses()` client-side handler already support this end-to-end.

## Technical Context

**Language/Version**: TypeScript (strict mode), ES2022 target, Node16 module resolution
**Primary Dependencies**: `vscode` API (specifically `vscode.workspace.createFileSystemWatcher`), `@awesome-palette/core` (existing `FileInstaller.getInstallationStatus()`)
**Storage**: N/A — all state is transient (in-memory panel reference + live filesystem reads)
**Testing**: Manual integration testing (VS Code extension host). No automated test infrastructure exists for the vscode package currently.
**Target Platform**: VS Code extension (^1.85.0), runs in extension host process
**Project Type**: Monorepo — VS Code extension adapter (`packages/vscode`) consuming core library (`packages/core`)
**Performance Goals**: Status re-check completes within 3 seconds of a filesystem event (SC-001). Debounce coalesces 20+ rapid events into ≤1 re-check cycle (SC-002).
**Constraints**: `getInstallationStatus()` does synchronous I/O per file (reads both source and target content for comparison). For typical catalogs (<200 entries), this is <100ms. Debouncing is required to prevent hammering the filesystem during bulk operations.
**Scale/Scope**: Single workspace folder. Typical catalog: 30–200 entries. File watcher monitors `.github/**` glob.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Platform-Agnostic Library First | PASS | All new code lives in `packages/vscode/` (extension adapter). No changes to `@awesome-palette/core`. The `FileSystemWatcher` is a VS Code platform API — it belongs in the adapter layer by definition. |
| II | Lightweight Testing | PASS | Manual integration testing via VS Code extension host. No automated tests for the vscode package exist currently; this feature does not introduce that requirement. |
| III | Dependency Direction Rule | PASS | `packages/vscode` depends on `@awesome-palette/core` (existing direction). No reverse dependency introduced. New code calls `FileInstaller.getInstallationStatus()` — a public core API. |
| IV | Strict TypeScript Required | PASS | All new code will be fully typed. `strict: true` is inherited from `tsconfig.json`. The `vscode.FileSystemWatcher` API is well-typed in `@types/vscode`. |
| V | Pre-1.0 Flexibility | PASS | Extension is 0.7.1. New public method on `CatalogWebviewProvider` is a non-breaking addition. No API contract changes to core. |
| VI | Security & Credential Handling | N/A | This feature does not handle credentials, tokens, or external API requests. Filesystem operations are local and read-only (status checking). |
| VII | Documentation Standards | PASS | CHANGELOG.md will be updated with task IDs. No new public API exports require JSDoc (internal extension code only). |
| VIII | Performance & API Efficiency | PASS | No external API calls. Local filesystem reads only, coalesced by debouncing. `getInstallationStatus()` performance is bounded by catalog size (~200 entries max × 2 reads each ≈ <100ms). |

**Gate result: PASS — no violations. Proceeding to Phase 0.**

## Phase 0: Research

### RQ-1: What glob pattern should the FileSystemWatcher use?

**Decision**: Use `**/.github/**` as the watcher glob pattern.

**Rationale**: The `_getTargetPath()` method in `FileInstaller.ts` maps file types to subdirectories under `.github/`: `instructions/`, `prompts/`, `agents/`, `skills/`, `cookbooks/`, and `copilot-instructions.md` directly in `.github/`. Rather than maintaining a parallel list of subdirectory names, a single `**/.github/**` glob catches all changes under `.github/` regardless of subdirectory. This also catches changes to files the user creates manually that don't match any catalog entry — the watcher fires, status re-check runs, and correctly finds no status change for those files.

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Separate watchers per subdirectory (`**/.github/instructions/**`, `**/.github/prompts/**`, etc.) | More complex, requires maintaining a list that must stay in sync with `FileInstaller._getTargetPath()`. No benefit — the single glob is handled efficiently by VS Code's file watcher infrastructure. |
| Watch only specific file extensions (`**/.github/**/*.md`) | Would miss directory-level changes (skill folder deletion). Also unnecessarily restrictive — the cost of watching all files under `.github/` is negligible. |

### RQ-2: How should debouncing work on the extension host side?

**Decision**: Use a simple `setTimeout`/`clearTimeout` closure pattern with a 500ms window, implemented inline in `extension.ts`.

**Rationale**: The codebase already uses this pattern in webview templates (`BaseTemplate.ts:366-376`). No third-party debounce library is needed. 500ms balances responsiveness (well within the 3-second SC-001 target) with efficiency (coalesces rapid `rm -rf` or auto-save events). The debounce timer is reset on each new event, so a burst of 20 events over 200ms triggers one re-check 500ms after the last event.

**Edge case analysis**:

| Scenario | Events | Debounce behavior | Result |
|----------|--------|--------------------|--------|
| Single file delete | 1 event | Timer starts, fires after 500ms | 1 status re-check |
| `rm -rf .github/instructions/` (20 files) | ~20 events over ~50ms | Timer resets 20 times, fires 500ms after last | 1 status re-check |
| Auto-save writing every 200ms for 2 seconds | ~10 events | Timer resets 10 times, fires 500ms after last save | 1 status re-check |
| Two separate edits 3 seconds apart | 2 events | First fires after 500ms, second fires after 500ms | 2 status re-checks (correct — these are distinct changes) |

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Throttle (fire immediately, then ignore for N ms) | First event triggers immediately before the full batch completes. A deletion of 20 files would trigger a re-check after the first file, showing partial results, then miss the remaining 19. |
| Leading + trailing debounce | Unnecessary complexity. A pure trailing debounce (fire after quiet period) is simpler and sufficient — the 500ms delay is imperceptible to users. |
| Event queue with batch processing | Over-engineering. The re-check already processes all catalog entries in one call — there's no need to track individual changed files. |

### RQ-3: How should the catalog panel expose a refresh method?

**Decision**: Add a public `refreshInstallationStatus()` method to `CatalogWebviewProvider` that re-checks status and posts the result to the webview if the panel is open.

**Rationale**: The private `_handleCheckInstallationStatus()` method already implements 90% of this logic (calls `getInstallationStatus()`, posts `installationStatusUpdate` message). The new public method follows the same pattern but sources the file list from `_collectCatalogData()` instead of receiving it as a parameter. This provides a self-contained "refresh everything" entry point that both the file watcher and the "Refresh Catalog" command can call.

**Design**:

```
public async refreshInstallationStatus(): Promise<void>
  if (!this._panel) return          // No-op if panel is closed (FR-006)
  catalogData = await _collectCatalogData()
  targetDir = _getTargetDir()
  if (!targetDir) return            // No workspace folder
  filesWithStatus = await _fileInstaller.getInstallationStatus(catalogData, targetDir)
  this._panel.webview.postMessage({ type: 'installationStatusUpdate', filesWithStatus })
```

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Make `_handleCheckInstallationStatus` public | It requires the caller to provide the file list, which the file watcher doesn't have. The watcher needs a self-contained method. |
| Event emitter on `CatalogWebviewProvider` | Over-engineering for a single caller (the watcher). Direct method call is simpler. Can extract to an event bus later if more consumers emerge. |
| Re-render full HTML via `show()` | Unnecessarily expensive. The `installationStatusUpdate` message triggers `updateAllFileStatuses()` in the webview, which updates status badges in-place without a full DOM rebuild. |

### RQ-4: What happens when the watcher fires but the panel is closed?

**Decision**: The `refreshInstallationStatus()` method checks `if (!this._panel) return` as its first line. The sidebar's `refresh()` method similarly checks `if (!this._view) return` internally. No errors, no wasted computation beyond the guard check.

**Edge cases**:

| State | Watcher fires? | Catalog refresh? | Sidebar refresh? |
|-------|----------------|-------------------|------------------|
| Panel open, sidebar visible | Yes | Yes (posts message) | Yes (full re-render) |
| Panel open, sidebar hidden | Yes | Yes (posts message) | No-op (no `_view`) |
| Panel closed, sidebar visible | Yes | No-op (no `_panel`) | Yes (full re-render) |
| Panel closed, sidebar hidden | Yes | No-op | No-op |
| No workspace folder | Watcher not registered | N/A | N/A |

### RQ-5: Should the sidebar also be refreshed on filesystem changes?

**Decision**: Yes — call `sidebarProvider.refresh()` alongside `catalogProvider.refreshInstallationStatus()` in the debounced handler.

**Rationale**: The sidebar displays aggregate statistics (installed count, available count) computed by `catalogManager.getEnhancedStatistics()`. If a file is deleted, the installed count must decrement. The existing `refresh()` method already handles this correctly (it re-renders with fresh stats). Although `refresh()` is a full HTML re-render, the sidebar is lightweight (no large table) and the debounce prevents rapid consecutive calls.

**Assumption**: `sidebarProvider.refresh()` is idempotent and safe to call when the sidebar is not visible (it guards on `this._view` internally).

### RQ-6: Does the `_collectCatalogData()` call in `refreshInstallationStatus()` trigger remote API requests?

**Decision**: It can — `_collectCatalogData()` calls `catalogManager.getEnhancedCatalog()` which may fetch from GitHub if the cache is stale. However, this is acceptable because:

1. The `CatalogManager` has its own caching layer with configurable TTL. Repeat calls within the TTL return cached data instantly.
2. The file watcher triggers local filesystem re-checks, not remote catalog refreshes. The remote data is only used to know which files *could* be installed — the actual status check is purely local (`FileInstaller.getInstallationStatus()` reads local files only).
3. If the cache is cold (rare — only on first call after TTL expiry), the remote fetch adds a few hundred milliseconds, still well within the 3-second target.

**Assumption**: In practice, the catalog panel was already open (which called `_collectCatalogData()` during rendering), so the cache is hot. The re-check call path is: debounce fires → `refreshInstallationStatus()` → `_collectCatalogData()` (cache hit) → `getInstallationStatus()` (local I/O) → `postMessage()`. Total: <200ms.

## Project Structure

### Documentation (this feature)

```text
specs/002-file-watcher-sync/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (inlined in plan — see above)
├── data-model.md        # Phase 1 output (minimal — no new entities)
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/vscode/src/
├── extension.ts                         # MODIFIED — register FileSystemWatcher + debounced handler,
│                                        #            fix "Refresh Catalog" command
├── providers/
│   ├── CatalogWebviewProvider.ts        # MODIFIED — add public refreshInstallationStatus() method
│   └── SidebarProvider.ts               # UNCHANGED — existing refresh() is sufficient
├── adapters/
│   ├── VSCodeConfig.ts                  # UNCHANGED
│   ├── VSCodeFileSystem.ts              # UNCHANGED
│   └── VSCodeLogger.ts                  # UNCHANGED
├── templates/
│   ├── BaseTemplate.ts                  # UNCHANGED
│   └── CatalogTemplate.ts              # UNCHANGED — webview already handles installationStatusUpdate
└── types.ts                             # UNCHANGED — existing MessageType.INSTALLATION_STATUS_UPDATE
                                         #              is sufficient

packages/core/src/
└── (NO CHANGES — all core code is unchanged)
```

**Structure Decision**: Changes are confined to `packages/vscode/src/` (the VS Code adapter layer), consistent with Constitution Principle I. Only 2 files are modified: `extension.ts` (watcher registration + command fix) and `CatalogWebviewProvider.ts` (new public method). No new files are created.

## Assumptions

These assumptions were made during research and design. If any prove incorrect, the implementation may need adjustment.

1. **`sidebarProvider.refresh()` is safe to call when the sidebar view is not visible.** Based on reading the code, `refresh()` guards on `this._view` internally. If `_view` is undefined, it returns without error.

2. **`_collectCatalogData()` returns quickly on cache-hit.** The catalog cache TTL ensures that repeated calls don't trigger redundant GitHub API requests. In the file-watcher path, the panel was already open (triggering a prior `_collectCatalogData()` call), so the cache is expected to be hot.

3. **`FileInstaller.getInstallationStatus()` completes in <100ms for typical catalogs (<200 entries).** Each entry requires at most 2 filesystem reads (source content + target content). At ~0.5ms per read on SSD, 200 entries × 2 reads = ~200ms worst case. Debouncing at 500ms provides adequate buffer.

4. **VS Code's `FileSystemWatcher` fires events for changes within `.github/` even if the directory does not exist at registration time.** The `**/.github/**` glob pattern is evaluated dynamically by VS Code's file watcher infrastructure. If `.github/` is created after the watcher is registered, subsequent changes within it are detected.

5. **The webview's `updateAllFileStatuses()` function handles receiving the same status data multiple times idempotently.** Calling it twice with the same `filesWithStatus` array produces no visual change — it replaces the `allFiles` array and re-renders, which is a no-op if data is unchanged.

6. **A single `refreshInstallationStatus()` call is sufficient for both the file watcher and the "Refresh Catalog" command.** Both callers need the same behavior: recompute all statuses and push to the webview. No caller-specific logic is needed.

## Potential Edge Cases & Mitigations

| Edge Case | Risk | Mitigation |
|-----------|------|------------|
| User deletes `.github/` itself | Medium — watcher may not fire for the directory itself on all platforms | The debounced handler calls `getInstallationStatus()` which checks file existence; all entries correctly return `'available'`. If the watcher doesn't fire, the status stays stale until the next explicit refresh. |
| Panel is disposed during async `refreshInstallationStatus()` | Low — race condition if panel closes between `_collectCatalogData()` and `postMessage()` | Check `this._panel` again before `postMessage()`. If panel was disposed mid-flight, `this._panel` is `undefined` (set in the dispose listener) and the method returns silently. |
| `_collectCatalogData()` throws during cache refresh | Low — network error during catalog fetch | Wrap in try/catch. On error, log a warning and skip the status update. The user can retry via "Refresh Catalog". |
| VS Code restarts the extension host | N/A — all state is re-created on `activate()` | The watcher is registered in `activate()`, so it's re-created on every activation. No persistent state to recover. |
| Multi-root workspace | Low — current code uses `workspaceFolders[0]` only | Consistent with existing behavior. The watcher glob `**/.github/**` would fire for `.github/` in any root, but `_getTargetDir()` always returns the first root. Future multi-root support is out of scope. |
| Watcher event for non-`.md` files (e.g., `.github/.DS_Store`) | Negligible — watcher fires, status re-check runs, finds no catalog matches | The `getInstallationStatus()` call is idempotent — it checks exact target paths for known catalog entries. Non-catalog files don't affect any status. The debounce prevents excessive calls from frequent `.DS_Store` writes. |

## Complexity Tracking

> No constitution violations detected. This section is intentionally empty.
