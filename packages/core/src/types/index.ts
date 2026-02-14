/**
 * Type re-exports for @awesome-palette/core
 */

export type {
	CatalogEntry,
	EnhancedCatalog,
	EnhancedStatistics,
	TypeStatistics,
	InstallationStatistics,
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

export type {
	FileType,
	FileTypeRule,
	DiscoveredFile,
	DiscoveredSkill,
	DiscoveredSkillFile,
	DirectoryMapping,
	AnalysisWarningCode,
	AnalysisWarning,
	AnalysisStatistics,
	StructureAnalysisResult,
	AnalyzerConfig,
	GitHubApiRequestFn,
	IStructureAnalyzer
} from './analyzer.js';
