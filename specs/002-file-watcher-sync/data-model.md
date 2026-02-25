# Data Model: File Watcher for Installation State Sync

**Feature**: 002-file-watcher-sync | **Date**: 2026-02-24

## Overview

This feature introduces **no new data entities**. All data structures used by the file watcher already exist in the codebase. This document catalogs the existing types that participate in the file-watcher flow.

## Existing Entities (Unchanged)

### FileWithStatus

**Source**: Return type of `FileInstaller.getInstallationStatus()`

| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Display name of the catalog file |
| path | `string` | Source path in the catalog |
| type | `FileType` | Category: `instruction`, `prompt`, `agent`, `skill`, `cookbook` |
| status | `'available' \| 'installed' \| 'conflict'` | Installation state relative to workspace |
| description | `string` | File description from catalog metadata |

**State transitions triggered by filesystem events**:

```text
installed ──[file deleted]──► available
installed ──[file modified externally]──► conflict
available ──[file created matching catalog content]──► installed
available ──[file created with different content]──► conflict
conflict  ──[file deleted]──► available
conflict  ──[file overwritten with catalog content]──► installed
```

### MessageType (enum)

**Source**: `packages/vscode/src/types.ts`

| Value | Direction | Used by |
|-------|-----------|---------|
| `INSTALLATION_STATUS_UPDATE` | Extension → Webview | `refreshInstallationStatus()` posts this after re-checking |
| `CHECK_INSTALLATION_STATUS` | Webview → Extension | Webview-initiated refresh (existing, unchanged) |

### WebviewMessage

**Source**: `packages/vscode/src/types.ts`

| Field | Type | Description |
|-------|------|-------------|
| type | `MessageType` | Discriminator for message routing |
| filesWithStatus | `FileWithStatus[]` | Payload for `INSTALLATION_STATUS_UPDATE` messages |

## Event Flow

```text
Filesystem event (.github/** change)
  │
  ▼
FileSystemWatcher (VS Code API)
  │
  ▼
Debounce timer (500ms, trailing)
  │
  ▼
┌──────────────────────────────────────┐
│  Parallel:                           │
│  ├─ catalogProvider                  │
│  │   .refreshInstallationStatus()    │
│  │   ├─ _collectCatalogData()        │
│  │   ├─ getInstallationStatus()      │
│  │   └─ postMessage(statusUpdate)    │
│  └─ sidebarProvider.refresh()        │
└──────────────────────────────────────┘
  │                    │
  ▼                    ▼
Catalog webview        Sidebar webview
updates badges         re-renders stats
```

## Relationship to Core Library

The file watcher lives entirely in `packages/vscode/`. It calls `FileInstaller.getInstallationStatus()` from `@awesome-palette/core`, which is a read-only operation that:

1. Iterates the provided file list
2. For each file, resolves the target path via `_getTargetPath(file.type)`
3. Checks if the target file exists
4. If it exists, compares content byte-for-byte
5. Returns `'installed'` (exact match), `'conflict'` (different content), or `'available'` (not found)

No writes to the filesystem occur during status checking.
