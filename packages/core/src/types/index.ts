/**
 * Type re-exports for @awesome-palette/core
 */

export type {
	CatalogEntry,
	EnhancedCatalog,
	Recommendation,
	RecommendationSet,
	CatalogCacheConfig,
	CatalogCacheEntry,
	CatalogCacheState,
	CacheMetrics
} from './catalog.js';

export type {
	OnlineRepository,
	RemoteFile,
	CachedFile,
	RepositoryIndex,
	GitHubApiResponse,
	RepositoryManagerConfig
} from './repository.js';

export {
	ConflictResolution
} from './installer.js';

export type {
	InstallableFile,
	InstallationStatus,
	InstallableFileWithStatus,
	InstallationResult
} from './installer.js';
