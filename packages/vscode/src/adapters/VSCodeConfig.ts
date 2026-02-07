/**
 * VSCodeConfig — bridges PaletteConfig interface to vscode.workspace.getConfiguration()
 */
import * as vscode from 'vscode';
import type { PaletteConfig, RepositoryConfig } from '@awesome-palette/core';

const SECTION = 'awesome-palette';

export class VSCodeConfig {
	/**
	 * Load PaletteConfig from VS Code workspace settings
	 */
	static load(): PaletteConfig {
		const config = vscode.workspace.getConfiguration(SECTION);

		const remoteRepositories = config.get<RepositoryConfig[]>('remoteRepositories', [
			{
				owner: 'HPE-EMU',
				repo: 'awesome-copilot',
				branch: 'main',
				enabled: true
			}
		]);

		const enableOnlineFetching = config.get<boolean>('enableOnlineFetching', true);
		const githubToken = config.get<string>('githubToken', '') || undefined;

		const cacheEnabled = config.get<boolean>('cache.enabled', true);
		const onlineTtlMs = config.get<number>('cache.onlineTtlMs', 3 * 60 * 60 * 1000);
		const enhancedTtlMs = config.get<number>('cache.enhancedTtlMs', 30 * 60 * 1000);

		// Get extension version for cache invalidation
		const extension = vscode.extensions.getExtension('awesome-palette.awesome-palette-vscode');
		const version = extension?.packageJSON?.version;

		return {
			remoteRepositories,
			enableOnlineFetching,
			githubToken,
			version,
			cache: {
				enabled: cacheEnabled,
				onlineTtlMs,
				enhancedTtlMs
			}
		};
	}

	/**
	 * Register a listener that reloads config on settings change
	 */
	static onConfigChange(callback: (config: PaletteConfig) => void): vscode.Disposable {
		return vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration(SECTION)) {
				callback(VSCodeConfig.load());
			}
		});
	}
}
