/**
 * SidebarProvider - Lightweight sidebar webview showing catalog overview.
 * Provides quick access to the full catalog panel and displays summary stats.
 */

import * as vscode from 'vscode';
import type { CatalogManager, FileInstaller, PaletteConfig, RepositoryConfig } from '@awesome-palette/core';
import { VSCodeConfig } from '../adapters/VSCodeConfig';

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _config: PaletteConfig;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _catalogManager: CatalogManager,
		private readonly _fileInstaller: FileInstaller,
		config: PaletteConfig
	) {
		this._config = config;
	}

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

		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch (message.type) {
				case 'openCatalog':
					vscode.commands.executeCommand('awesome-palette.openCatalog');
					break;
				case 'refreshCatalog':
					vscode.commands.executeCommand('awesome-palette.refreshCatalog');
					break;
				case 'openFolder':
					vscode.commands.executeCommand('vscode.openFolder');
					break;
				case 'addRepository':
					await this._handleAddRepository(message);
					break;
				case 'removeRepository':
					await this._handleRemoveRepository(message);
					break;
				case 'toggleRepository':
					await this._handleToggleRepository(message);
					break;
			}
		});
	}

	/**
	 * Refresh the sidebar content (e.g. after cache clear).
	 */
	public async refresh(): Promise<void> {
		this._config = VSCodeConfig.load();
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
			this._fileInstaller,
			workspaceFolder
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

        /* Workspace connection status */
        .workspace-status {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        .workspace-icon {
            font-size: 16px;
            margin-right: 8px;
            line-height: 1;
        }
        .workspace-details {
            flex: 1;
        }
        .workspace-name {
            font-weight: 600;
            margin-bottom: 4px;
        }
        .workspace-detail-row {
            display: flex;
            align-items: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 2px;
        }
        .workspace-detail-row .icon {
            margin-right: 4px;
            font-size: 12px;
        }
        .status-ok {
            color: var(--vscode-charts-green);
        }
        .status-warning {
            color: var(--vscode-charts-yellow);
        }
        .status-error {
            color: var(--vscode-charts-red);
        }
        .workspace-warning {
            margin-top: 8px;
            padding: 8px;
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 4px;
            font-size: 11px;
        }

        /* Rate limit indicator */
        .rate-limit-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .rate-remaining {
            font-size: 20px;
            font-weight: 700;
        }
        .rate-reset {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        .rate-bar-container {
            height: 6px;
            background-color: var(--vscode-widget-border);
            border-radius: 3px;
            overflow: hidden;
            margin: 8px 0;
        }
        .rate-bar-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        .rate-bar-green {
            background-color: var(--vscode-charts-green);
        }
        .rate-bar-yellow {
            background-color: var(--vscode-charts-yellow);
        }
        .rate-bar-red {
            background-color: var(--vscode-charts-red);
        }
        .rate-token-message {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
            padding: 6px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 3px;
        }

        .footer {
            margin-top: 16px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
        }

        /* Repository Manager Styles */
        .repo-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .repo-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .repo-item:last-child {
            border-bottom: none;
        }
        .repo-item-info {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
        }
        .repo-item-name {
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .repo-item-name.disabled {
            color: var(--vscode-descriptionForeground);
            text-decoration: line-through;
        }
        .repo-pinned-badge {
            font-size: 9px;
            padding: 1px 4px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            flex-shrink: 0;
        }
        .repo-item-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
        }
        .repo-toggle {
            position: relative;
            width: 32px;
            height: 18px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 9px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .repo-toggle.on {
            background-color: var(--vscode-button-background);
            border-color: var(--vscode-button-background);
        }
        .repo-toggle-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 12px;
            height: 12px;
            background-color: var(--vscode-foreground);
            border-radius: 50%;
            transition: transform 0.2s;
        }
        .repo-toggle.on .repo-toggle-knob {
            transform: translateX(14px);
        }
        .repo-remove-btn {
            background: none;
            border: none;
            color: var(--vscode-descriptionForeground);
            cursor: pointer;
            font-size: 14px;
            padding: 2px 4px;
            border-radius: 3px;
            width: auto;
            margin-bottom: 0;
        }
        .repo-remove-btn:hover {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-list-hoverBackground);
        }
        .add-repo-toggle {
            font-size: 11px;
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            background: none;
            border: none;
            padding: 4px 0;
            margin-top: 8px;
            margin-bottom: 0;
            width: auto;
            text-align: left;
        }
        .add-repo-toggle:hover {
            color: var(--vscode-textLink-activeForeground);
            background: none;
        }
        .add-repo-form {
            display: none;
            margin-top: 8px;
            padding: 8px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .add-repo-form.visible {
            display: block;
        }
        .add-repo-form label {
            display: block;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 2px;
            margin-top: 6px;
        }
        .add-repo-form label:first-child {
            margin-top: 0;
        }
        .add-repo-form input {
            width: 100%;
            padding: 4px 6px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 12px;
            font-family: var(--vscode-font-family);
            box-sizing: border-box;
        }
        .add-repo-form input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        .add-repo-form-actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }
        .add-repo-form-actions button {
            flex: 1;
            padding: 4px 8px;
            font-size: 11px;
            margin-bottom: 0;
        }
        .add-repo-error {
            font-size: 11px;
            color: var(--vscode-errorForeground);
            margin-top: 4px;
            display: none;
        }
        .add-repo-error.visible {
            display: block;
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
                <span class="stat-label">└─ Skills:</span>
                <span class="stat-value">${stats.installation.byType.skills}</span>
            </div>
        </div>
    </div>
    ` : ''}

    ${stats.workspace ? `
    <!-- Item M: Workspace Connection Status -->
    <div class="section">
        <div class="section-title">Workspace Connection</div>
        ${stats.workspace.isOpen ? `
            <div class="workspace-status">
                <div class="workspace-icon">${stats.workspace.hasWritePermission ? '✓' : '⚠'}</div>
                <div class="workspace-details">
                    <div class="workspace-name">${stats.workspace.folderName}</div>
                    <div class="workspace-detail-row">
                        <span class="icon ${stats.workspace.hasGithubDirectory ? 'status-ok' : 'status-warning'}">●</span>
                        <span>.github/ ${stats.workspace.hasGithubDirectory ? 'exists' : 'not created yet'}</span>
                    </div>
                    <div class="workspace-detail-row">
                        <span class="icon ${stats.workspace.hasWritePermission ? 'status-ok' : 'status-error'}">●</span>
                        <span>Write ${stats.workspace.hasWritePermission ? 'enabled' : 'denied'}</span>
                    </div>
                    ${!stats.workspace.hasGithubDirectory ? `
                        <div style="margin-top: 4px; font-size: 10px; color: var(--vscode-descriptionForeground);">
                            Target: ${stats.workspace.targetPath}
                        </div>
                    ` : ''}
                </div>
            </div>
            ${stats.workspace.permissionError ? `
                <div class="workspace-warning">
                    Permission error: ${stats.workspace.permissionError}
                </div>
            ` : ''}
        ` : `
            <div class="workspace-warning">
                ⚠️ No workspace folder is open. Files cannot be installed without an open workspace.
                <button onclick="openFolder()" style="margin-top: 8px; width: 100%;">Open Folder</button>
            </div>
        `}
    </div>
    ` : ''}

    ${stats.rateLimit ? `
    <!-- Item R: API Rate Limit Indicator -->
    <div class="section">
        <div class="section-title">GitHub API Rate Limit</div>
        <div class="rate-limit-header">
            <div>
                <div class="rate-remaining status-${stats.rateLimit.color}">
                    ${stats.rateLimit.remaining}
                </div>
                <div style="font-size: 11px; color: var(--vscode-descriptionForeground);">
                    of ${stats.rateLimit.limit} remaining
                </div>
            </div>
            <div style="text-align: right;">
                <div class="rate-reset">
                    Resets in<br>${stats.rateLimit.minutesUntilReset} min
                </div>
            </div>
        </div>
        <div class="rate-bar-container">
            <div class="rate-bar-fill rate-bar-${stats.rateLimit.color}"
                 style="width: ${Math.round((stats.rateLimit.remaining / stats.rateLimit.limit) * 100)}%">
            </div>
        </div>
        ${!stats.rateLimit.hasToken ? `
            <div class="rate-token-message">
                💡 <strong>Tip:</strong> Add a GitHub token in settings for higher limits (5000/hour).
            </div>
        ` : ''}
        ${stats.rateLimit.repositories.length > 0 ? `
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 8px;">
                Tracking: ${stats.rateLimit.repositories.join(', ')}
            </div>
        ` : ''}
    </div>
    ` : ''}

    <!-- Repository Manager -->
    <div class="section">
        <div class="section-title">Repositories</div>
        <ul class="repo-list">
            ${this._generateRepoListItems()}
        </ul>
        <button class="add-repo-toggle" onclick="toggleAddRepoForm()">+ Add Repository</button>
        <div class="add-repo-form" id="addRepoForm">
            <label>Owner <span style="color: var(--vscode-errorForeground);">*</span></label>
            <input type="text" id="repoOwner" placeholder="e.g. microsoft" />
            <label>Repository <span style="color: var(--vscode-errorForeground);">*</span></label>
            <input type="text" id="repoName" placeholder="e.g. awesome-copilot" />
            <label>Branch</label>
            <input type="text" id="repoBranch" placeholder="main (default)" />
            <div class="add-repo-error" id="addRepoError"></div>
            <div class="add-repo-form-actions">
                <button onclick="addRepository()">Add</button>
                <button class="secondary" onclick="cancelAddRepo()">Cancel</button>
            </div>
        </div>
    </div>

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

        function openFolder() {
            vscode.postMessage({ type: 'openFolder' });
        }

        // Repository management functions
        function toggleAddRepoForm() {
            const form = document.getElementById('addRepoForm');
            if (form) {
                form.classList.toggle('visible');
                if (form.classList.contains('visible')) {
                    document.getElementById('repoOwner')?.focus();
                }
            }
        }

        function cancelAddRepo() {
            const form = document.getElementById('addRepoForm');
            if (form) {
                form.classList.remove('visible');
            }
            clearAddRepoForm();
        }

        function clearAddRepoForm() {
            const ownerInput = document.getElementById('repoOwner');
            const nameInput = document.getElementById('repoName');
            const branchInput = document.getElementById('repoBranch');
            const errorEl = document.getElementById('addRepoError');
            if (ownerInput) ownerInput.value = '';
            if (nameInput) nameInput.value = '';
            if (branchInput) branchInput.value = '';
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.remove('visible');
            }
        }

        function showAddRepoError(message) {
            const errorEl = document.getElementById('addRepoError');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.add('visible');
            }
        }

        function addRepository() {
            const owner = (document.getElementById('repoOwner')?.value || '').trim();
            const repo = (document.getElementById('repoName')?.value || '').trim();
            const branch = (document.getElementById('repoBranch')?.value || '').trim() || 'main';

            if (!owner) {
                showAddRepoError('Owner is required.');
                return;
            }
            if (!repo) {
                showAddRepoError('Repository name is required.');
                return;
            }
            if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
                showAddRepoError('Invalid characters in owner or repo name.');
                return;
            }

            vscode.postMessage({
                type: 'addRepository',
                owner: owner,
                repo: repo,
                branch: branch
            });
        }

        function toggleRepository(owner, repo) {
            vscode.postMessage({
                type: 'toggleRepository',
                owner: owner,
                repo: repo
            });
        }

        function removeRepository(owner, repo) {
            vscode.postMessage({
                type: 'removeRepository',
                owner: owner,
                repo: repo
            });
        }
    </script>
</body>
</html>`;
	}

	/**
	 * Check if a repo config matches the default pinned repository.
	 */
	private _isDefaultRepo(repo: RepositoryConfig): boolean {
		return repo.owner === 'github' && repo.repo === 'awesome-copilot';
	}

	/**
	 * Escape HTML entities for safe interpolation.
	 */
	private _escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/**
	 * Generate the list items for the repository manager section.
	 */
	private _generateRepoListItems(): string {
		const repos = this._config.remoteRepositories;
		if (repos.length === 0) {
			return '<li style="font-size: 11px; color: var(--vscode-descriptionForeground); padding: 4px 0;">No repositories configured.</li>';
		}

		return repos.map(repo => {
			const isPinned = this._isDefaultRepo(repo);
			const displayName = `${this._escapeHtml(repo.owner)}/${this._escapeHtml(repo.repo)}`;
			const nameClass = repo.enabled ? 'repo-item-name' : 'repo-item-name disabled';
			const toggleClass = repo.enabled ? 'repo-toggle on' : 'repo-toggle';
			const ownerEscaped = this._escapeHtml(repo.owner);
			const repoEscaped = this._escapeHtml(repo.repo);

			return `
                <li class="repo-item">
                    <div class="repo-item-info">
                        <span class="${nameClass}" title="${displayName} (${this._escapeHtml(repo.branch)})">${displayName}</span>
                        ${isPinned ? '<span class="repo-pinned-badge">DEFAULT</span>' : ''}
                    </div>
                    <div class="repo-item-actions">
                        <div class="${toggleClass}" onclick="toggleRepository('${ownerEscaped}', '${repoEscaped}')" title="${repo.enabled ? 'Disable' : 'Enable'} this repository">
                            <div class="repo-toggle-knob"></div>
                        </div>
                        ${!isPinned ? `<button class="repo-remove-btn" onclick="removeRepository('${ownerEscaped}', '${repoEscaped}')" title="Remove repository">&times;</button>` : ''}
                    </div>
                </li>`;
		}).join('');
	}

	/**
	 * Handle addRepository message from the webview.
	 */
	private async _handleAddRepository(message: { owner: string; repo: string; branch: string }): Promise<void> {
		const { owner, repo, branch } = message;
		const repos = [...this._config.remoteRepositories];

		// Check for duplicates
		const exists = repos.some(r => r.owner === owner && r.repo === repo);
		if (exists) {
			vscode.window.showWarningMessage(`Repository ${owner}/${repo} is already configured.`);
			return;
		}

		repos.push({ owner, repo, branch: branch || 'main', enabled: true });
		await VSCodeConfig.updateRepositories(repos);
	}

	/**
	 * Handle removeRepository message from the webview.
	 */
	private async _handleRemoveRepository(message: { owner: string; repo: string }): Promise<void> {
		const { owner, repo } = message;

		// Prevent removing the default pinned repo
		if (owner === 'github' && repo === 'awesome-copilot') {
			vscode.window.showWarningMessage('The default repository cannot be removed.');
			return;
		}

		const repos = this._config.remoteRepositories.filter(
			r => !(r.owner === owner && r.repo === repo)
		);
		await VSCodeConfig.updateRepositories(repos);
	}

	/**
	 * Handle toggleRepository message from the webview.
	 */
	private async _handleToggleRepository(message: { owner: string; repo: string }): Promise<void> {
		const { owner, repo } = message;
		const repos = this._config.remoteRepositories.map(r => {
			if (r.owner === owner && r.repo === repo) {
				return { ...r, enabled: !r.enabled };
			}
			return r;
		});
		await VSCodeConfig.updateRepositories(repos);
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
