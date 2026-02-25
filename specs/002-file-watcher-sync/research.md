# Research: File Watcher for Installation State Sync

**Feature**: 002-file-watcher-sync | **Date**: 2026-02-24

## RQ-1: FileSystemWatcher Glob Pattern

**Decision**: `**/.github/**`

**Rationale**: Covers all subdirectories where catalog files can be installed (`instructions/`, `prompts/`, `agents/`, `skills/`, `cookbooks/`, and root-level `copilot-instructions.md`). A single glob avoids maintaining a parallel list of paths that must stay in sync with `FileInstaller._getTargetPath()`.

**Alternatives considered**:

- Per-subdirectory watchers — more complex, no benefit, must stay in sync with _getTargetPath mapping
- Extension-filtered glob (`**/.github/**/*.md`) — misses directory-level operations (skill folder deletion)

## RQ-2: Extension-Side Debounce Strategy

**Decision**: `setTimeout`/`clearTimeout` closure with 500ms trailing debounce, implemented inline in `extension.ts`.

**Rationale**: The codebase already uses this pattern client-side in `BaseTemplate.ts` (lines 366-376). No library needed. 500ms coalesces rapid bulk operations (e.g., `rm -rf .github/instructions/` fires ~20 events over ~50ms → one re-check 500ms after the last event) while staying well within the 3-second responsiveness target (SC-001).

**Alternatives considered**:

- Throttle (fire immediately + ignore) — triggers on first event of a batch, shows partial results
- Leading + trailing debounce — unnecessary complexity for this use case
- Third-party debounce library — no library is in the project; not worth adding for one call site

## RQ-3: Catalog Panel Refresh Method

**Decision**: Add `public async refreshInstallationStatus(): Promise<void>` to `CatalogWebviewProvider`.

**Rationale**: The private `_handleCheckInstallationStatus()` (lines 351-363) already implements the core logic but expects the caller to provide the file list. The new public method self-sources the file list via `_collectCatalogData()` and provides a single entry point for both the file watcher and the "Refresh Catalog" command.

**Alternatives considered**:

- Make `_handleCheckInstallationStatus` public — requires caller to provide file list, which the watcher doesn't have
- Event emitter pattern — over-engineering for a single caller
- Full panel re-render via `show()` — unnecessarily expensive; the `installationStatusUpdate` message updates badges in-place

## RQ-4: Panel-Closed Behavior

**Decision**: Guard with `if (!this._panel) return` at the top of `refreshInstallationStatus()`.

**Rationale**: When the panel is closed, `this._panel` is `undefined` (set to `undefined` in the dispose handler at line 127). The guard prevents both unnecessary computation (catalog data collection + status checking) and errors (posting to a disposed webview). The sidebar's `refresh()` method independently guards on `this._view`.

## RQ-5: Sidebar Refresh

**Decision**: Call `sidebarProvider.refresh()` alongside `catalogProvider.refreshInstallationStatus()` in the debounced handler.

**Rationale**: The sidebar displays aggregate statistics (installed count, available count) that must stay in sync with filesystem state. `refresh()` re-renders with fresh stats. The debounce prevents rapid consecutive calls.

**Assumption**: `sidebarProvider.refresh()` is idempotent and safe when the view is not visible (guards on `this._view` internally).

## RQ-6: Cache Behavior During Re-Check

**Decision**: Accept that `_collectCatalogData()` may trigger a cache-miss remote fetch. No special handling needed.

**Rationale**: In practice, the catalog panel is already open (which populated the cache during rendering), so `_collectCatalogData()` returns cached data instantly. Even on a cache miss, the remote fetch adds <500ms, staying within the 3-second target. The `CatalogManager` caching layer is the appropriate place to manage TTL — the file watcher should not duplicate caching logic.
