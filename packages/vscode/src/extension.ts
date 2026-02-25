/**
 * Extension entry point for Awesome Copilot Palette VS Code extension.
 * Wires up core classes with VS Code adapters and registers commands.
 */

import * as vscode from 'vscode';
import {
	CatalogManager,
	RepositoryManager,
	FileInstaller,
} from '@awesome-palette/core';
import { VSCodeLogger } from './adapters/VSCodeLogger';
import { VSCodeConfig } from './adapters/VSCodeConfig';
import { VSCodeFileSystem } from './adapters/VSCodeFileSystem';
import { CatalogWebviewProvider } from './providers/CatalogWebviewProvider';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	// Create output channel
	const outputChannel = vscode.window.createOutputChannel('Awesome Palette');

	try {
		// Initialize core dependencies via adapters
		const logger = new VSCodeLogger(outputChannel);
		logger.info('Starting Awesome Copilot Palette extension...');

		const config = VSCodeConfig.load();
		const fs = new VSCodeFileSystem();

	// Create VS Code-specific asset resolver using extensionUri
	// Assets are bundled in dist/assets/ after esbuild copies them from core
	const resolveAssetPath = (relativePath: string): string => {
		const assetUri = vscode.Uri.joinPath(context.extensionUri, 'dist', 'assets', relativePath);
		return assetUri.fsPath;
	};

	// Build core service graph
	const repoManager = new RepositoryManager(logger, config);
	const catalogManager = new CatalogManager(logger, config, repoManager);
	const fileInstaller = new FileInstaller(logger, fs, resolveAssetPath, config);

	// Create UI providers
	const catalogProvider = new CatalogWebviewProvider(
		context.extensionUri,
		logger,
		catalogManager,
		fileInstaller,
	);

	const sidebarProvider = new SidebarProvider(
		context.extensionUri,
		catalogManager,
		fileInstaller,
		config
	);

	// Register sidebar webview view
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'awesome-palette.catalog',
			sidebarProvider
		)
	);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('awesome-palette.openCatalog', () => {
			catalogProvider.show();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('awesome-palette.refreshCatalog', async () => {
			// Clear cache
			catalogManager.clearCache();

			// Refresh sidebar (await since it's now async)
			await sidebarProvider.refresh();

			await catalogProvider.refreshInstallationStatus();
		})
	);

	// React to configuration changes
	context.subscriptions.push(
		VSCodeConfig.onConfigChange(async _newConfig => {
			logger.info('Configuration changed — catalog cache cleared');
			catalogManager.clearCache();
			await sidebarProvider.refresh();
		})
	);

	// Watch .github/** for file changes and auto-refresh installation status
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	const debouncedRefresh = () => {
		if (debounceTimer) { clearTimeout(debounceTimer); }
		debounceTimer = setTimeout(async () => {
			await catalogProvider.refreshInstallationStatus();
			await sidebarProvider.refresh();
		}, 500);
	};
	// Use RelativePattern per workspace folder — more reliable than an absolute glob
	// string for in-workspace watching (VS Code v1.80+ recommendation).
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(folder, '.github/**')
		);
		watcher.onDidCreate(debouncedRefresh);
		watcher.onDidChange(debouncedRefresh);
		watcher.onDidDelete(debouncedRefresh);
		context.subscriptions.push(watcher);
	}

	// Clean up
	context.subscriptions.push(outputChannel);

	logger.info('Awesome Copilot Palette extension activated');
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		outputChannel.appendLine(`ERROR: Failed to activate extension: ${errorMessage}`);
		if (error instanceof Error && error.stack) {
			outputChannel.appendLine(error.stack);
		}
		vscode.window.showErrorMessage(`Awesome Palette failed to activate: ${errorMessage}`);
		throw error;
	}
}

export function deactivate() {
	// Nothing to clean up — VS Code disposes subscriptions automatically
}
