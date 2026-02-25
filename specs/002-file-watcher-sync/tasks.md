# Tasks: File Watcher for Installation State Sync

**Input**: Design documents from `/specs/002-file-watcher-sync/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/file-watcher.ts, quickstart.md

**Tests**: Not requested — no automated test tasks included. Manual validation via quickstart.md in Phase 5.

**Organization**: Tasks grouped by user story. US1 and US2 share the same implementation (both require the FileSystemWatcher + debounced handler) and are combined into a single phase. US3 is a separate code change in the same file and follows sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Extension code**: `packages/vscode/src/`
- **Core library**: `packages/core/src/` (NO CHANGES in this feature)
- **Spec docs**: `specs/002-file-watcher-sync/`

---

## Phase 1: Setup

**Purpose**: Verify baseline state and confirm no conflicts with existing code

- [ ] T001 Verify `packages/vscode/src/extension.ts` compiles cleanly and confirm the Refresh Catalog command handler at lines 78-85 has no catalog panel refresh logic
- [ ] T002 Verify `packages/vscode/src/providers/CatalogWebviewProvider.ts` compiles cleanly and confirm `_handleCheckInstallationStatus()` pattern at lines 351-363 is intact

**Checkpoint**: Baseline verified — no unexpected changes to the two files that will be modified.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Add the public `refreshInstallationStatus()` method that both the file watcher (US1/US2) and the Refresh Catalog fix (US3) depend on.

**CRITICAL**: Phase 3 and Phase 4 CANNOT begin until T003 is complete. This method is the single shared dependency for all three user stories.

- [X] T003 Add public `refreshInstallationStatus()` method to CatalogWebviewProvider class in `packages/vscode/src/providers/CatalogWebviewProvider.ts`

  **Contract** (from `specs/002-file-watcher-sync/contracts/file-watcher.ts`):
  ```typescript
  public async refreshInstallationStatus(): Promise<void> {
    if (!this._panel) return;               // No-op if panel is closed (FR-006)
    try {
      const catalogData = await this._collectCatalogData();
      const targetDir = this._getTargetDir();
      if (!targetDir) return;               // No workspace folder
      const filesWithStatus = await this._fileInstaller.getInstallationStatus(catalogData, targetDir);
      if (!this._panel) return;             // Re-check: panel may have closed during async work
      this._panel.webview.postMessage({
        type: MessageType.INSTALLATION_STATUS_UPDATE,
        filesWithStatus
      });
    } catch (error) {
      this._logger.warn(`Failed to refresh installation status: ${error}`);
    }
  }
  ```

  **Implementation notes**:
  - Place this method after the existing `hide()` method (around line 130) as a public method
  - Follows the exact same pattern as private `_handleCheckInstallationStatus()` (lines 351-363) but self-sources the file list via `_collectCatalogData()`
  - Double-checks `this._panel` before `postMessage()` to handle the race condition where the panel is disposed during async `_collectCatalogData()` (edge case from plan.md)
  - Wraps in try/catch per plan.md edge case: `_collectCatalogData()` may throw on network error during cache refresh
  - Uses existing `MessageType.INSTALLATION_STATUS_UPDATE` from `packages/vscode/src/types.ts` — no new imports needed
  - Uses existing `this._logger` for the warning log

**Checkpoint**: `refreshInstallationStatus()` exists and can be called from `extension.ts`. Build should pass.

---

## Phase 3: User Story 1 + User Story 2 — Automatic Status Updates (Priority: P1) :dart: MVP

**Goal**: Register a FileSystemWatcher for `.github/**` so that file creation, modification, and deletion automatically triggers installation status re-check and pushes updates to the catalog panel and sidebar.

**Why combined**: US1 (deletion detection) and US2 (creation/modification detection) are satisfied by the exact same code — a single FileSystemWatcher with a debounced handler that calls `refreshInstallationStatus()` and `sidebarProvider.refresh()`. Separating them into distinct tasks would produce conflicting edits to the same lines.

**Independent Test**: Install a catalog file via the catalog panel. Delete it from `.github/` in the file explorer. Verify the badge changes from "Installed" to "Available" within ~1.5 seconds without any manual action.

- [X] T004 [US1] [US2] Register FileSystemWatcher with debounced handler in `packages/vscode/src/extension.ts`

  **Implementation notes**:
  - Add after the config change listener block (after line 94) and before the `context.subscriptions.push(outputChannel)` line (line 97)
  - Create `vscode.workspace.createFileSystemWatcher('**/.github/**')` per RQ-1
  - Implement a trailing-edge debounce closure (500ms) per RQ-2:
    ```typescript
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        await catalogProvider.refreshInstallationStatus();
        await sidebarProvider.refresh();
      }, 500);
    };
    ```
  - Subscribe all three watcher events to the same debounced handler:
    ```typescript
    const watcher = vscode.workspace.createFileSystemWatcher('**/.github/**');
    watcher.onDidCreate(debouncedRefresh);
    watcher.onDidChange(debouncedRefresh);
    watcher.onDidDelete(debouncedRefresh);
    context.subscriptions.push(watcher);
    ```
  - Push the watcher to `context.subscriptions` for proper disposal (FR-005)
  - The watcher is registered unconditionally in `activate()` — it is active for the extension's lifetime (FR-008)
  - No new imports needed — `vscode` is already imported

  **Satisfies**: FR-001, FR-002, FR-003, FR-005, FR-006, FR-007, FR-008, SC-001, SC-002, SC-004

**Checkpoint**: File changes under `.github/` trigger automatic status updates in both the catalog panel and sidebar. US1 and US2 acceptance scenarios are testable.

---

## Phase 4: User Story 3 — Refresh Catalog Command Fix (Priority: P2)

**Goal**: Make the "Refresh Catalog" command also refresh the catalog panel's installation statuses when the panel is open. Currently, the command only refreshes the sidebar.

**Independent Test**: Open the catalog panel, make a filesystem change under `.github/`, then run "Refresh Catalog" from the command palette. Verify both the sidebar and catalog panel update.

- [X] T005 [US3] Add `catalogProvider.refreshInstallationStatus()` call to the Refresh Catalog command handler in `packages/vscode/src/extension.ts`

  **Implementation notes**:
  - Locate the `awesome-palette.refreshCatalog` command handler (lines 78-85)
  - Replace the comment block (lines 82-84) with:
    ```typescript
    await catalogProvider.refreshInstallationStatus();
    ```
  - The handler already does `catalogManager.clearCache()` and `await sidebarProvider.refresh()` — this adds the catalog panel refresh as the third step
  - No new imports needed
  - If the panel is not open, `refreshInstallationStatus()` returns immediately (no-op per FR-004)

  **Satisfies**: FR-004, SC-003

**Checkpoint**: "Refresh Catalog" command now updates both sidebar and catalog panel. US3 acceptance scenarios are testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and validation

- [X] T006 [P] Update CHANGELOG.md with feature entry for file watcher sync under version 0.8.0 (or next minor)
- [ ] T007 Run quickstart.md validation: execute the manual test scenarios from `specs/002-file-watcher-sync/quickstart.md` in a VS Code extension host

**Checkpoint**: All user stories verified. CHANGELOG updated. Feature complete.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)         → No dependencies — start immediately
Phase 2 (Foundational)  → Depends on Phase 1 verification
Phase 3 (US1+US2)       → BLOCKED by Phase 2 (T003 must be complete — T004 calls refreshInstallationStatus())
Phase 4 (US3)           → BLOCKED by Phase 2 (T003 must be complete — T005 calls refreshInstallationStatus())
                         → BLOCKED by Phase 3 (T004 must be complete — T005 edits the same file as T004)
Phase 5 (Polish)        → Depends on Phase 4 completion (all implementation done)
```

### Task Dependency Graph

```
T001 ──┐
       ├──► T003 ──┬──► T004 ──► T005 ──┬──► T006 [P]
T002 ──┘           │                     │
                   │                     └──► T007
                   │
                   └──(T003 is the single shared dependency for all user stories)
```

### Why T004 and T005 Are Sequential (Not Parallel)

Both T004 and T005 modify `packages/vscode/src/extension.ts`. Running them in parallel with sub-agents would risk merge conflicts or overwritten edits. T004 adds 10-15 new lines (watcher block), T005 modifies 3 existing lines (command handler). Sequential execution ensures deterministic edits.

**If parallel execution is desired**: T005 could theoretically run in parallel with T004 if the sub-agent is instructed to only touch lines 78-85 (the command handler) while T004 only adds after line 94. However, this is fragile — sequential execution is recommended.

### User Story Dependencies

```
US1 (P1): T003 → T004                    (CatalogWebviewProvider.ts → extension.ts)
US2 (P1): T003 → T004                    (same implementation as US1)
US3 (P2): T003 → T005                    (CatalogWebviewProvider.ts → extension.ts)
```

- **US1 + US2**: Cannot start until T003 (refreshInstallationStatus) is complete
- **US3**: Cannot start until T003 is complete. Additionally blocked by T004 (same file)
- **US1/US2 and US3 are independent at the user-story level** but share a file dependency

### Within Each User Story

1. Foundational method first (T003) — blocking for all stories
2. Watcher registration (T004) — satisfies US1 + US2
3. Command fix (T005) — satisfies US3
4. Polish (T006, T007) — after all implementation

### Parallel Opportunities

Due to the minimal file footprint (only 2 files modified), parallelism is limited:

| Wave | Tasks | Files | Notes |
|------|-------|-------|-------|
| Wave 1 | T001, T002 | Read-only verification | Fully parallel |
| Wave 2 | T003 | CatalogWebviewProvider.ts | Sequential — single blocking task |
| Wave 3 | T004 | extension.ts | Sequential — watcher registration |
| Wave 4 | T005 | extension.ts | Sequential — command fix (same file as T004) |
| Wave 5 | T006, T007 | CHANGELOG.md, manual testing | T006 is parallelizable with T007 |

---

## Parallel Execution Plan for Copilot CLI / Fleet

### Wave 1 — Verification (2 sub-agents, parallel)

```bash
# Sub-agent A: Verify extension.ts baseline
copilot task "Read packages/vscode/src/extension.ts. Confirm the refreshCatalog command handler (lines 78-85) has a comment about not refreshing the catalog panel. Confirm there is no FileSystemWatcher anywhere in the file."

# Sub-agent B: Verify CatalogWebviewProvider.ts baseline
copilot task "Read packages/vscode/src/providers/CatalogWebviewProvider.ts. Confirm _handleCheckInstallationStatus() exists around lines 351-363. Confirm there is no public refreshInstallationStatus() method."
```

### Wave 2 — Foundational (1 sub-agent, sequential)

```bash
# Sub-agent C: Add refreshInstallationStatus() to CatalogWebviewProvider
copilot task "In packages/vscode/src/providers/CatalogWebviewProvider.ts, add a public async refreshInstallationStatus(): Promise<void> method after the hide() method. It should: (1) return early if this._panel is falsy, (2) try/catch around: call this._collectCatalogData(), call this._getTargetDir(), call this._fileInstaller.getInstallationStatus(catalogData, targetDir), re-check this._panel before calling this._panel.webview.postMessage with type MessageType.INSTALLATION_STATUS_UPDATE and filesWithStatus payload. (3) In catch, call this._logger.warn with the error message."
```

### Wave 3 — File Watcher Registration (1 sub-agent, sequential)

```bash
# Sub-agent D: Register FileSystemWatcher with debounced handler
copilot task "In packages/vscode/src/extension.ts, after the VSCodeConfig.onConfigChange block (around line 94) and before context.subscriptions.push(outputChannel), add: (1) a debounce closure with 500ms trailing delay, (2) create vscode.workspace.createFileSystemWatcher('**/.github/**'), (3) subscribe onDidCreate, onDidChange, onDidDelete to the debounced handler that calls catalogProvider.refreshInstallationStatus() and sidebarProvider.refresh(), (4) push the watcher to context.subscriptions."
```

### Wave 4 — Refresh Catalog Command Fix (1 sub-agent, sequential)

```bash
# Sub-agent E: Fix Refresh Catalog command
copilot task "In packages/vscode/src/extension.ts, in the awesome-palette.refreshCatalog command handler, replace the 3-line comment block (lines about 'Only refresh catalog panel if it is already open', 'Don't force-open it', 'The panel will auto-refresh') with a single line: await catalogProvider.refreshInstallationStatus();"
```

### Wave 5 — Polish (2 sub-agents, parallel)

```bash
# Sub-agent F: Update CHANGELOG
copilot task "Add a new entry to CHANGELOG.md for the file watcher feature under a new version heading. Include: Added FileSystemWatcher for .github/** to auto-update installation status badges, Added refreshInstallationStatus() public method to CatalogWebviewProvider, Fixed Refresh Catalog command to also refresh the catalog panel when open."

# Sub-agent G: Run validation (manual — human step)
# Execute quickstart.md test scenarios in VS Code extension host
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Add `refreshInstallationStatus()` (T003)
3. Complete Phase 3: Register FileSystemWatcher (T004)
4. **STOP and VALIDATE**: Test US1 + US2 — delete/create files under `.github/` and verify automatic badge updates
5. This delivers the core value — automatic status sync

### Incremental Delivery

1. T001-T002 → Baseline verified
2. T003 → Foundation ready (new public method exists)
3. T004 → US1 + US2 complete → Test automatic updates → **MVP delivered**
4. T005 → US3 complete → Test Refresh Catalog command → Feature complete
5. T006-T007 → Polish → Ready for release

### Summary

| Metric | Value |
|--------|-------|
| Total tasks | 7 |
| Setup tasks | 2 (T001-T002) |
| Foundational tasks | 1 (T003) |
| US1+US2 tasks | 1 (T004) |
| US3 tasks | 1 (T005) |
| Polish tasks | 2 (T006-T007) |
| Files modified | 2 (`extension.ts`, `CatalogWebviewProvider.ts`) |
| Files created | 0 |
| Core library changes | 0 |
| Parallel waves | 5 (Waves 1 and 5 have parallel sub-agents) |
| Maximum parallelism | 2 concurrent sub-agents (Waves 1 and 5) |
| Critical path | T001/T002 → T003 → T004 → T005 → T006/T007 |

---

## Notes

- The feature's small footprint (2 files, ~25 lines of new code) means parallelism is constrained by file contention, not task complexity
- Each task includes enough implementation detail for a sub-agent to execute without additional context
- T003 is the critical bottleneck — it unblocks all three user stories
- US1 and US2 are architecturally identical (same watcher, same handler) — separating them into distinct implementation tasks would create conflicting edits
- Commit after each wave to create clean checkpoints for validation
