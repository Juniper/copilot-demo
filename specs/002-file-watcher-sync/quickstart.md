# Quickstart: File Watcher for Installation State Sync

**Feature**: 002-file-watcher-sync | **Date**: 2026-02-24

## What This Feature Does

After implementation, the Awesome Copilot Palette extension automatically detects changes to files under `.github/` in your workspace and updates installation status badges in real time — no manual refresh needed.

## User-Visible Behavior

### Automatic Status Updates

1. Open the Catalog panel (via sidebar or command palette)
2. Install a file (e.g., an instruction file)
3. Delete the installed file from `.github/instructions/` using the file explorer or terminal
4. The catalog panel automatically updates the file's badge from "Installed" to "Available" within ~1 second (500ms debounce + status check time)

### Refresh Catalog Command

The "Refresh Catalog" command (`awesome-palette.refreshCatalog`) now also refreshes the catalog panel if it is open. Previously, this command only refreshed the sidebar.

## New Public API

### `CatalogWebviewProvider.refreshInstallationStatus()`

```typescript
/**
 * Re-checks installation status for all catalog entries and pushes
 * updated statuses to the open catalog webview panel.
 * No-op if the panel is not open.
 */
public async refreshInstallationStatus(): Promise<void>
```

**Usage from extension code**:

```typescript
// In a command handler or event listener:
await catalogProvider.refreshInstallationStatus();
```

**Behavior**:

- If panel is open: collects catalog data, re-checks all file statuses, posts `installationStatusUpdate` message to webview
- If panel is closed: returns immediately (no-op)
- If no workspace folder: returns immediately (no-op)
- If catalog data collection fails: logs warning, returns without updating

## Configuration

No new configuration settings. The file watcher is always active when a workspace folder is open.

## Limitations

- **Single workspace folder only**: Monitors `.github/` in the first workspace folder. Multi-root workspace support is not included.
- **No filtering by file type**: The watcher fires for any change under `.github/`, including non-catalog files. Non-catalog changes trigger a re-check that correctly finds no status changes (idempotent).
- **Debounce delay**: There is a ~500ms delay between the filesystem change and the UI update. This is by design to coalesce rapid bulk operations.
