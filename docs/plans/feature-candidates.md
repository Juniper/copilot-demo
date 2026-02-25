# Feature Candidates for Awesome Copilot Palette

**Date**: 2026-02-24 (revised)
**Purpose**: Five feature candidates ordered easy-to-hard for a ~2-hour spec-driven development tutorial using SpecKit.
**Context**: Each feature is evaluated for spec-writing suitability (clear acceptance criteria, testable outcomes) and implementation tractability within a live session.

---

## Codebase Summary (What Exists Today)

The extension is a VS Code sidebar + catalog webview that lets users browse, search, filter, preview, and install GitHub Copilot configuration files (instructions, prompts, agents, skills, cookbooks) from bundled entries and remote GitHub repositories. Core logic lives in `packages/core/` (CatalogManager, RepositoryManager, FileInstaller, StructureAnalyzer), and the VS Code UI lives in `packages/vscode/` (SidebarProvider, CatalogWebviewProvider, templates).

---

## Feature 1: Catalog Search Includes Description Field (Easy)

### The Gap

The catalog search only checks `data-name`, `data-type`, and `data-source` attributes on table rows (`CatalogTemplate.ts:550-563`). The description text is rendered in the table (`CatalogTemplate.ts:1058`) but is NOT stored as a `data-description` attribute on the `<tr>` element (`CatalogTemplate.ts:1042-1045`). A user searching for "testing" will not find a file named "pytest-integration" whose description says "Testing patterns and strategies."

```javascript
// Current search logic (CatalogTemplate.ts:554-559)
const matchesSearch = name.includes(searchValue) ||
                    type.includes(searchValue) ||
                    source.includes(searchValue);
// description is never checked
```

### What to Build

1. Add a `data-description` attribute to each `<tr>` in the catalog table, populated from `item.description`.
2. Include the description field in the search matching logic alongside name, type, and source.
3. Verify that searching for terms that appear only in descriptions surfaces the correct results.

### Why This Feature

- **Spec-friendliness**: Tiny scope with crisp acceptance criteria. "Search for X, file Y appears because its description contains X." Easy to write 3-4 acceptance scenarios with clear pass/fail conditions.
- **Tutorial value**: Demonstrates the full SpecKit cycle (spec -> task -> implement -> verify) without consuming much session time. Leaves room for methodology discussion. The fix itself is a small, localized UI change that touches one file.
- **Real user impact**: Search that ignores descriptions is a genuine usability flaw. Users naturally search by concept ("testing", "kubernetes", "performance") and expect matches against all visible text.

### Estimated Complexity

- **Files to modify**: 1 (`CatalogTemplate.ts`)
- **Lines of change**: ~5-8
- **Risk**: Minimal. The existing search/filter infrastructure works correctly; this just widens what it searches.

---

## Feature 2: File Watcher for Installation State Sync (Easy-Medium)

### The Gap

Installation status is computed correctly via filesystem reads (`FileInstaller.ts:376-401`), but the webview is rendered once and never re-evaluated when the filesystem changes. There is zero usage of `vscode.workspace.createFileSystemWatcher()` anywhere in the codebase. If a user manually deletes a file from `.github/`, the catalog continues showing it as "installed" until the panel is closed and reopened. The "Refresh Catalog" command (`extension.ts:72-84`) explicitly does NOT refresh an open catalog panel -- the comment at lines 80-82 says so.

Three separate problems compound:
1. No filesystem watcher on `.github/` directory
2. "Refresh Catalog" command only refreshes sidebar, not catalog panel
3. No periodic or on-focus re-check of installation status

### What to Build

1. Register a `FileSystemWatcher` for `.github/**` in the workspace.
2. When files are created, changed, or deleted under `.github/`, re-check installation status and push updated status badges to the open catalog panel (if any).
3. Also make the "Refresh Catalog" command refresh the catalog panel when it is open (fix the intentional gap at `extension.ts:80-82`).

### Why This Feature

- **Spec-friendliness**: Clear before/after scenarios. "Given an installed file, when the user deletes it from `.github/`, then the catalog shows status 'available' within N seconds." Edge cases include creating files manually, renaming files, and bulk deletions.
- **Tutorial value**: Introduces a VS Code platform API (`createFileSystemWatcher`) and shows how to spec reactive behavior -- state sync is a different class of feature than CRUD operations. Good for teaching how to write specs for event-driven features.
- **Real user impact**: Stale installation status is confusing and erodes trust in the extension's accuracy. This is the gap the user explicitly identified.

### Estimated Complexity

- **Files to modify**: 3 (`extension.ts`, `CatalogWebviewProvider.ts`, possibly `SidebarProvider.ts`)
- **Lines of change**: ~40-70
- **Risk**: Low-medium. `FileSystemWatcher` is well-documented VS Code API. The main care point is debouncing rapid filesystem changes to avoid excessive re-renders.

---

## Feature 3: Conflict Diff View (Medium)

### The Gap

When a catalog item has "conflict" status (file exists in workspace but content differs from catalog version), the user sees a "Resolve" button that forces a binary choice: overwrite or skip. There is no way to see what the differences are before deciding. Additionally, `ConflictResolution.RENAME` is defined in the enum (`installer.ts:54`) but never implemented -- if passed, the code silently falls through and overwrites the file (`FileInstaller.ts:141-143`).

The `'installing'` status is defined, styled (`CatalogTemplate.ts:219-222`), and has a disabled button (`CatalogTemplate.ts:1139-1140`), but is never set during the install flow -- the status jumps directly from `available` to `installed` with no intermediate state.

### What to Build

1. Add a "View Diff" action on conflicting items that opens VS Code's native diff editor (`vscode.commands.executeCommand('vscode.diff', ...)`) showing the installed version vs. the catalog version side-by-side.
2. Implement the `RENAME` conflict resolution so that "Keep Both" installs the catalog version with a disambiguated filename (e.g., `python.instructions.v2.md` or timestamped).
3. Update the conflict resolution UI to offer three choices: Overwrite, Keep Both, Skip.

### Why This Feature

- **Spec-friendliness**: Rich set of acceptance scenarios with branching logic. Each resolution path (overwrite, rename, skip) has distinct outcomes to verify. The diff editor integration adds a "does the right VS Code UI open?" scenario.
- **Tutorial value**: Demonstrates how to spec a feature with multiple user flows and decision points. Uses a native VS Code API (`vscode.diff`) that is interesting to teach. Shows how dead code (`RENAME` enum) turns into working functionality through spec-driven development.
- **Real user impact**: Conflict resolution without diff visibility is a frustrating UX. Users need to see what changed before deciding.

### Estimated Complexity

- **Files to modify**: 3-4 (`FileInstaller.ts`, `CatalogWebviewProvider.ts`, `CatalogTemplate.ts`, `types.ts` for new message type)
- **Lines of change**: ~80-120
- **Risk**: Medium. The diff editor API is straightforward but requires fetching both file versions asynchronously. Rename logic needs filename collision handling.

---

## Feature 4: Catalog Entry Display Names (Medium-Hard)

### The Gap

When `CatalogEntry` objects are converted to `InstallableFile` objects for the catalog table, the human-readable `entry.name` (e.g., "Code Development Assistant") is discarded. Instead, the file path is used and partially cleaned (`CatalogWebviewProvider.ts:284-293`):

```typescript
name: entry.filePath.replace(/\.(instructions|prompt|agent|skill|cookbook)\.md$/, ''),
// For filePath "agents/Code.agent.md", this produces "agents/Code"
```

Users see names like `agents/Code`, `instructions/python`, `prompts/code-review` in the catalog table -- with directory prefixes and without the descriptive names that exist in `entries.ts` (e.g., "Python Development", "Code Review Prompt"). The `CatalogEntry.name`, `CatalogEntry.description`, and `CatalogEntry.category` fields are all available but discarded during the conversion.

Additionally, the catalog footer (`CatalogTemplate.ts:1106-1110`) says "instructions, prompts, and agents" -- omitting skills and cookbooks. This compounds the problem of cookbooks being treated as second-class types throughout the UI.

### What to Build

1. Preserve `CatalogEntry.name` through the conversion to `InstallableFile` (add a `displayName` field to `InstallableFile` or use the existing `name` field correctly).
2. Show the display name as the primary identifier in the catalog table, with the file path as secondary/tooltip info.
3. For remote files that don't have a `CatalogEntry`, derive a clean display name by stripping the directory prefix and file extension from the path.
4. Fix the footer text to include all five types.

### Why This Feature

- **Spec-friendliness**: Clear visual acceptance criteria ("user sees 'Python Development' not 'instructions/python'"). Requires tracing data through the conversion pipeline, which makes for a good spec exercise in understanding data flow.
- **Tutorial value**: Demonstrates how to spec a feature that touches the interface between two packages (core types and VS Code UI). Requires modifying a shared type, which is a common real-world scenario.
- **Real user impact**: The current names are confusing. Directory prefixes should not be user-facing.

### Estimated Complexity

- **Files to modify**: 4 (`installer.ts` types, `CatalogWebviewProvider.ts`, `CatalogTemplate.ts`, `SidebarProvider.ts`)
- **Lines of change**: ~60-90
- **Risk**: Medium-high. Changing the `InstallableFile` type ripples through multiple consumers. Need to handle both bundled entries (which have `CatalogEntry.name`) and remote files (which only have paths) gracefully.

---

## Feature 5: Configuration Change Propagation (Hard)

### The Gap

When a user changes VS Code settings (GitHub token, repositories, online fetching toggle), the `onConfigChange` handler (`extension.ts:87-93`) clears the catalog cache and refreshes the sidebar, but does NOT propagate the new configuration to the in-memory `RepositoryManager` or `CatalogManager` instances. The `_newConfig` parameter is received but explicitly ignored (named with underscore prefix). The `RepositoryManager` has a `refreshRepositoryConfiguration()` method (`RepositoryManager.ts:128`) but it is never called from the extension.

This means:
- Changing the GitHub token does not take effect until extension reload
- Toggling `enableOnlineFetching` does not take effect until extension reload
- Adding a repository through VS Code Settings (as opposed to the sidebar form) creates a stale configuration mismatch
- The sidebar re-reads config via `VSCodeConfig.load()` (showing updated UI) but the services behind it still use old config (producing stale data)

Additionally, the `.github/` directory is created as a side effect of the permission check (`CatalogManager.ts:544`) via `mkdir(githubPath, { recursive: true })`. This runs every time the sidebar loads, creating `.github/` in workspaces where the user has not installed anything and may not want the directory.

### What to Build

1. Propagate `newConfig` to `RepositoryManager` and `CatalogManager` instances when settings change.
2. Call `repoManager.refreshRepositoryConfiguration(newConfig)` in the `onConfigChange` handler.
3. Update `CatalogManager` to accept config updates (or re-instantiate with new config).
4. Fix the permission check to use a read-only approach (e.g., `stat` on the parent directory) instead of creating `.github/`.
5. If the catalog panel is open, refresh it after configuration changes.

### Why This Feature

- **Spec-friendliness**: Excellent for demonstrating specs that cover "invisible" behavior -- things a user expects to work but that silently don't. Acceptance scenarios involve changing settings and verifying the extension reacts correctly without requiring a reload.
- **Tutorial value**: Demonstrates how to spec a feature that is about correctness rather than new UI. Shows how to discover and fix architectural issues through spec-driven analysis. The `.github/` side-effect sub-feature adds a "defensive spec" teaching moment.
- **Real user impact**: Settings that don't take effect without a reload are a significant UX defect. The `.github/` side-effect is a violation of user expectations.

### Estimated Complexity

- **Files to modify**: 4-5 (`extension.ts`, `CatalogManager.ts`, `RepositoryManager.ts`, `CatalogWebviewProvider.ts`, `SidebarProvider.ts`)
- **Lines of change**: ~80-130
- **Risk**: High. Configuration propagation touches the dependency graph between all core services. Ensuring no stale references remain requires understanding the full initialization flow. The permission-check fix needs to preserve the existing UX while removing the side effect.

---

## Feature Comparison Matrix

| # | Feature | Complexity | Files | New Code | Layers | Spec Scenarios | 2-Hour Fit |
|---|---------|-----------|-------|----------|--------|---------------|-----------|
| 1 | Search Descriptions | Easy | 1 | ~6 lines | UI only | 3-4 | Safest bet |
| 2 | File Watcher State Sync | Easy-Medium | 3 | ~55 lines | Extension + UI | 5-6 | Good demo |
| 3 | Conflict Diff View | Medium | 3-4 | ~100 lines | Core + Extension + UI | 7-8 | Possible with focus |
| 4 | Display Names | Medium-Hard | 4 | ~75 lines | Types + Core + UI | 5-7 | Tight but doable |
| 5 | Config Propagation | Hard | 4-5 | ~105 lines | All layers | 8-10 | Risky for live |

---

## Recommendation for the Tutorial

**Feature 1 (Search Descriptions)** is the safest pick for a live 2-hour session. It is genuinely useful, trivially scoped, and demonstrates the full spec-driven cycle with time to spare. However, it may feel too small to showcase SpecKit's value on complex features.

**Feature 2 (File Watcher State Sync)** is the strongest candidate for balancing completion risk against tutorial value. It introduces an event-driven VS Code API, has clear acceptance criteria, and addresses the stale-state problem the user identified. The implementation is self-contained (no shared type changes) and the feature is visually demonstrable.

**Feature 3 (Conflict Diff View)** is the most interesting from a spec-writing perspective (branching logic, dead code revival, VS Code API integration) but carries more implementation risk given the async content fetching requirements.

For a session that prioritizes **completing a working feature**, pick Feature 1 or 2. For a session that prioritizes **rich spec-writing**, pick Feature 3 but accept the risk of not finishing implementation.
