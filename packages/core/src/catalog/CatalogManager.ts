/**
 * CatalogManager — platform-agnostic structured metadata service for
 * instruction, prompt, and chatmode files.
 *
 * Ported from Project-Olorin's CustomInstructionsCatalog, replacing all
 * VS Code-specific APIs with injected abstractions (Logger, PaletteConfig,
 * RepositoryManager).
 */

import type { Logger } from '../interfaces/Logger.js';
import type { PaletteConfig } from '../interfaces/Config.js';
import type {
	CatalogEntry,
	EnhancedCatalog,
	CatalogCacheConfig,
	CatalogCacheState,
	CatalogCacheEntry,
	CacheMetrics
} from '../types/catalog.js';
import type { RepositoryManager } from '../repository/RepositoryManager.js';
import { defaultCatalogEntries } from './entries.js';

export class CatalogManager {
	private readonly _logger: Logger;
	private readonly _config: PaletteConfig;
	private readonly _repositoryManager: RepositoryManager;
	private localCatalog: CatalogEntry[] = [];

	// Cache infrastructure
	private cacheConfig!: CatalogCacheConfig;
	private cacheState!: CatalogCacheState;
	private cacheMetrics!: CacheMetrics;

	constructor(
		logger: Logger,
		config: PaletteConfig,
		repositoryManager: RepositoryManager
	) {
		this._logger = logger;
		this._config = config;
		this._repositoryManager = repositoryManager;

		// Initialize cache system
		this.initializeCacheSystem();

		// Initialize local catalog
		this.initializeLocalCatalog();
	}

	// -----------------------------------------------------------------------
	// Local catalog bootstrap
	// -----------------------------------------------------------------------

	/**
	 * Initialize local catalog with the default built-in entries.
	 */
	private initializeLocalCatalog(): void {
		this._logger.info('Initializing local instructions catalog...');

		this.localCatalog = [...defaultCatalogEntries];

		const instructions = this.localCatalog.filter(e => e.type === 'instruction').length;
		const chatmodes = this.localCatalog.filter(e => e.type === 'chatmode').length;
		const prompts = this.localCatalog.filter(e => e.type === 'prompt').length;

		this._logger.info(`Local catalog initialized: ${this.localCatalog.length} entries`);
		this._logger.debug(`  Instructions: ${instructions}`);
		this._logger.debug(`  Chat Modes: ${chatmodes}`);
		this._logger.debug(`  Prompts: ${prompts}`);
	}

	// -----------------------------------------------------------------------
	// Enhanced catalog (local + remote)
	// -----------------------------------------------------------------------

	/**
	 * Get enhanced catalog including both local and remote sources.
	 * Uses smart layered caching for optimal performance.
	 */
	async getEnhancedCatalog(): Promise<EnhancedCatalog> {
		// Check enhanced catalog cache first
		if (this.isCacheValid(this.cacheState.enhancedCatalog)) {
			this.recordCacheHit('enhanced catalog');
			return this.cacheState.enhancedCatalog.data!;
		}

		this.recordCacheMiss('enhanced catalog');
		this._logger.info('Building enhanced instructions catalog...');

		// Get local catalog (with version-based caching)
		const localCatalog = await this.getLocalCatalogData();

		// Get online catalog (with time-based caching)
		const onlineCatalog = await this.getOnlineCatalogData();

		try {
			// Combine local and online catalogs
			const enhancedCatalog = await this.combineLocalAndOnlineCatalogs(localCatalog, onlineCatalog);

			// Cache the result
			this.updateCache(this.cacheState.enhancedCatalog, enhancedCatalog);
			this.cacheState.enhancedCatalog.ttl = this.cacheConfig.enhancedCatalogTtl;

			this._logger.info('Enhanced catalog statistics:');
			this._logger.info(`  Local files: ${enhancedCatalog.metadata.localCount}`);
			this._logger.info(`  Remote files: ${enhancedCatalog.metadata.remoteCount}`);
			this._logger.info(`  Total files: ${enhancedCatalog.metadata.totalCount}`);
			this._logger.info(`  Repositories: ${enhancedCatalog.metadata.repositories.join(', ')}`);

			return enhancedCatalog;

		} catch (error) {
			this._logger.warn(`Failed to build enhanced catalog, falling back to local only: ${error}`);

			// Fallback to local catalog only
			const fallbackCatalog: EnhancedCatalog = {
				local: localCatalog,
				combined: {
					instructions: localCatalog.instructions,
					chatmodes: localCatalog.chatmodes,
					prompts: localCatalog.prompts
				},
				remote: {
					instructions: [],
					prompts: [],
					chatmodes: []
				},
				metadata: {
					localCount: this.localCatalog.length,
					remoteCount: 0,
					totalCount: this.localCatalog.length,
					repositories: [],
					lastUpdated: new Date()
				}
			};

			// Cache the fallback result (shorter TTL for retry)
			this.updateCache(this.cacheState.enhancedCatalog, fallbackCatalog);
			this.cacheState.enhancedCatalog.ttl = Math.min(
				this.cacheConfig.enhancedCatalogTtl,
				5 * 60 * 1000 // 5 minutes on error
			);

			return fallbackCatalog;
		}
	}

	// -----------------------------------------------------------------------
	// Local catalog data (version-based caching)
	// -----------------------------------------------------------------------

	/**
	 * Get local catalog data formatted for the legacy combined view.
	 */
	private async getLocalCatalogData(): Promise<{
		instructions: string[];
		prompts: string[];
		chatmodes: string[];
	}> {
		// Check local catalog cache (version-based invalidation)
		if (this.isCacheValid(this.cacheState.localCatalog, true)) {
			this.recordCacheHit('local catalog');
			return this.cacheState.localCatalog.data!;
		}

		this.recordCacheMiss('local catalog');
		this._logger.debug('Building local catalog data...');

		// Convert local catalog to legacy format for compatibility
		const localInstructions = this.localCatalog
			.filter(entry => entry.type === 'instruction')
			.map(entry => `${entry.filePath} - ${entry.description}`);

		const localChatmodes = this.localCatalog
			.filter(entry => entry.type === 'chatmode')
			.map(entry => `${entry.filePath} - ${entry.description}`);

		const localPrompts = this.localCatalog
			.filter(entry => entry.type === 'prompt')
			.map(entry => `${entry.filePath} - ${entry.description}`);

		const localData = {
			instructions: localInstructions,
			prompts: localPrompts,
			chatmodes: localChatmodes
		};

		// Cache the local data (never expires except on version change)
		this.updateCache(this.cacheState.localCatalog, localData);
		this.cacheState.localCatalog.ttl = this.cacheConfig.localCatalogTtl;

		this._logger.debug(
			`Local catalog cached: ${localInstructions.length + localPrompts.length + localChatmodes.length} items`
		);
		return localData;
	}

	// -----------------------------------------------------------------------
	// Online catalog data (time-based caching)
	// -----------------------------------------------------------------------

	/**
	 * Get online catalog data fetched from remote repositories.
	 */
	private async getOnlineCatalogData(): Promise<{
		instructions: string[];
		prompts: string[];
		chatmodes: string[];
	}> {
		// Check online catalog cache (time-based invalidation)
		if (this.isCacheValid(this.cacheState.onlineCatalog)) {
			this.recordCacheHit('online catalog');
			return this.cacheState.onlineCatalog.data!;
		}

		this.recordCacheMiss('online catalog');
		this._logger.debug('Fetching online catalog data...');

		try {
			// Delegate to RepositoryManager which handles its own caching
			const localData = await this.getLocalCatalogData();
			const tempEnhanced = await this._repositoryManager.getEnhancedCatalog(localData);

			// Extract only the remote-sourced portions
			const onlineData = {
				instructions: tempEnhanced.combined.instructions.filter((i: string) => i.includes('(remote)')),
				prompts: tempEnhanced.combined.prompts.filter((p: string) => p.includes('(remote)')),
				chatmodes: tempEnhanced.combined.chatmodes.filter((c: string) => c.includes('(remote)'))
			};

			// Cache the online data
			this.updateCache(this.cacheState.onlineCatalog, onlineData);
			this.cacheState.onlineCatalog.ttl = this.cacheConfig.onlineCatalogTtl;

			this._logger.debug(
				`Online catalog cached: ${onlineData.instructions.length + onlineData.prompts.length + onlineData.chatmodes.length} items`
			);
			return onlineData;

		} catch (error) {
			this._logger.warn(`Failed to fetch online catalog: ${error}`);

			// Return empty online catalog on error
			const emptyOnlineData = {
				instructions: [] as string[],
				prompts: [] as string[],
				chatmodes: [] as string[]
			};

			// Cache empty result with shorter TTL for retry
			this.updateCache(this.cacheState.onlineCatalog, emptyOnlineData);
			this.cacheState.onlineCatalog.ttl = 10 * 60 * 1000; // 10 minutes on error

			return emptyOnlineData;
		}
	}

	// -----------------------------------------------------------------------
	// Combine local + online
	// -----------------------------------------------------------------------

	/**
	 * Combine local and online catalogs via the RepositoryManager.
	 */
	private async combineLocalAndOnlineCatalogs(
		localData: { instructions: string[]; prompts: string[]; chatmodes: string[] },
		_onlineData: { instructions: string[]; prompts: string[]; chatmodes: string[] }
	): Promise<EnhancedCatalog> {
		// Delegate to RepositoryManager which owns the merging logic
		return await this._repositoryManager.getEnhancedCatalog(localData);
	}

	// -----------------------------------------------------------------------
	// Query helpers
	// -----------------------------------------------------------------------

	/** Find catalog entries whose metadata lists the given language. */
	findByLanguage(language: string): CatalogEntry[] {
		return this.localCatalog.filter(entry =>
			entry.metadata.languages?.includes(language.toLowerCase())
		);
	}

	/** Find catalog entries whose metadata lists the given framework. */
	findByFramework(framework: string): CatalogEntry[] {
		return this.localCatalog.filter(entry =>
			entry.metadata.frameworks?.includes(framework.toLowerCase())
		);
	}

	/** Find catalog entries matching a project type. */
	findByProjectType(projectType: string): CatalogEntry[] {
		return this.localCatalog.filter(entry =>
			entry.metadata.projectTypes?.includes(projectType.toLowerCase())
		);
	}

	/** Find catalog entries matching any of the provided characteristics. */
	findByCharacteristics(characteristics: string[]): CatalogEntry[] {
		return this.localCatalog.filter(entry =>
			characteristics.some(char =>
				entry.metadata.characteristics?.includes(char.toLowerCase())
			)
		);
	}

	/** Find a single catalog entry by its unique ID. */
	findById(id: string): CatalogEntry | undefined {
		return this.localCatalog.find(entry => entry.id === id);
	}

	/** Return a shallow copy of all local catalog entries. */
	getAll(): CatalogEntry[] {
		return [...this.localCatalog];
	}

	// -----------------------------------------------------------------------
	// Formatting
	// -----------------------------------------------------------------------

	/**
	 * Format the full enhanced catalog for inclusion in LM prompts.
	 */
	async describeAllForLM(): Promise<string> {
		const enhancedCatalog = await this.getEnhancedCatalog();

		return `
**Instructions (${enhancedCatalog.combined.instructions.length} available):**
${enhancedCatalog.combined.instructions.map(i => `- ${i}`).join('\n')}

**Chat Modes (${enhancedCatalog.combined.chatmodes.length} available):**
${enhancedCatalog.combined.chatmodes.map(c => `- ${c}`).join('\n')}

**Prompts (${enhancedCatalog.combined.prompts.length} available):**
${enhancedCatalog.combined.prompts.map(p => `- ${p}`).join('\n')}

**Source Information:**
- Local files: ${enhancedCatalog.metadata.localCount}
- Remote files: ${enhancedCatalog.metadata.remoteCount} (from ${enhancedCatalog.metadata.repositories.length} repositories)
- Last updated: ${enhancedCatalog.metadata.lastUpdated.toISOString()}
`;
	}

	// -----------------------------------------------------------------------
	// Statistics
	// -----------------------------------------------------------------------

	/** Aggregate statistics about the local catalog. */
	getStatistics() {
		const instructions = this.localCatalog.filter(e => e.type === 'instruction').length;
		const chatmodes = this.localCatalog.filter(e => e.type === 'chatmode').length;
		const prompts = this.localCatalog.filter(e => e.type === 'prompt').length;

		return {
			totalEntries: this.localCatalog.length,
			instructions,
			chatmodes,
			prompts,
			categories: [...new Set(this.localCatalog.map(e => e.category))],
			languages: [...new Set(this.localCatalog.flatMap(e => e.metadata.languages || []))],
			frameworks: [...new Set(this.localCatalog.flatMap(e => e.metadata.frameworks || []))],
			projectTypes: [...new Set(this.localCatalog.flatMap(e => e.metadata.projectTypes || []))]
		};
	}

	// -----------------------------------------------------------------------
	// Cache system
	// -----------------------------------------------------------------------

	/**
	 * Initialize cache configuration and state from PaletteConfig.
	 */
	private initializeCacheSystem(): void {
		const extensionVersion = this._config.version ?? '0.0.0';

		this.cacheConfig = {
			// Local catalog never expires except on version change
			localCatalogTtl: Number.MAX_SAFE_INTEGER,

			// Online catalog TTL from config (default 3 hours)
			onlineCatalogTtl: this._config.cache.onlineTtlMs,

			// Enhanced catalog TTL from config (default 30 minutes)
			enhancedCatalogTtl: this._config.cache.enhancedTtlMs,

			// Enable/disable caching
			enableCaching: this._config.cache.enabled,

			// Current application version
			extensionVersion
		};

		// Initialize cache state
		this.cacheState = {
			localCatalog: this.createEmptyCacheEntry(),
			onlineCatalog: this.createEmptyCacheEntry(),
			enhancedCatalog: this.createEmptyCacheEntry()
		};

		// Initialize metrics
		this.cacheMetrics = {
			hits: 0,
			misses: 0,
			invalidations: 0
		};

		this._logger.info('Cache system initialized:');
		this._logger.debug(`  Local catalog TTL: Never expires (version-based)`);
		this._logger.debug(`  Online catalog TTL: ${this.cacheConfig.onlineCatalogTtl / 1000 / 60} minutes`);
		this._logger.debug(`  Enhanced catalog TTL: ${this.cacheConfig.enhancedCatalogTtl / 1000 / 60} minutes`);
		this._logger.debug(`  Application version: ${extensionVersion}`);
		this._logger.debug(`  Caching enabled: ${this.cacheConfig.enableCaching}`);
	}

	/** Create an empty (invalid) cache entry. */
	private createEmptyCacheEntry<T>(): CatalogCacheEntry<T> {
		return {
			data: null,
			timestamp: 0,
			ttl: 0,
			version: this.cacheConfig?.extensionVersion
		};
	}

	/** Check whether a cache entry is still valid. */
	private isCacheValid<T>(entry: CatalogCacheEntry<T>, checkVersion = false): boolean {
		if (!this.cacheConfig.enableCaching || !entry.data) {
			return false;
		}

		// Check version-based invalidation for local catalog
		if (checkVersion && entry.version !== this.cacheConfig.extensionVersion) {
			this._logger.debug(
				`Cache invalidated due to version change: ${entry.version} -> ${this.cacheConfig.extensionVersion}`
			);
			this.cacheMetrics.invalidations++;
			this.cacheMetrics.lastInvalidation = new Date();
			return false;
		}

		// Check time-based invalidation
		const now = Date.now();
		const isWithinTtl = (now - entry.timestamp) < entry.ttl;

		if (!isWithinTtl) {
			this._logger.debug(`Cache expired: ${(now - entry.timestamp) / 1000}s > ${entry.ttl / 1000}s`);
		}

		return isWithinTtl;
	}

	/** Update a cache entry with new data and reset its timestamp. */
	private updateCache<T>(entry: CatalogCacheEntry<T>, data: T): void {
		entry.data = data;
		entry.timestamp = Date.now();
		entry.version = this.cacheConfig.extensionVersion;
	}

	/** Record a cache hit in metrics. */
	private recordCacheHit(cacheType: string): void {
		this.cacheMetrics.hits++;
		this.cacheMetrics.lastHit = new Date();
		this._logger.debug(`Cache HIT for ${cacheType} (${this.cacheMetrics.hits} total hits)`);
	}

	/** Record a cache miss in metrics. */
	private recordCacheMiss(cacheType: string): void {
		this.cacheMetrics.misses++;
		this.cacheMetrics.lastMiss = new Date();
		this._logger.debug(`Cache MISS for ${cacheType} (${this.cacheMetrics.misses} total misses)`);
	}

	/**
	 * Get cache performance statistics.
	 */
	public getCacheStatistics() {
		const hitRate = this.cacheMetrics.hits + this.cacheMetrics.misses > 0
			? (this.cacheMetrics.hits / (this.cacheMetrics.hits + this.cacheMetrics.misses) * 100).toFixed(2)
			: '0.00';

		return {
			...this.cacheMetrics,
			hitRate: `${hitRate}%`,
			cacheConfig: this.cacheConfig,
			localCacheValid: this.isCacheValid(this.cacheState.localCatalog, true),
			onlineCacheValid: this.isCacheValid(this.cacheState.onlineCatalog),
			enhancedCacheValid: this.isCacheValid(this.cacheState.enhancedCatalog)
		};
	}

	/**
	 * Clear all caches (for debugging / manual refresh).
	 */
	public clearCache(): void {
		this.cacheState = {
			localCatalog: this.createEmptyCacheEntry(),
			onlineCatalog: this.createEmptyCacheEntry(),
			enhancedCatalog: this.createEmptyCacheEntry()
		};
		this.cacheMetrics.invalidations++;
		this.cacheMetrics.lastInvalidation = new Date();
		this._logger.info('All caches cleared manually');
	}
}
