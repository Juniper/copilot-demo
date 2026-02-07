/**
 * Extension entry point for Awesome Copilot Palette VS Code extension.
 * Wires up core classes with VS Code adapters and registers commands.
 */

import * as vscode from 'vscode';
import {
	CatalogManager,
	RepositoryManager,
	FileInstaller,
	resolveAssetPath
} from '@awesome-palette/core';
import { VSCodeLogger } from './adapters/VSCodeLogger';
import { VSCodeConfig } from './adapters/VSCodeConfig';
import { VSCodeFileSystem } from './adapters/VSCodeFileSystem';
import { CatalogWebviewProvider } from './providers/CatalogWebviewProvider';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	// Create output channel
	const outputChannel = vscode.window.createOutputChannel('Awesome Palette');

	// Initialize core dependencies via adapters
	const logger = new VSCodeLogger(outputChannel);
	const config = VSCodeConfig.load();
	const fs = new VSCodeFileSystem();

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
		catalogManager
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
		vscode.commands.registerCommand('awesome-palette.refreshCatalog', () => {
			catalogManager.clearCache();
			sidebarProvider.refresh();
			catalogProvider.show();
		})
	);

	// React to configuration changes
	context.subscriptions.push(
		VSCodeConfig.onConfigChange(_newConfig => {
			logger.info('Configuration changed — catalog cache cleared');
			catalogManager.clearCache();
			sidebarProvider.refresh();
		})
	);

	// Clean up
	context.subscriptions.push(outputChannel);

	logger.info('Awesome Copilot Palette extension activated');
}

export function deactivate() {
	// Nothing to clean up — VS Code disposes subscriptions automatically
}
