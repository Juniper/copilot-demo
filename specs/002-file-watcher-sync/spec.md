# Feature Specification: File Watcher for Installation State Sync

**Feature Branch**: `002-file-watcher-sync`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Register a FileSystemWatcher for .github/** in the workspace. When files are created, changed, or deleted under .github/, re-check installation status and push updated status badges to the open catalog panel. Also make the Refresh Catalog command refresh the catalog panel when it is open."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Status Update on File Deletion (Priority: P1)

A user has installed several catalog files into their workspace via the Awesome Palette catalog. They then manually delete one of the installed files from the `.github/` directory using VS Code's file explorer or an external tool. Without closing or reopening the catalog panel, the status badge for that file updates from "installed" to "available" within a few seconds, accurately reflecting the current filesystem state.

**Why this priority**: This is the most common manifestation of the stale-state problem. Users who delete files expect immediate visual feedback. Stale "installed" badges erode trust in the extension and can lead users to believe they still have a file when they do not.

**Independent Test**: Install a catalog file, confirm the catalog shows "installed", delete the file from `.github/`, and verify the status updates to "available" without any manual intervention (no panel close/reopen, no command execution).

**Acceptance Scenarios**:

1. **Given** a catalog file with status "installed" displayed in the open catalog panel, **When** the user deletes the corresponding file from the `.github/` directory, **Then** the catalog panel updates the file's status badge to "available" within 3 seconds.
2. **Given** a catalog file with status "installed" displayed in the open catalog panel, **When** the user deletes the entire subdirectory (e.g., `.github/instructions/`) containing multiple installed files, **Then** all affected files update their status badges to "available" within 3 seconds.
3. **Given** a catalog skill folder with status "installed", **When** the user deletes the skill's directory from `.github/`, **Then** the skill's status badge updates to "available" within 3 seconds.
4. **Given** a catalog file with status "conflict" (content differs from catalog version), **When** the user deletes the file from `.github/`, **Then** the status badge updates from "conflict" to "available" within 3 seconds.
5. **Given** a catalog skill folder with status "installed" containing multiple files, **When** the user deletes one file from the skill's directory but leaves the rest intact, **Then** the skill's status badge updates to "partial" within 3 seconds.
6. **Given** a file under `.github/` that does not correspond to any catalog entry (e.g., a custom `.md` file the user created), **When** the user deletes that file, **Then** no catalog entry statuses change and no errors occur.
7. **Given** both the catalog panel and the sidebar are visible and a catalog file shows status "installed", **When** the user deletes the file, **Then** both the catalog panel's status badge and the sidebar's aggregate installed count update to reflect the deletion within 3 seconds.

---

### User Story 2 - Automatic Status Update on External File Creation (Priority: P1)

A user manually creates or copies a file into the `.github/` directory that matches a catalog entry (e.g., they copy `python.instructions.md` from another project into `.github/instructions/`). The catalog panel detects this external change and updates the status badge to either "installed" (if the content matches the catalog version) or "conflict" (if the content differs), without requiring the user to refresh or reopen the panel.

**Why this priority**: Users frequently share configuration files between projects by copying them directly. The catalog must reflect external additions to remain a trustworthy source of truth.

**Independent Test**: With the catalog panel open, manually copy a file matching a catalog entry's expected path into `.github/`. Verify the status updates from "available" to "installed" or "conflict" depending on content match.

**Acceptance Scenarios**:

1. **Given** a catalog file with status "available" displayed in the open catalog panel, **When** the user manually creates the corresponding file in `.github/` with content identical to the catalog version, **Then** the status badge updates to "installed" within 3 seconds.
2. **Given** a catalog file with status "available" displayed in the open catalog panel, **When** the user manually creates the corresponding file in `.github/` with content that differs from the catalog version, **Then** the status badge updates to "conflict" within 3 seconds.
3. **Given** a catalog file with status "installed", **When** the user modifies the file's content externally (e.g., via another editor or terminal), **Then** the status badge updates to "conflict" within 3 seconds.

---

### User Story 3 - Refresh Catalog Command Updates Catalog Panel (Priority: P2)

A user runs the "Refresh Catalog" command from the command palette. Currently, this command refreshes only the sidebar, not the catalog panel — even if the panel is open. After this feature, running "Refresh Catalog" also refreshes the installation status displayed in the open catalog panel.

**Why this priority**: The Refresh Catalog command is the explicit, user-initiated way to force a status re-check. If the automatic watcher misses an edge case or the user simply wants certainty, this command should be the reliable fallback. It is lower priority than the automatic watcher because it requires user action.

**Independent Test**: Open the catalog panel, make a filesystem change to `.github/`, then run the "Refresh Catalog" command and verify the catalog panel reflects the change.

**Acceptance Scenarios**:

1. **Given** the catalog panel is open and a file's status is stale (does not match the filesystem), **When** the user runs the "Refresh Catalog" command, **Then** the catalog panel's installation statuses are recomputed and updated to reflect the current filesystem state.
2. **Given** the catalog panel is NOT open, **When** the user runs the "Refresh Catalog" command, **Then** the sidebar refreshes as before and no errors occur (the catalog panel is not force-opened).
3. **Given** the catalog panel is open, **When** the user runs "Refresh Catalog", **Then** both the sidebar and the catalog panel are refreshed.

---

### Edge Cases

- What happens when rapid successive filesystem events occur (e.g., deleting 20 files at once via `rm -rf .github/instructions/`)? The system debounces filesystem events so that a burst of changes triggers at most one status re-check, preventing excessive recomputation.
- What happens when the `.github/` directory does not exist in the workspace? The watcher is still registered (watching for creation), and no errors are emitted. When `.github/` is later created, the watcher picks up changes normally.
- What happens when no workspace folder is open? The watcher is not registered (there is no filesystem root to watch). No errors are emitted.
- What happens when the catalog panel is closed while filesystem events occur? Events are observed but no status update is pushed to the webview since there is no panel to receive them. The next time the panel is opened, it computes status fresh from the filesystem.
- What happens when a file is renamed within `.github/` (e.g., `python.instructions.md` → `python-old.instructions.md`)? The watcher treats this as a delete + create, and debounced processing re-checks status for all catalog entries.
- What happens when the `.github/` directory itself is deleted? The watcher detects this as a delete event. All catalog entries revert to "available" status.
- What happens when a file is modified rapidly (e.g., auto-save writing multiple times per second)? The debounce window coalesces these into a single status re-check.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST register a filesystem watcher that monitors all file changes (create, modify, delete) within the `.github/` directory of the active workspace folder.
- **FR-002**: When a filesystem change is detected under `.github/`, the extension MUST re-check the installation status of all catalog entries and push the updated statuses to the open catalog panel (if any).
- **FR-003**: The extension MUST debounce rapid filesystem events so that a burst of changes within a short window triggers at most one status re-check cycle.
- **FR-004**: The "Refresh Catalog" command MUST refresh both the sidebar and the open catalog panel (if any). The catalog panel MUST NOT be force-opened if it is not already open.
- **FR-005**: The filesystem watcher MUST be registered as a disposable so it is properly cleaned up when the extension is deactivated.
- **FR-006**: When the catalog panel is closed (not visible), filesystem events MUST NOT cause errors or attempted communication with a non-existent webview.
- **FR-007**: When the sidebar is visible during a filesystem change, the sidebar MUST also be refreshed so that aggregate statistics (installed count, etc.) remain accurate.
- **FR-008**: The filesystem watcher MUST be active for the lifetime of the extension, regardless of whether the catalog panel or sidebar is currently visible.

### Key Entities

- **Filesystem Event**: A create, modify, or delete operation on a file or directory under `.github/` in the active workspace. Multiple events may fire in rapid succession.
- **Installation Status**: The current state of a catalog entry relative to the workspace filesystem. One of: "available" (not present), "installed" (present and content matches), "conflict" (present but content differs), or "partial" (for folders where some but not all files are present).
- **Debounce Window**: A short time period during which multiple filesystem events are coalesced into a single status re-check, preventing excessive recomputation.

## Assumptions

- The workspace has at most one root folder. The watcher monitors the `.github/` directory within the first workspace folder only (consistent with existing behavior throughout the extension).
- The existing `getInstallationStatus()` method in `FileInstaller` is performant enough to be called on every debounced filesystem event without observable delay. For typical catalogs (< 200 entries), this is expected to complete in under 100ms.
- The existing webview message protocol (`installationStatusUpdate` message type) and client-side update function (`updateAllFileStatuses`) are sufficient for pushing status updates — no new message types are needed.
- A reasonable debounce window is 500ms, which balances responsiveness (SC-001: within 3 seconds) with efficiency (avoiding recomputation on every keystroke during rapid edits).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a file is created, modified, or deleted under `.github/`, the catalog panel reflects the updated installation status within 3 seconds, without any manual user action.
- **SC-002**: A burst of 20+ rapid filesystem events (e.g., bulk deletion) triggers at most one status re-check, keeping the recomputation count proportional to the number of distinct change windows rather than the number of individual events.
- **SC-003**: The "Refresh Catalog" command updates both the sidebar and the open catalog panel in a single invocation, eliminating the need for users to close and reopen the panel for status accuracy.
- **SC-004**: No errors or exceptions occur when filesystem events fire while the catalog panel is closed, the sidebar is hidden, or no workspace folder is open.
- **SC-005**: The extension's existing functionality (catalog browsing, file installation, conflict resolution) continues to work identically — zero behavioral regression.
