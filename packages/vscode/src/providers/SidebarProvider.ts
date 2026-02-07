/**
 * SidebarProvider - Lightweight sidebar webview showing catalog overview.
 * Provides quick access to the full catalog panel and displays summary stats.
 */

import * as vscode from 'vscode';
import type { CatalogManager } from '@awesome-palette/core';

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _catalogManager: CatalogManager
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtml();

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
	public refresh(): void {
		if (this._view) {
			this._view.webview.html = this._getHtml();
		}
	}

	private _getHtml(): string {
		const stats = this._catalogManager.getStatistics();

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
        .stats {
            margin-bottom: 16px;
            padding: 12px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.8;
        }
        .stat-label {
            color: var(--vscode-descriptionForeground);
        }
        .stat-value {
            font-weight: 600;
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

    <div class="stats">
        <span class="stat-label">Total entries:</span> <span class="stat-value">${stats.totalEntries}</span><br>
        <span class="stat-label">Instructions:</span> <span class="stat-value">${stats.instructions}</span><br>
        <span class="stat-label">Prompts:</span> <span class="stat-value">${stats.prompts}</span><br>
        <span class="stat-label">Chat Modes:</span> <span class="stat-value">${stats.chatmodes}</span>
    </div>

    <button onclick="openCatalog()">Open Full Catalog</button>
    <button class="secondary" onclick="refreshCatalog()">Refresh Catalog</button>

    <div class="footer">
        Browse and install GitHub Copilot<br>instructions, prompts, and chatmodes
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
}
