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
		fileInstaller
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

			// Only refresh catalog panel if it's already open
			// Don't force-open it if user just wants to refresh sidebar
			// The panel will auto-refresh when user opens it next time
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
