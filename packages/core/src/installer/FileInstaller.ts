import * as path from 'path';

import type { Logger } from '../interfaces/Logger.js';
import type { FileSystem } from '../interfaces/FileSystem.js';
import type { PaletteConfig } from '../interfaces/Config.js';
import {
	ConflictResolution,
	type InstallableFile,
	type InstallableFileWithStatus,
	type InstallationResult,
	type InstallationStatus,
} from '../types/installer.js';

/**
 * Platform-agnostic file installer.
 *
 * Handles both bundled assets and online repository files without any
 * VS Code dependency.  All file-system access goes through the injected
 * `FileSystem` interface and workspace detection is replaced by an
 * explicit `targetDir` parameter on every public method.
 */
export class FileInstaller {
	private readonly _logger: Logger;
	private readonly _fileSystem: FileSystem;
	private readonly _assetResolver: (relativePath: string) => string;
	private readonly _config?: PaletteConfig;

	constructor(
		logger: Logger,
		fileSystem: FileSystem,
		assetResolver: (relativePath: string) => string,
		config?: PaletteConfig,
	) {
		this._logger = logger;
		this._fileSystem = fileSystem;
		this._assetResolver = assetResolver;
		this._config = config;
	}

	// ── Public API ─────────────────────────────────────────────────────

	/**
	 * Get installation status for a collection of files.
	 *
	 * @param files      The files to check.
	 * @param targetDir  Workspace root, e.g. `/Users/foo/my-project`.
	 */
	async getInstallationStatus(
		files: InstallableFile[],
		targetDir: string,
	): Promise<InstallableFileWithStatus[]> {
		this._logger.info('Checking installation status for files...');

		const filesWithStatus: InstallableFileWithStatus[] = [];

		for (const file of files) {
			const targetPath = this._getTargetPath(file, targetDir);
			const status = await this._checkFileStatus(file, targetPath);

			filesWithStatus.push({
				...file,
				status,
				targetPath,
			});
		}

		this._logger.info(`Status check complete: ${filesWithStatus.length} files processed`);
		return filesWithStatus;
	}

	/**
	 * Install a single file.
	 *
	 * @param file                The file descriptor.
	 * @param targetDir           Workspace root, e.g. `/Users/foo/my-project`.
	 * @param conflictResolution  How to handle an existing file at the target path.
	 */
	async installFile(
		file: InstallableFile,
		targetDir: string,
		conflictResolution?: ConflictResolution,
	): Promise<InstallationResult> {
		this._logger.info(`Installing file: ${file.name}`);

		try {
			const targetPath = this._getTargetPath(file, targetDir);
			this._logger.info(`Target installation path: ${targetPath}`);

			// Check for conflicts
			const fileExists = await this._fileExists(targetPath);
			if (fileExists && !conflictResolution) {
				const error = 'File already exists and no conflict resolution provided';
				this._logger.warn(`Installation conflict: ${error}`);
				return {
					success: false,
					filePath: targetPath,
					fileName: file.name,
					error,
				};
			}

			// Handle conflict resolution — skip
			if (fileExists && conflictResolution === ConflictResolution.SKIP) {
				this._logger.info(`Skipping file due to conflict: ${file.name}`);
				return {
					success: true,
					filePath: targetPath,
					fileName: file.name,
					skipped: true,
				};
			}

			// Ensure target directory exists
			const parentDir = path.dirname(targetPath);
			this._logger.info(`Ensuring directory exists: ${parentDir}`);
			await this._fileSystem.mkdir(parentDir, { recursive: true });

			// Get file content
			const content = await this._getFileContent(file);

			// Write file
			await this._fileSystem.writeFile(targetPath, content);

			const overwritten = fileExists && conflictResolution === ConflictResolution.OVERWRITE;
			this._logger.info(`File installed successfully: ${file.name} -> ${targetPath}`);

			return {
				success: true,
				filePath: targetPath,
				fileName: file.name,
				overwritten,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this._logger.error(`Installation failed for ${file.name}: ${errorMessage}`, error);
			return {
				success: false,
				filePath: '',
				fileName: file.name,
				error: errorMessage,
			};
		}
	}

	/**
	 * Install multiple files with optional progress reporting.
	 *
	 * @param files                The file descriptors.
	 * @param targetDir            Workspace root.
	 * @param conflictResolution   How to handle existing files.
	 * @param onProgress           Optional callback fired after each file.
	 */
	async installFiles(
		files: InstallableFile[],
		targetDir: string,
		conflictResolution?: ConflictResolution,
		onProgress?: (current: number, total: number, fileName: string) => void,
	): Promise<InstallationResult[]> {
		this._logger.info(`Starting batch installation of ${files.length} files`);

		const results: InstallationResult[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (onProgress) {
				onProgress(i + 1, files.length, file.name);
			}

			const result = await this.installFile(file, targetDir, conflictResolution);
			results.push(result);
		}

		const successCount = results.filter(r => r.success).length;
		const failureCount = results.filter(r => !r.success).length;
		const skippedCount = results.filter(r => r.skipped).length;

		this._logger.info(
			`Batch installation complete: ${successCount} successful, ${failureCount} failed, ${skippedCount} skipped`,
		);

		return results;
	}

	// ── Path helpers ───────────────────────────────────────────────────

	/**
	 * Build the absolute target path for a file inside `targetDir`.
	 */
	private _getTargetPath(file: InstallableFile, targetDir: string): string {
		// Special case: copilot-instructions.md goes directly in .github
		if (file.name === 'copilot-instructions' || file.name === 'copilot-instructions.md') {
			return path.join(targetDir, '.github', 'copilot-instructions.md');
		}

		// Other files go in the appropriate subdirectory
		let subdirectory: string;
		switch (file.type) {
			case 'instruction':
				subdirectory = 'instructions';
				break;
			case 'prompt':
				subdirectory = 'prompts';
				break;
			case 'chatmode':
				subdirectory = 'chatmodes';
				break;
			default:
				subdirectory = 'instructions'; // fallback
		}

		const fileName = this._ensureFileExtension(file.name, file.type);
		return path.join(targetDir, '.github', subdirectory, fileName);
	}

	/**
	 * Ensure a file name carries the correct type-specific extension.
	 */
	private _ensureFileExtension(fileName: string, type: string): string {
		const extensions: Record<string, string> = {
			'instruction': '.instructions.md',
			'prompt': '.prompt.md',
			'chatmode': '.chatmode.md',
		};

		const expectedExtension = extensions[type] || '.md';

		// Already has the full expected extension — return as-is
		if (fileName.endsWith(expectedExtension)) {
			return fileName;
		}

		// Check if the file has any of the known extensions
		const allExtensions = Object.values(extensions);
		const hasKnownExtension = allExtensions.some(ext => fileName.endsWith(ext));

		if (hasKnownExtension) {
			this._logger.warn(`File ${fileName} has extension that doesn't match type ${type}`);
			return fileName;
		}

		// Has a generic .md — replace with the type-specific extension
		if (fileName.endsWith('.md')) {
			return fileName.replace(/\.md$/, expectedExtension);
		}

		// No extension at all — append
		return fileName + expectedExtension;
	}

	// ── Status check ───────────────────────────────────────────────────

	/**
	 * Determine the installation status of a single file.
	 */
	private async _checkFileStatus(
		file: InstallableFile,
		targetPath: string,
	): Promise<InstallationStatus> {
		try {
			const exists = await this._fileExists(targetPath);
			if (!exists) {
				return 'available';
			}

			// File exists — compare content to see if it is up-to-date
			const sourceContent = await this._getFileContent(file);
			const targetContent = await this._fileSystem.readFile(targetPath);

			return sourceContent === targetContent ? 'installed' : 'conflict';
		} catch (error) {
			this._logger.warn(`Error checking status for ${file.name}: ${error}`);
			return 'available'; // default to available on error
		}
	}

	// ── Content retrieval ──────────────────────────────────────────────

	/**
	 * Get file content based on source type (Bundled or Online).
	 */
	private async _getFileContent(file: InstallableFile): Promise<string> {
		if (file.source === 'Bundled') {
			const absolutePath = this._assetResolver(file.path);
			this._logger.info(`Reading bundled file from: ${absolutePath}`);
			return this._fileSystem.readFile(absolutePath);
		}

		// Online file
		if (file.path.startsWith('catalog/')) {
			return this._fetchCatalogFileContent(file);
		}

		return this._fetchOnlineFileContent(file);
	}

	/**
	 * Fetch the content of a catalog file from the configured remote repository.
	 */
	private async _fetchCatalogFileContent(file: InstallableFile): Promise<string> {
		this._logger.info(`Fetching catalog file content: ${file.name}`);

		try {
			// catalog path format: catalog/<type>/<filename>
			const pathParts = file.path.split('/');
			if (pathParts.length < 3) {
				throw new Error(`Invalid catalog path format: ${file.path}`);
			}

			const fileType = pathParts[1]; // instructions | prompts | chatmodes
			const fileName = pathParts[2];

			// Resolve remote repository config from PaletteConfig
			const repoConfig = this._config?.remoteRepositories[0];
			if (!repoConfig || !repoConfig.enabled) {
				throw new Error('Remote repository fetching is disabled or not configured');
			}

			// Map file type to the actual repository path
			let repoPath: string;
			switch (fileType) {
				case 'instructions':
					repoPath = `instructions/${fileName}.instructions.md`;
					break;
				case 'prompts':
					repoPath = `prompts/${fileName}.prompt.md`;
					break;
				case 'chatmodes':
					repoPath = `chatmodes/${fileName}.chatmode.md`;
					break;
				default:
					throw new Error(`Unknown file type: ${fileType}`);
			}

			const apiUrl =
				`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoPath}?ref=${repoConfig.branch}`;

			this._logger.info(`Fetching from GitHub API: ${apiUrl}`);

			const headers: Record<string, string> = {
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'awesome-palette',
			};

			const githubToken = this._config?.githubToken;
			if (githubToken) {
				headers['Authorization'] = `token ${githubToken}`;
			}

			const response = await fetch(apiUrl, { headers });

			if (!response.ok) {
				throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
			}

			const data = (await response.json()) as { content?: string; encoding?: string };

			if (data.content && data.encoding === 'base64') {
				const content = Buffer.from(data.content, 'base64').toString('utf8');
				this._logger.info(
					`Successfully fetched catalog file: ${file.name} (${content.length} chars)`,
				);
				return content;
			}

			throw new Error('Unexpected GitHub API response format');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this._logger.error(`Failed to fetch catalog file ${file.name}: ${errorMessage}`, error);
			throw error;
		}
	}

	/**
	 * Fetch online file content directly from GitHub (owner/repo/path format).
	 */
	private async _fetchOnlineFileContent(file: InstallableFile): Promise<string> {
		this._logger.info(`Fetching online file content: ${file.name}`);

		try {
			// Path format: owner/repo/path/to/file
			const pathParts = file.path.split('/');
			if (pathParts.length < 3) {
				throw new Error(`Invalid GitHub path format: ${file.path}`);
			}

			const owner = pathParts[0];
			const repo = pathParts[1];
			const filePath = pathParts.slice(2).join('/');

			const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

			const headers: Record<string, string> = {
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'awesome-palette',
			};

			const githubToken = this._config?.githubToken;
			if (githubToken) {
				headers['Authorization'] = `token ${githubToken}`;
			}

			const response = await fetch(apiUrl, { headers });

			if (!response.ok) {
				throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
			}

			const data = (await response.json()) as { content?: string; encoding?: string };

			if (data.content && data.encoding === 'base64') {
				return Buffer.from(data.content, 'base64').toString('utf8');
			}

			throw new Error('Unexpected GitHub API response format');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this._logger.error(`Failed to fetch online file ${file.name}: ${errorMessage}`, error);
			throw error;
		}
	}

	// ── File-system helpers ────────────────────────────────────────────

	/**
	 * Check whether a file exists at `filePath`.
	 */
	private async _fileExists(filePath: string): Promise<boolean> {
		try {
			return await this._fileSystem.exists(filePath);
		} catch {
			return false;
		}
	}
}
