/**
 * CatalogWebviewProvider - Handles catalog display, search, and file installation.
 * Ported from Project-Olorin's CatalogWebviewProvider. Uses @awesome-palette/core
 * classes instead of direct vscode.* APIs for business logic.
 */

import * as vscode from 'vscode';
import type {
	Logger,
	CatalogManager,
	FileInstaller,
	InstallableFile,
	InstallableFileWithStatus,
	InstallationResult,
	CatalogEntry,
} from '@awesome-palette/core';
import { ConflictResolution } from '@awesome-palette/core';
import { IWebviewProvider } from '../types';
import { CatalogTemplate, CatalogTemplateData } from '../templates/CatalogTemplate';

export interface CatalogFilter {
	type?: 'all' | 'installed' | 'available' | 'recommended';
	fileTypes?: ('instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook')[];
	sources?: ('Bundled' | 'Online')[];
	recommendedFiles?: string[];
}

export class CatalogWebviewProvider implements IWebviewProvider {
	private _panel?: vscode.WebviewPanel;
	private readonly _logger: Logger;
	private readonly _catalogManager: CatalogManager;
	private readonly _fileInstaller: FileInstaller;
	private readonly _template: CatalogTemplate;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		logger: Logger,
		catalogManager: CatalogManager,
		fileInstaller: FileInstaller,
	) {
		this._logger = logger;
		this._catalogManager = catalogManager;
		this._fileInstaller = fileInstaller;
		this._template = new CatalogTemplate(_extensionUri);
	}

	/**
	 * Show the catalog webview. Reuses existing panel if available.
	 */
	public async show(filter?: CatalogFilter): Promise<void> {
		try {
			const filterType = filter?.type || 'all';
			this._logger.info(`Show catalog requested with filter: ${filterType}`);

			// Collect all available files from bundled assets and online repositories
			const catalogData = await this._collectCatalogData();

			// Apply filter to catalog data
			const filteredData = this._applyFilter(catalogData, filter);

			// Check if panel already exists and is visible
			if (this._panel) {
				this._logger.info('Reusing existing catalog panel');

				// Update panel title
				this._panel.title = this._getTitleForFilter(filterType);

				// Update content
				this._panel.webview.html = await this._getCatalogHtml(filteredData, filter);

				// Reveal the panel (bring to front)
				this._panel.reveal(vscode.ViewColumn.Beside);

				this._logger.info(`Catalog refreshed with ${filteredData.length} files (filtered from ${catalogData.length})`);
				return;
			}

			// Create new panel if none exists
			this._logger.info('Creating new catalog panel');
			this._panel = vscode.window.createWebviewPanel(
				'awesomePaletteCatalog',
				this._getTitleForFilter(filterType),
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true
				}
			);

			this._panel.webview.html = await this._getCatalogHtml(filteredData, filter);

			// Handle messages from the catalog webview
			this._panel.webview.onDidReceiveMessage(async message => {
				const messageData = message.data || message;
				switch (message.type) {
					case 'installFile':
						await this._handleInstallFile(messageData.fileData, messageData.conflictResolution);
						break;
					case 'batchInstall':
						await this._handleBatchInstall(messageData.selectedFiles, messageData.conflictResolution);
						break;
					case 'checkInstallationStatus':
						await this._handleCheckInstallationStatus(messageData.files);
						break;
					case 'resolveConflict':
						await this._handleConflictResolution(messageData.fileData, messageData.resolution);
						break;
					case 'previewFile':
						await this._handlePreviewFile(messageData.fileData);
						break;
					case 'openInEditor':
						await this._handleOpenInEditor(messageData.fileData);
						break;
					default:
						this._logger.warn(`Unknown message type in catalog: ${message.type}`);
				}
			});

			// Handle panel disposal
			this._panel.onDidDispose(() => {
				this._logger.info('Catalog panel disposed');
				this._panel = undefined;
			});

			this._logger.info(`Catalog displayed with ${filteredData.length} files (filtered from ${catalogData.length})`);

		} catch (error) {
			this._logger.error('Failed to show catalog', error);
			vscode.window.showErrorMessage(
				`Failed to display catalog: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Hide the catalog webview
	 */
	public hide(): void {
		if (this._panel) {
			this._panel.dispose();
			this._panel = undefined;
		}
	}

	/**
	 * Refresh installation status badges in the catalog panel.
	 * No-op if the panel is not open (FR-006).
	 */
	public async refreshInstallationStatus(): Promise<void> {
		if (!this._panel) { return; }
		try {
			const catalogData = await this._collectCatalogData();
			const targetDir = this._getTargetDir();
			if (!targetDir) { return; }
			const filesWithStatus = await this._fileInstaller.getInstallationStatus(catalogData, targetDir);
			if (!this._panel) { return; } // Re-check: panel may have closed during async work
			this._panel.webview.postMessage({
				type: 'installationStatusUpdate',
				filesWithStatus
			});
		} catch (error) {
			this._logger.warn(`Failed to refresh installation status: ${error}`);
		}
	}

	/**
	 * Dispose of resources
	 */
	public dispose(): void {
		this.hide();
	}

	// ── Data collection ───────────────────────────────────────────────

	/**
	 * Collect catalog data from both bundled assets and online repositories.
	 * Uses CatalogManager from core instead of manually scanning the filesystem.
	 */
	private async _collectCatalogData(): Promise<InstallableFile[]> {
		const catalogData: InstallableFile[] = [];
		const addedFiles = new Set<string>();

		try {
			this._logger.info('Collecting catalog data...');

			// 1. Get all local catalog entries from CatalogManager
			const localEntries = this._catalogManager.getAll();
			for (const entry of localEntries) {
				const fileKey = `${entry.type}-${entry.id}`;
				if (!addedFiles.has(fileKey)) {
					catalogData.push(this._catalogEntryToInstallableFile(entry, 'Bundled'));
					addedFiles.add(fileKey);
				}
			}

			this._logger.info(`Added ${localEntries.length} local catalog entries`);

			// 2. Get enhanced catalog (includes remote files)
			try {
				const enhancedCatalog = await this._catalogManager.getEnhancedCatalog();

				this._logger.info(`Enhanced catalog loaded: local=${enhancedCatalog.metadata.localCount}, remote=${enhancedCatalog.metadata.remoteCount}`);

				// Add remote instructions
				for (const instruction of enhancedCatalog.combined.instructions) {
					if (!instruction.includes('(remote)')) { continue; }
					const name = instruction.split(' - ')[0].split('/').pop()?.replace('.instructions.md', '') || instruction;
					const fileKey = `instruction-${name}`;
					if (!addedFiles.has(fileKey)) {
						catalogData.push({
							name,
							type: 'instruction',
							source: 'Online',
							path: `catalog/instructions/${name}`,
							description: instruction.split(' - ')[1]?.replace(' (remote)', '') || 'From online catalog'
						});
						addedFiles.add(fileKey);
					}
				}

				// Add remote prompts
				for (const prompt of enhancedCatalog.combined.prompts) {
					if (!prompt.includes('(remote)')) { continue; }
					const name = prompt.split(' - ')[0].split('/').pop()?.replace('.prompt.md', '') || prompt;
					const fileKey = `prompt-${name}`;
					if (!addedFiles.has(fileKey)) {
						catalogData.push({
							name,
							type: 'prompt',
							source: 'Online',
							path: `catalog/prompts/${name}`,
							description: prompt.split(' - ')[1]?.replace(' (remote)', '') || 'From online catalog'
						});
						addedFiles.add(fileKey);
					}
				}

				// Add remote agents
				for (const agent of enhancedCatalog.combined.agents) {
					if (!agent.includes('(remote)')) { continue; }
					const name = agent.split(' - ')[0].split('/').pop()?.replace('.agent.md', '') || agent;
					const fileKey = `agent-${name}`;
					if (!addedFiles.has(fileKey)) {
						catalogData.push({
							name,
							type: 'agent',
							source: 'Online',
							path: `catalog/agents/${name}`,
							description: agent.split(' - ')[1]?.replace(' (remote)', '') || 'From online catalog'
						});
						addedFiles.add(fileKey);
					}
				}

				// Add remote skills (folder-based) - use full RemoteFile data
				for (const remoteSkill of enhancedCatalog.remote.skills || []) {
					const fileKey = `skill-${remoteSkill.name}`;
					if (!addedFiles.has(fileKey)) {
						catalogData.push({
							name: remoteSkill.name,
							type: 'skill',
							source: 'Online',
							path: remoteSkill.path,
							description: `${remoteSkill.name} from ${remoteSkill.repository.name}`,
							// Include folder metadata for installation
							isFolder: remoteSkill.isFolder,
							files: remoteSkill.files
						});
						addedFiles.add(fileKey);
					}
				}

				// Add remote cookbooks
				for (const cookbook of enhancedCatalog.combined.cookbooks || []) {
					if (!cookbook.includes('(remote)')) { continue; }
					const name = cookbook.split(' - ')[0].split('/').pop()?.replace('.cookbook.md', '') || cookbook;
					const fileKey = `cookbook-${name}`;
					if (!addedFiles.has(fileKey)) {
						catalogData.push({
							name,
							type: 'cookbook',
							source: 'Online',
							path: `catalog/cookbooks/${name}`,
							description: cookbook.split(' - ')[1]?.replace(' (remote)', '') || 'From online catalog'
						});
						addedFiles.add(fileKey);
					}
				}
			} catch (error) {
				this._logger.warn(`Error loading online catalog, using local only: ${error}`);
			}

			this._logger.info(`Collected ${catalogData.length} total catalog files`);
			return catalogData;

		} catch (error) {
			this._logger.error('Failed to collect catalog data', error);
			return catalogData;
		}
	}

	/**
	 * Convert a CatalogEntry to an InstallableFile.
	 */
	private _catalogEntryToInstallableFile(entry: CatalogEntry, source: 'Bundled' | 'Online'): InstallableFile {
		// Use filePath directly - it already contains the full path (e.g., 'agents/Code.agent.md')
		return {
			name: entry.filePath.replace(/\.(instructions|prompt|agent|skill|cookbook)\.md$/, ''),
			type: entry.type as 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook',
			source,
			path: entry.filePath,
			description: entry.description
		};
	}

	// ── HTML generation ───────────────────────────────────────────────

	/**
	 * Generate HTML for the catalog webview.
	 */
	private async _getCatalogHtml(catalogData?: InstallableFile[], filter?: CatalogFilter): Promise<string> {
		if (!catalogData) {
			catalogData = await this._collectCatalogData();
		}

		const targetDir = this._getTargetDir();
		let filesWithStatus: InstallableFileWithStatus[];

		if (targetDir) {
			filesWithStatus = await this._fileInstaller.getInstallationStatus(catalogData, targetDir);
		} else {
			// No workspace open — mark everything as available
			filesWithStatus = catalogData.map(file => ({
				...file,
				status: 'available' as const,
				targetPath: ''
			}));
		}

		// Apply post-status filters
		if (filter?.type === 'installed') {
			filesWithStatus = filesWithStatus.filter(file => file.status === 'installed');
		} else if (filter?.type === 'available') {
			filesWithStatus = filesWithStatus.filter(file => file.status === 'available');
		}

		return this._template.generateCatalogHtml(filesWithStatus);
	}

	// ── Filter helpers ────────────────────────────────────────────────

	/**
	 * Apply filter to catalog data (pre-status check).
	 */
	private _applyFilter(catalogData: InstallableFile[], filter?: CatalogFilter): InstallableFile[] {
		if (!filter || filter.type === 'all') {
			return catalogData;
		}

		let filtered = catalogData;

		if (filter.type === 'recommended' && filter.recommendedFiles) {
			filtered = catalogData.filter(file => filter.recommendedFiles!.includes(file.name));
		}

		if (filter.fileTypes && filter.fileTypes.length > 0) {
			filtered = filtered.filter(file => filter.fileTypes!.includes(file.type));
		}

		if (filter.sources && filter.sources.length > 0) {
			filtered = filtered.filter(file => filter.sources!.includes(file.source));
		}

		return filtered;
	}

	/**
	 * Get appropriate title for the filter type.
	 */
	private _getTitleForFilter(filterType: string): string {
		switch (filterType) {
			case 'installed':
				return 'Awesome Palette — Installed Files';
			case 'available':
				return 'Awesome Palette — Available Files';
			case 'recommended':
				return 'Awesome Palette — Recommended Files';
			default:
				return 'Awesome Palette — File Catalog';
		}
	}

	// ── Installation handlers ─────────────────────────────────────────

	/**
	 * Get the workspace target directory for file installation.
	 */
	private _getTargetDir(): string | undefined {
		return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	}

	/**
	 * Handle file installation.
	 */
	private async _handleInstallFile(fileData: InstallableFile, conflictResolution?: ConflictResolution): Promise<void> {
		try {
			const targetDir = this._getTargetDir();
			if (!targetDir) {
				vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
				return;
			}

			this._logger.info(`Installing file: ${fileData.name}`);

			const result = await this._fileInstaller.installFile(fileData, targetDir, conflictResolution);

			if (result.success) {
				this._logger.info(`File installed successfully: ${fileData.name}`);
				vscode.window.showInformationMessage(`Installed: ${fileData.name}`);

				if (this._panel) {
					this._panel.webview.postMessage({
						type: 'fileInstalled',
						fileName: fileData.name
					});
				}
			} else {
				this._logger.info(`File installation failed: ${fileData.name} - ${result.error}`);
				vscode.window.showErrorMessage(`Installation failed: ${fileData.name} - ${result.error}`);

				if (this._panel) {
					this._panel.webview.postMessage({
						type: 'installationError',
						fileName: fileData.name,
						error: result.error
					});
				}
			}

		} catch (error) {
			this._logger.error(`Installation error for ${fileData.name}`, error);
			vscode.window.showErrorMessage(`Installation error: ${error}`);
		}
	}

	/**
	 * Handle batch installation.
	 */
	private async _handleBatchInstall(selectedFiles: InstallableFile[], conflictResolution?: ConflictResolution): Promise<void> {
		try {
			const targetDir = this._getTargetDir();
			if (!targetDir) {
				vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
				return;
			}

			if (!selectedFiles || !Array.isArray(selectedFiles) || selectedFiles.length === 0) {
				this._logger.error('Batch installation: no files provided');
				return;
			}

			this._logger.info(`Batch installing ${selectedFiles.length} files`);

			const results = await this._fileInstaller.installFiles(selectedFiles, targetDir, conflictResolution);

			const successCount = results.filter((r: InstallationResult) => r.success).length;
			const failureCount = results.length - successCount;

			this._logger.info(`Batch install complete: ${successCount} success, ${failureCount} failures`);

			if (failureCount === 0) {
				vscode.window.showInformationMessage(`Successfully installed all ${successCount} files`);
			} else {
				vscode.window.showWarningMessage(`Installed ${successCount}/${results.length} files. ${failureCount} failed.`);
			}

			if (this._panel) {
				this._panel.webview.postMessage({
					type: 'batchInstallComplete',
					results: results
				});
			}

		} catch (error) {
			this._logger.error('Batch installation error', error);
			vscode.window.showErrorMessage(`Batch installation error: ${error}`);
		}
	}

	/**
	 * Handle installation status check.
	 */
	private async _handleCheckInstallationStatus(files: InstallableFile[]): Promise<void> {
		try {
			const targetDir = this._getTargetDir();
			if (!targetDir) { return; }

			const filesWithStatus = await this._fileInstaller.getInstallationStatus(files, targetDir);

			if (this._panel) {
				this._panel.webview.postMessage({
					type: 'installationStatusUpdate',
					filesWithStatus: filesWithStatus
				});
			}
		} catch (error) {
			this._logger.error('Status check error', error);
		}
	}

	/**
	 * Handle conflict resolution.
	 */
	private async _handleConflictResolution(fileData: InstallableFile, resolution: ConflictResolution): Promise<void> {
		await this._handleInstallFile(fileData, resolution);
	}

	// ── Preview handlers ──────────────────────────────────────────────

	/**
	 * Handle preview request: fetch file content and send it back to the webview.
	 * For skills (folder-based), fetches the SKILL.md marker file.
	 */
	private async _handlePreviewFile(fileData: InstallableFile): Promise<void> {
		try {
			this._logger.info(`Preview requested for: ${fileData.name}`);

			let content: string;

			if (fileData.isFolder && fileData.files && fileData.files.length > 0) {
				// Skill: find and fetch the SKILL.md marker file
				const skillMarker = fileData.files.find(
					f => f.relativePath.toLowerCase().endsWith('skill.md')
				);

				if (skillMarker && skillMarker.downloadUrl) {
					content = await this._fetchUrlContent(skillMarker.downloadUrl);
				} else {
					content = `# ${fileData.name}\n\nThis skill does not contain a SKILL.md file.\n\nFiles in this skill:\n${fileData.files.map(f => '- ' + f.relativePath).join('\n')}`;
				}
			} else {
				content = await this._fileInstaller.getFileContent(fileData);
			}

			if (this._panel) {
				this._panel.webview.postMessage({
					type: 'previewContent',
					fileName: fileData.name,
					content
				});
			}
		} catch (error) {
			this._logger.error(`Preview error for ${fileData.name}`, error);
			if (this._panel) {
				this._panel.webview.postMessage({
					type: 'previewError',
					fileName: fileData.name,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	}

	/**
	 * Handle "Open in Editor": fetch content and open in a VS Code editor tab.
	 */
	private async _handleOpenInEditor(fileData: InstallableFile): Promise<void> {
		try {
			this._logger.info(`Open in editor requested for: ${fileData.name}`);

			let content: string;

			if (fileData.isFolder && fileData.files && fileData.files.length > 0) {
				const skillMarker = fileData.files.find(
					f => f.relativePath.toLowerCase().endsWith('skill.md')
				);
				if (skillMarker && skillMarker.downloadUrl) {
					content = await this._fetchUrlContent(skillMarker.downloadUrl);
				} else {
					content = `# ${fileData.name}\n\nNo SKILL.md file found.`;
				}
			} else {
				content = await this._fileInstaller.getFileContent(fileData);
			}

			const doc = await vscode.workspace.openTextDocument({
				content,
				language: 'markdown'
			});
			await vscode.window.showTextDocument(doc, { preview: true });

		} catch (error) {
			this._logger.error(`Open in editor error for ${fileData.name}`, error);
			vscode.window.showErrorMessage(
				`Failed to open ${fileData.name} in editor: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Fetch raw content from a URL (used for skill marker files).
	 */
	private async _fetchUrlContent(url: string): Promise<string> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		return response.text();
	}
}
