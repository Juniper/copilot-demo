/**
 * SidebarProvider - Lightweight sidebar webview showing catalog overview.
 * Provides quick access to the full catalog panel and displays summary stats.
 */

import * as vscode from 'vscode';
import type { CatalogManager, FileInstaller } from '@awesome-palette/core';

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _catalogManager: CatalogManager,
		private readonly _fileInstaller: FileInstaller
	) {}

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): Promise<void> {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		try {
			// Show loading state first
			webviewView.webview.html = this._getLoadingHtml();

			// Load data asynchronously
			webviewView.webview.html = await this._getHtml();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			webviewView.webview.html = this._getErrorHtml(errorMessage);
			console.error('Failed to resolve sidebar view:', error);
		}

		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.type) {
				case 'openCatalog':
					vscode.commands.executeCommand('awesome-palette.openCatalog');
					break;
				case 'refreshCatalog':
					vscode.commands.executeCommand('awesome-palette.refreshCatalog');
					break;
			}
		});
	}

	/**
	 * Refresh the sidebar content (e.g. after cache clear).
	 */
	public async refresh(): Promise<void> {
		if (this._view) {
			this._view.webview.html = this._getLoadingHtml();
			this._view.webview.html = await this._getHtml();
		}
	}

	private async _getHtml(): Promise<string> {
		// Get workspace folder for installation status
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const targetDir = workspaceFolder?.uri.fsPath;

		const stats = await this._catalogManager.getEnhancedStatistics(
			targetDir,
			this._fileInstaller
		);

		// Format relative time for lastUpdated
		const lastSyncText = this._formatRelativeTime(stats.lastUpdated);

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
        }
        h2 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
        }
        .section {
            margin-bottom: 16px;
            padding: 12px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            font-size: 12px;
        }
        .section-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            line-height: 1.6;
        }
        .stat-label {
            color: var(--vscode-descriptionForeground);
        }
        .stat-value {
            font-weight: 600;
        }
        .source-breakdown {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-left: 16px;
        }
        .total-line {
            padding-top: 8px;
            margin-top: 8px;
            border-top: 1px solid var(--vscode-widget-border);
        }
        .sync-info {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
            margin-top: 8px;
        }
        button {
            display: block;
            width: 100%;
            padding: 8px 12px;
            margin-bottom: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .footer {
            margin-top: 16px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
        }
    </style>
</head>
<body>
    <h2>Awesome Copilot Palette</h2>

    <!-- P1: Combined counts with source breakdown -->
    <div class="section">
        <div class="section-title">Catalog Statistics</div>
        <div class="stat-row">
            <span class="stat-label">Bundled:</span>
            <span class="stat-value">${stats.localEntries}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Online:</span>
            <span class="stat-value">${stats.remoteEntries}</span>
        </div>
        <div class="stat-row total-line">
            <span class="stat-label">Total:</span>
            <span class="stat-value">${stats.totalEntries}</span>
        </div>
        <div style="margin-top: 12px;">
            <div class="stat-row">
                <span class="stat-label">Instructions:</span>
                <span class="stat-value">${stats.instructions.total}</span>
            </div>
            <div class="source-breakdown">${stats.instructions.local} local + ${stats.instructions.remote} remote</div>

            <div class="stat-row" style="margin-top: 4px;">
                <span class="stat-label">Prompts:</span>
                <span class="stat-value">${stats.prompts.total}</span>
            </div>
            <div class="source-breakdown">${stats.prompts.local} local + ${stats.prompts.remote} remote</div>

            <div class="stat-row" style="margin-top: 4px;">
                <span class="stat-label">Agents:</span>
                <span class="stat-value">${stats.agents.total}</span>
            </div>
            <div class="source-breakdown">${stats.agents.local} local + ${stats.agents.remote} remote</div>

            <div class="stat-row" style="margin-top: 4px;">
                <span class="stat-label">Skills:</span>
                <span class="stat-value">${stats.skills.total}</span>
            </div>
            <div class="source-breakdown">${stats.skills.local} local + ${stats.skills.remote} remote</div>

            <div class="stat-row" style="margin-top: 4px;">
                <span class="stat-label">Cookbooks:</span>
                <span class="stat-value">${stats.cookbooks.total}</span>
            </div>
            <div class="source-breakdown">${stats.cookbooks.local} local + ${stats.cookbooks.remote} remote</div>
        </div>
    </div>

    ${stats.installation ? `
    <!-- P2: Installation summary -->
    <div class="section">
        <div class="section-title">Installation Status</div>
        <div class="stat-row">
            <span class="stat-label">Installed:</span>
            <span class="stat-value">${stats.installation.totalInstalled} of ${stats.installation.totalAvailable} (${stats.installation.percentage}%)</span>
        </div>
        <div style="margin-top: 8px;">
            <div class="stat-row">
                <span class="stat-label">├─ Instructions:</span>
                <span class="stat-value">${stats.installation.byType.instructions}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">├─ Prompts:</span>
                <span class="stat-value">${stats.installation.byType.prompts}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">├─ Agents:</span>
                <span class="stat-value">${stats.installation.byType.agents}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">├─ Skills:</span>
                <span class="stat-value">${stats.installation.byType.skills}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">└─ Cookbooks:</span>
                <span class="stat-value">${stats.installation.byType.cookbooks}</span>
            </div>
        </div>
    </div>
    ` : ''}

    <button onclick="openCatalog()">Open Full Catalog</button>
    <button class="secondary" onclick="refreshCatalog()">Refresh Catalog</button>

    <!-- P3: Last sync timestamp -->
    <div class="sync-info">Last synced: ${lastSyncText}</div>

    <div class="footer">
        Browse and install GitHub Copilot<br>instructions, prompts, agents, skills, and cookbooks
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function openCatalog() {
            vscode.postMessage({ type: 'openCatalog' });
        }

        function refreshCatalog() {
            vscode.postMessage({ type: 'refreshCatalog' });
        }
    </script>
</body>
</html>`;
	}

	private _getErrorHtml(errorMessage: string): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
        }
        h2 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-errorForeground);
        }
        .error-message {
            margin-bottom: 16px;
            padding: 12px;
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 4px;
            font-size: 12px;
            color: var(--vscode-errorForeground);
        }
    </style>
</head>
<body>
    <h2>Error Loading Catalog</h2>
    <div class="error-message">${errorMessage}</div>
</body>
</html>`;
	}

	private _getLoadingHtml(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
        }
        .loading {
            text-align: center;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="loading">Loading catalog...</div>
</body>
</html>`;
	}

	private _formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	}
}
