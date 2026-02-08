/**
 * RepositoryManager — Platform-agnostic manager for fetching and indexing
 * GitHub Copilot customizations from remote repositories.
 *
 * Ported from Project-Olorin's OnlineRepositoryManager with all vscode dependencies removed.
 */

import type { Logger } from '../interfaces/Logger.js';
import type { PaletteConfig } from '../interfaces/Config.js';
import type {
	OnlineRepository,
	RemoteFile,
	CachedFile,
	RepositoryIndex,
	GitHubApiResponse,
	RepositoryManagerConfig
} from '../types/repository.js';
import type { EnhancedCatalog } from '../types/catalog.js';

export class RepositoryManager {
	private _logger: Logger;
	private _paletteConfig: PaletteConfig;
	private repositories: Map<string, OnlineRepository> = new Map();
	private indexes: Map<string, RepositoryIndex> = new Map();
	private fileCache: Map<string, CachedFile> = new Map();
	private config: RepositoryManagerConfig;

	constructor(logger: Logger, paletteConfig: PaletteConfig) {
		this._logger = logger;
		this._paletteConfig = paletteConfig;
		this.config = {
			enableOnlineFetching: paletteConfig.enableOnlineFetching,
			defaultCacheTtl: paletteConfig.cache.onlineTtlMs || 60 * 60 * 1000,
			indexRefreshInterval: 6 * 60 * 60 * 1000,
			maxFileSize: 1024 * 1024,
			requestTimeout: 10000,
			userAgent: 'awesome-palette/1.0',
			githubToken: paletteConfig.githubToken
		};

		this.initializeDefaultRepositories();
		this._logger.info('RepositoryManager initialized');
	}

	private initializeDefaultRepositories(): void {
		for (const repoConfig of this._paletteConfig.remoteRepositories) {
			if (!repoConfig.enabled) {
				this._logger.debug(`Repository ${repoConfig.owner}/${repoConfig.repo} is disabled, skipping`);
				continue;
			}

			const repository: OnlineRepository = {
				name: `${repoConfig.owner}/${repoConfig.repo}`,
				url: `https://github.com/${repoConfig.owner}/${repoConfig.repo}`,
				owner: repoConfig.owner,
				repo: repoConfig.repo,
				branch: repoConfig.branch || 'main',
				instructionsPath: 'instructions',
				promptsPath: 'prompts',
				agentsPath: 'agents',
				skillsPath: 'skills',
				cookbooksPath: 'cookbook',
				enabled: true
			};

			const repoKey = `${repository.owner}/${repository.repo}`;
			this.repositories.set(repoKey, repository);
			this._logger.info(`Added repository: ${repository.name}`);
		}
	}

	public refreshRepositoryConfiguration(newConfig?: PaletteConfig): void {
		this._logger.info('Refreshing repository configuration...');
		if (newConfig) {
			this._paletteConfig = newConfig;
			this.config = {
				...this.config,
				enableOnlineFetching: newConfig.enableOnlineFetching,
				githubToken: newConfig.githubToken
			};
		}
		this.repositories.clear();
		this.indexes.clear();
		this.initializeDefaultRepositories();
		this._logger.info('Repository configuration refreshed');
	}

	public addRepository(repository: OnlineRepository): void {
		const key = `${repository.owner}/${repository.repo}`;
		this.repositories.set(key, repository);
		this._logger.info(`Added repository: ${repository.name} (${key})`);
		this.indexes.delete(key);
	}

	public removeRepository(owner: string, repo: string): void {
		const key = `${owner}/${repo}`;
		this.repositories.delete(key);
		this.indexes.delete(key);
		this._logger.info(`Removed repository: ${key}`);
	}

	public getRepositories(): OnlineRepository[] {
		return Array.from(this.repositories.values());
	}

	public async indexAllRepositories(): Promise<Map<string, RepositoryIndex>> {
		this._logger.info('Starting indexing of all repositories...');

		if (!this.config.enableOnlineFetching) {
			this._logger.warn('Online fetching is disabled');
			return this.indexes;
		}

		const enabledRepos = Array.from(this.repositories.values()).filter(repo => repo.enabled);
		this._logger.info(`Found ${enabledRepos.length} enabled repositories`);

		for (const repo of enabledRepos) {
			try {
				await this.indexRepository(repo);
			} catch (error) {
				this._logger.error(`Failed to index ${repo.name}`, error);
			}
		}

		this._logger.info(`Indexing complete. ${this.indexes.size} repositories indexed.`);
		return this.indexes;
	}

	public async indexRepository(repository: OnlineRepository): Promise<RepositoryIndex> {
		const repoKey = `${repository.owner}/${repository.repo}`;
		this._logger.info(`Indexing repository: ${repository.name}`);

		const existingIndex = this.indexes.get(repoKey);
		if (existingIndex && this.isIndexValid(existingIndex)) {
			this._logger.debug(`Using cached index for ${repository.name}`);
			return existingIndex;
		}

		try {
			const startTime = Date.now();
			const files: RemoteFile[] = [];

			const directories = [
				{ path: repository.instructionsPath || 'instructions', type: 'instruction' as const },
				{ path: repository.promptsPath || 'prompts', type: 'prompt' as const },
				{ path: repository.agentsPath || 'agents', type: 'agent' as const },
				{ path: repository.skillsPath || 'skills', type: 'skill' as const },
				{ path: repository.cookbooksPath || 'cookbooks', type: 'cookbook' as const }
			];

			for (const dir of directories) {
				const dirFiles = await this.indexDirectory(repository, dir.path, dir.type);
				files.push(...dirFiles);
				this._logger.debug(`Found ${dirFiles.length} ${dir.type} files in ${dir.path}/`);
			}

			const index: RepositoryIndex = {
				repository,
				files,
				indexedAt: new Date(),
				ttl: this.config.indexRefreshInterval,
				isValid: true,
				stats: {
					totalFiles: files.length,
					instructionFiles: files.filter(f => f.type === 'instruction').length,
					promptFiles: files.filter(f => f.type === 'prompt').length,
					agentFiles: files.filter(f => f.type === 'agent').length,
					skillFiles: files.filter(f => f.type === 'skill').length,
					cookbookFiles: files.filter(f => f.type === 'cookbook').length
				}
			};

			this.indexes.set(repoKey, index);
			const indexTime = Date.now() - startTime;
			this._logger.info(`Repository indexed in ${indexTime}ms: ${JSON.stringify(index.stats)}`);
			return index;

		} catch (error) {
			this._logger.error(`Failed to index repository ${repository.name}`, error);

			const failedIndex: RepositoryIndex = {
				repository, files: [], indexedAt: new Date(),
				ttl: this.config.indexRefreshInterval, isValid: false,
				stats: { totalFiles: 0, instructionFiles: 0, promptFiles: 0, agentFiles: 0, skillFiles: 0, cookbookFiles: 0 }
			};
			this.indexes.set(repoKey, failedIndex);
			return failedIndex;
		}
	}

	private async indexDirectory(
		repository: OnlineRepository,
		directoryPath: string,
		fileType: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook'
	): Promise<RemoteFile[]> {
		this._logger.debug(`Indexing directory: ${directoryPath}/ in ${repository.name}`);

		try {
			const apiUrl = `https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${directoryPath}`;
			const response = await this.makeGitHubApiRequest(apiUrl, repository);

			if (!response.success || !Array.isArray(response.data)) {
				this._logger.debug(`Directory ${directoryPath}/ not found or empty`);
				return [];
			}

			const files: RemoteFile[] = [];

			// Skills are folder-based, other types are file-based
			if (fileType === 'skill') {
				// For skills, look for directories and fetch their contents
				for (const item of response.data) {
					if (item.type !== 'dir') continue;

					const skillFiles = await this.indexSkillFolder(repository, item.path, item.name);
					if (skillFiles) {
						files.push(skillFiles);
					}
				}
			} else {
				// For other types, just look for files
				for (const item of response.data) {
					if (item.type !== 'file') continue;
					if (!this.isValidFileForType(item.name, fileType)) continue;

					files.push({
						name: item.name,
						path: item.path,
						type: fileType,
						sha: item.sha,
						size: item.size,
						downloadUrl: item.download_url,
						repository,
						lastIndexed: new Date()
					});
				}
			}

			this._logger.debug(`Directory ${directoryPath}/ indexed: ${files.length} valid ${fileType} items`);
			return files;

		} catch (error) {
			this._logger.error(`Failed to index directory ${directoryPath}/`, error);
			return [];
		}
	}

	/**
	 * Index a skill folder by recursively fetching its contents
	 */
	private async indexSkillFolder(
		repository: OnlineRepository,
		folderPath: string,
		skillName: string
	): Promise<RemoteFile | null> {
		this._logger.debug(`Indexing skill folder: ${folderPath}`);

		try {
			// Fetch folder contents
			const folderFiles = await this.fetchFolderContentsRecursive(repository, folderPath);

			// Check if folder contains SKILL.md (marker file)
			const hasSkillMarker = folderFiles.some(f => f.name.toUpperCase() === 'SKILL.MD');

			if (!hasSkillMarker) {
				this._logger.debug(`Skipping ${folderPath} - no SKILL.md found`);
				return null;
			}

			// Build RemoteFile with folder metadata
			const skillFile: RemoteFile = {
				name: skillName,
				path: folderPath,
				type: 'skill',
				sha: '', // Folders don't have SHA
				size: folderFiles.reduce((sum, f) => sum + f.size, 0),
				downloadUrl: '', // Folders don't have download URL
				repository,
				lastIndexed: new Date(),
				// Folder-specific metadata
				isFolder: true,
				files: folderFiles.map(f => ({
					relativePath: f.path.replace(`${folderPath}/`, ''),
					fullPath: f.path,
					sha: f.sha,
					size: f.size,
					downloadUrl: f.downloadUrl
				}))
			};

			this._logger.debug(`Indexed skill: ${skillName} with ${folderFiles.length} files`);
			return skillFile;

		} catch (error) {
			this._logger.error(`Failed to index skill folder ${folderPath}`, error);
			return null;
		}
	}

	/**
	 * Recursively fetch all files in a folder
	 */
	private async fetchFolderContentsRecursive(
		repository: OnlineRepository,
		folderPath: string
	): Promise<Array<{ name: string; path: string; sha: string; size: number; downloadUrl: string }>> {
		const apiUrl = `https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${folderPath}`;
		const response = await this.makeGitHubApiRequest(apiUrl, repository);

		if (!response.success || !Array.isArray(response.data)) {
			return [];
		}

		const files: Array<{ name: string; path: string; sha: string; size: number; downloadUrl: string }> = [];

		for (const item of response.data) {
			if (item.type === 'file') {
				files.push({
					name: item.name,
					path: item.path,
					sha: item.sha,
					size: item.size,
					downloadUrl: item.download_url
				});
			} else if (item.type === 'dir') {
				// Recursively fetch subdirectory contents
				const subFiles = await this.fetchFolderContentsRecursive(repository, item.path);
				files.push(...subFiles);
			}
		}

		return files;
	}

	private isValidFileForType(fileName: string, fileType: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook'): boolean {
		const lowerName = fileName.toLowerCase();
		switch (fileType) {
			case 'instruction':
				return lowerName.endsWith('.instructions.md') || lowerName.endsWith('.instruction.md');
			case 'prompt':
				return lowerName.endsWith('.prompt.md');
			case 'agent':
				return lowerName.endsWith('.agent.md');
			case 'skill':
				return lowerName === 'skill.md' || lowerName.endsWith('.skill.md');
			case 'cookbook':
				return lowerName.endsWith('.cookbook.md');
			default:
				return false;
		}
	}

	private async makeGitHubApiRequest(url: string, repository: OnlineRepository): Promise<GitHubApiResponse> {
		const startTime = Date.now();
		this._logger.debug(`GitHub API request: ${url}`);

		try {
			const headers: Record<string, string> = {
				'User-Agent': this.config.userAgent,
				'Accept': 'application/vnd.github.v3+json'
			};

			if (this.config.githubToken) {
				headers['Authorization'] = `token ${this.config.githubToken}`;
			}

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

			const response = await fetch(url, { headers, signal: controller.signal });
			clearTimeout(timeoutId);

			const responseTime = Date.now() - startTime;

			const rateLimit = {
				limit: parseInt(response.headers.get('x-ratelimit-limit') || '60'),
				remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '60'),
				resetTime: new Date(parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000)
			};

			this._logger.debug(`Response ${response.status} in ${responseTime}ms (rate limit: ${rateLimit.remaining}/${rateLimit.limit})`);

			repository.rateLimit = {
				limit: rateLimit.limit,
				remaining: rateLimit.remaining,
				resetTime: rateLimit.resetTime
			};

			if (!response.ok) {
				const errorText = await response.text();
				this._logger.error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
				return {
					success: false,
					error: `GitHub API error: ${response.status} ${response.statusText}`,
					rateLimit,
					metadata: { requestUrl: url, responseTime, statusCode: response.status }
				};
			}

			const data = await response.json();
			return {
				success: true, data, rateLimit,
				metadata: { requestUrl: url, responseTime, statusCode: response.status }
			};

		} catch (error) {
			const responseTime = Date.now() - startTime;
			this._logger.error(`GitHub API request failed after ${responseTime}ms`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				metadata: { requestUrl: url, responseTime, statusCode: 0 }
			};
		}
	}

	public async downloadFileContent(file: RemoteFile): Promise<string | null> {
		this._logger.debug(`Downloading file content: ${file.name}`);

		const cacheKey = `${file.repository.owner}/${file.repository.repo}/${file.path}`;
		const cached = this.fileCache.get(cacheKey);

		if (cached && cached.hasContent && this.isCacheValid(cached)) {
			this._logger.debug(`Using cached content for ${file.name}`);
			return cached.content || null;
		}

		if (file.size > this.config.maxFileSize) {
			this._logger.warn(`File ${file.name} is too large (${file.size} bytes)`);
			return null;
		}

		try {
			const response = await this.makeGitHubApiRequest(file.downloadUrl, file.repository);
			if (!response.success) {
				this._logger.error(`Failed to download ${file.name}: ${response.error}`);
				return null;
			}

			const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

			this.fileCache.set(cacheKey, {
				file, content, cachedAt: new Date(),
				ttl: this.config.defaultCacheTtl, hasContent: true
			});

			this._logger.debug(`Downloaded and cached ${file.name} (${content.length} characters)`);
			return content;

		} catch (error) {
			this._logger.error(`Failed to download ${file.name}`, error);
			return null;
		}
	}

	public async getEnhancedCatalog(localCatalog: {
		instructions: string[];
		prompts: string[];
		agents: string[];
		skills: string[];
		cookbooks: string[];
	}): Promise<EnhancedCatalog> {
		this._logger.info('Building enhanced catalog...');

		await this.indexAllRepositories();

		const remoteInstructions: RemoteFile[] = [];
		const remotePrompts: RemoteFile[] = [];
		const remoteAgents: RemoteFile[] = [];
		const remoteSkills: RemoteFile[] = [];
		const remoteCookbooks: RemoteFile[] = [];

		for (const index of this.indexes.values()) {
			if (!index.isValid) continue;
			for (const file of index.files) {
				switch (file.type) {
					case 'instruction': remoteInstructions.push(file); break;
					case 'prompt': remotePrompts.push(file); break;
					case 'agent': remoteAgents.push(file); break;
					case 'skill': remoteSkills.push(file); break;
					case 'cookbook': remoteCookbooks.push(file); break;
				}
			}
		}

		const catalog: EnhancedCatalog = {
			local: localCatalog,
			remote: {
				instructions: remoteInstructions,
				prompts: remotePrompts,
				agents: remoteAgents,
				skills: remoteSkills,
				cookbooks: remoteCookbooks
			},
			combined: {
				instructions: [
					...localCatalog.instructions,
					...remoteInstructions.map(f => `${f.name} - ${f.repository.name} (remote)`)
				],
				prompts: [
					...localCatalog.prompts,
					...remotePrompts.map(f => `${f.name} - ${f.repository.name} (remote)`)
				],
				agents: [
					...localCatalog.agents,
					...remoteAgents.map(f => `${f.name} - ${f.repository.name} (remote)`)
				],
				skills: [
					...localCatalog.skills,
					...remoteSkills.map(f => `${f.name} - ${f.repository.name} (remote)`)
				],
				cookbooks: [
					...localCatalog.cookbooks,
					...remoteCookbooks.map(f => `${f.name} - ${f.repository.name} (remote)`)
				]
			},
			metadata: {
				localCount: localCatalog.instructions.length + localCatalog.prompts.length + localCatalog.agents.length + localCatalog.skills.length + localCatalog.cookbooks.length,
				remoteCount: remoteInstructions.length + remotePrompts.length + remoteAgents.length + remoteSkills.length + remoteCookbooks.length,
				totalCount: 0,
				lastUpdated: new Date(),
				repositories: Array.from(this.repositories.keys())
			}
		};

		catalog.metadata.totalCount = catalog.metadata.localCount + catalog.metadata.remoteCount;

		this._logger.info(`Enhanced catalog: local=${catalog.metadata.localCount}, remote=${catalog.metadata.remoteCount}, total=${catalog.metadata.totalCount}`);
		return catalog;
	}

	public getRemoteFilesByType(type: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook'): RemoteFile[] {
		const files: RemoteFile[] = [];
		for (const index of this.indexes.values()) {
			if (!index.isValid) continue;
			files.push(...index.files.filter(f => f.type === type));
		}
		return files;
	}

	public searchFiles(query: string, type?: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook'): RemoteFile[] {
		const results: RemoteFile[] = [];
		const queryLower = query.toLowerCase();

		for (const index of this.indexes.values()) {
			if (!index.isValid) continue;
			for (const file of index.files) {
				if (type && file.type !== type) continue;
				if (file.name.toLowerCase().includes(queryLower) || file.path.toLowerCase().includes(queryLower)) {
					results.push(file);
				}
			}
		}

		this._logger.debug(`Search "${query}" (type: ${type || 'all'}): ${results.length} results`);
		return results;
	}

	private isIndexValid(index: RepositoryIndex): boolean {
		const now = new Date();
		const isTimestampValid = index.isValid && (now.getTime() - index.indexedAt.getTime()) < index.ttl;

		// Invalidate old indexes that don't have the new fields (pre-0.4.0)
		const hasNewFields = index.stats.hasOwnProperty('skillFiles') && index.stats.hasOwnProperty('cookbookFiles');

		return isTimestampValid && hasNewFields;
	}

	private isCacheValid(cached: CachedFile): boolean {
		const now = new Date();
		return (now.getTime() - cached.cachedAt.getTime()) < cached.ttl;
	}

	public getStatistics(): {
		repositories: number; totalFiles: number;
		instructionFiles: number; promptFiles: number; agentFiles: number;
		skillFiles: number; cookbookFiles: number;
		cacheSize: number; lastIndexed: Date | null;
	} {
		let totalFiles = 0, instructionFiles = 0, promptFiles = 0, agentFiles = 0, skillFiles = 0, cookbookFiles = 0;
		let lastIndexed: Date | null = null;

		for (const index of this.indexes.values()) {
			if (!index.isValid) continue;
			totalFiles += index.stats.totalFiles;
			instructionFiles += index.stats.instructionFiles;
			promptFiles += index.stats.promptFiles;
			agentFiles += index.stats.agentFiles;
			skillFiles += index.stats.skillFiles;
			cookbookFiles += index.stats.cookbookFiles;
			if (!lastIndexed || index.indexedAt > lastIndexed) lastIndexed = index.indexedAt;
		}

		return { repositories: this.repositories.size, totalFiles, instructionFiles, promptFiles, agentFiles, skillFiles, cookbookFiles, cacheSize: this.fileCache.size, lastIndexed };
	}

	public clearCache(): void {
		this.indexes.clear();
		this.fileCache.clear();
		this._logger.info('All caches cleared');
	}

	public updateConfiguration(newConfig: Partial<RepositoryManagerConfig>): void {
		this.config = { ...this.config, ...newConfig };
		this._logger.debug(`Configuration updated`);
	}
}
