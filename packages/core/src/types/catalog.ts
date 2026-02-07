/**
 * Catalog type definitions
 */

/** A catalog entry describing an available instruction, prompt, or chatmode file */
export interface CatalogEntry {
	/** Unique identifier (e.g., 'python-instructions') */
	id: string;
	/** Display name (e.g., 'Python Development Standards') */
	name: string;
	/** File type */
	type: 'instruction' | 'prompt' | 'chatmode';
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

/** Enhanced catalog combining local and remote sources */
export interface EnhancedCatalog {
	/** Local (bundled) files */
	local: {
		instructions: string[];
		prompts: string[];
		chatmodes: string[];
	};
	/** Remote files from online repositories */
	remote: {
		instructions: RemoteFile[];
		prompts: RemoteFile[];
		chatmodes: RemoteFile[];
	};
	/** Combined catalog entries formatted for display */
	combined: {
		instructions: string[];
		prompts: string[];
		chatmodes: string[];
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
	type: 'instruction' | 'prompt' | 'chatmode' | 'setting';
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
		chatmodes: string[];
	}>;
	onlineCatalog: CatalogCacheEntry<{
		instructions: string[];
		prompts: string[];
		chatmodes: string[];
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
