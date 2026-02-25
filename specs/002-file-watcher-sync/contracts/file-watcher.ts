/**
 * Contract: File Watcher for Installation State Sync
 *
 * This file defines the interface contract for the new public method added
 * to CatalogWebviewProvider and the file watcher registration in extension.ts.
 *
 * These types are NOT new runtime types — they document the expected signatures
 * and behavior contracts for implementation.
 */

import type * as vscode from 'vscode';

/**
 * Extension to CatalogWebviewProvider's public interface.
 *
 * The existing class gains one new public method. All other methods
 * and properties remain unchanged.
 */
export interface CatalogWebviewProviderExtension {
  /**
   * Re-checks installation status for all catalog entries and pushes
   * updated statuses to the open catalog webview panel.
   *
   * Behavior:
   * - If `_panel` is undefined (panel closed): returns immediately (no-op)
   * - If no workspace folder: returns immediately (no-op)
   * - Collects catalog data via `_collectCatalogData()`
   * - Calls `FileInstaller.getInstallationStatus()` with collected files
   * - Posts `installationStatusUpdate` message to the webview
   * - On error during catalog data collection: logs warning, returns without updating
   *
   * Performance:
   * - Typical execution: <200ms (cache-hit catalog data + local filesystem reads)
   * - Worst case: <3s (cache-miss triggering remote catalog fetch)
   */
  refreshInstallationStatus(): Promise<void>;
}

/**
 * File watcher registration contract.
 *
 * Registered in `activate()` in extension.ts. The watcher monitors
 * `.github/**` for create, change, and delete events. All three event
 * types trigger the same debounced handler.
 */
export interface FileWatcherContract {
  /** Glob pattern for the watcher */
  readonly globPattern: '**/.github/**';

  /** Events that trigger the handler */
  readonly events: {
    readonly onCreate: true;
    readonly onChange: true;
    readonly onDelete: true;
  };

  /** Debounce configuration */
  readonly debounce: {
    /** Delay in milliseconds (trailing edge) */
    readonly delayMs: 500;
  };

  /**
   * The debounced handler calls both of these in parallel:
   * 1. catalogProvider.refreshInstallationStatus()
   * 2. sidebarProvider.refresh()
   */
  readonly handler: () => void;
}

/**
 * "Refresh Catalog" command contract (modified behavior).
 *
 * The existing `awesome-palette.refreshCatalog` command is modified to
 * also refresh the catalog panel when it is open. Previously, it only
 * refreshed the sidebar.
 */
export interface RefreshCatalogCommandContract {
  readonly commandId: 'awesome-palette.refreshCatalog';

  /**
   * Updated handler behavior:
   * 1. catalogManager.clearCache()          // existing
   * 2. sidebarProvider.refresh()            // existing
   * 3. catalogProvider.refreshInstallationStatus()  // NEW
   */
  readonly handler: () => Promise<void>;
}
