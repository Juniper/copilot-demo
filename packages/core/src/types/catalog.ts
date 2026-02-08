/**
 * Catalog type definitions
 */

/** A catalog entry describing an available instruction, prompt, or agent file */
export interface CatalogEntry {
	/** Unique identifier (e.g., 'python-instructions') */
	id: string;
	/** Display name (e.g., 'Python Development Standards') */
	name: string;
	/** File type */
	type: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook';
	/** Category for organization */
	category: string;
	/** Brief description of purpose */
	description: string;
	/** Path to the actual file (relative to assets directory for bundled, repo path for online) */
	filePath: string;
	/** Matching metadata for recommendations */
	metadata: {
		languages?: string[];
		frameworks?: string[];
		projectTypes?: string[];
		characteristics?: string[];
	};
}

/** Enhanced statistics including local, remote, and installation data */
export interface EnhancedStatistics {
	// Total counts
	totalEntries: number;
	localEntries: number;
	remoteEntries: number;

	// Per-type breakdown with sources
	instructions: TypeStatistics;
	prompts: TypeStatistics;
	agents: TypeStatistics;
	skills: TypeStatistics;
	cookbooks: TypeStatistics;

	// Metadata
	lastUpdated: Date;
	repositories: string[];

	// Installation status (optional, requires workspace context)
	installation?: InstallationStatistics;
}

/** Statistics for a single file type */
export interface TypeStatistics {
	local: number;
	remote: number;
	total: number;
}

/** Installation status statistics */
export interface InstallationStatistics {
	totalInstalled: number;
	totalAvailable: number;
	percentage: number;
	byType: {
		instructions: number;
		prompts: number;
		agents: number;
		skills: number;
		cookbooks: number;
	};
}

/** Enhanced catalog combining local and remote sources */
export interface EnhancedCatalog {
	/** Local (bundled) files */
	local: {
		instructions: string[];
		prompts: string[];
		agents: string[];
		skills: string[];
		cookbooks: string[];
	};
	/** Remote files from online repositories */
	remote: {
		instructions: RemoteFile[];
		prompts: RemoteFile[];
		agents: RemoteFile[];
		skills: RemoteFile[];
		cookbooks: RemoteFile[];
	};
	/** Combined catalog entries formatted for display */
	combined: {
		instructions: string[];
		prompts: string[];
		agents: string[];
		skills: string[];
		cookbooks: string[];
	};
	/** Catalog statistics */
	metadata: {
		localCount: number;
		remoteCount: number;
		totalCount: number;
		lastUpdated: Date;
		repositories: string[];
	};
}

/** Recommendation from analysis */
export interface Recommendation {
	id: string;
	name: string;
	type: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook' | 'setting';
	priority: 'high' | 'medium' | 'low';
	reason: string;
	category: 'language' | 'framework' | 'project-type' | 'general';
	filePath?: string;
	description?: string;
}

/** Set of recommendations with confidence info */
export interface RecommendationSet {
	recommendations: Recommendation[];
	confidence: 'high' | 'medium' | 'low';
	reasoning?: string;
	fallbackUsed?: boolean;
}

// Import RemoteFile from repository types (re-exported here for convenience)
import type { RemoteFile } from './repository.js';
export type { RemoteFile as RemoteFileCatalog };

/** Cache configuration */
export interface CatalogCacheConfig {
	localCatalogTtl: number;
	onlineCatalogTtl: number;
	enhancedCatalogTtl: number;
	enableCaching: boolean;
	extensionVersion?: string;
}

/** Cache entry */
export interface CatalogCacheEntry<T> {
	data: T | null;
	timestamp: number;
	ttl: number;
	version?: string;
}

/** Cache state */
export interface CatalogCacheState {
	localCatalog: CatalogCacheEntry<{
		instructions: string[];
		prompts: string[];
		agents: string[];
		skills: string[];
		cookbooks: string[];
	}>;
	onlineCatalog: CatalogCacheEntry<{
		instructions: string[];
		prompts: string[];
		agents: string[];
		skills: string[];
		cookbooks: string[];
	}>;
	enhancedCatalog: CatalogCacheEntry<EnhancedCatalog>;
}

/** Cache performance metrics */
export interface CacheMetrics {
	hits: number;
	misses: number;
	invalidations: number;
	lastHit?: Date;
	lastMiss?: Date;
	lastInvalidation?: Date;
}
