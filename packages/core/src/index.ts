/**
 * @awesome-palette/core — public API
 *
 * Platform-agnostic library for browsing, searching, and installing
 * GitHub Copilot instructions, prompts, and chatmodes from
 * awesome-copilot repositories.
 */

// ── Interfaces ────────────────────────────────────────────────────────
export type { Logger } from './interfaces/Logger.js';
export type { FileSystem } from './interfaces/FileSystem.js';
export { createDefaultConfig } from './interfaces/Config.js';
export type { PaletteConfig, RepositoryConfig, PathOverrides } from './interfaces/Config.js';

// ── Core classes ──────────────────────────────────────────────────────
export { CatalogManager } from './catalog/CatalogManager.js';
export { RepositoryManager } from './repository/RepositoryManager.js';
export { FileInstaller } from './installer/FileInstaller.js';
export { StructureAnalyzer } from './analyzer/StructureAnalyzer.js';

// ── Default implementations ───────────────────────────────────────────
export { ConsoleLogger } from './defaults/ConsoleLogger.js';
export { NodeFileSystem } from './defaults/NodeFileSystem.js';

// ── Catalog entries ───────────────────────────────────────────────────
export { defaultCatalogEntries } from './catalog/entries.js';

// ── Analyzer utilities ────────────────────────────────────────────────
export { classifyFile, DEFAULT_FILE_TYPE_RULES } from './analyzer/FileTypeRules.js';

// ── Types ─────────────────────────────────────────────────────────────
export type {
	CatalogEntry,
	EnhancedCatalog,
	Recommendation,
	RecommendationSet,
	CatalogCacheConfig,
	CatalogCacheEntry,
	CatalogCacheState,
	CacheMetrics
} from './types/catalog.js';

export type {
	OnlineRepository,
	RemoteFile,
	CachedFile,
	RepositoryIndex,
	GitHubApiResponse,
	RepositoryManagerConfig
} from './types/repository.js';

export type {
	InstallableFile,
	InstallableFileWithStatus,
	InstallationResult,
	InstallationStatus
} from './types/installer.js';

export { ConflictResolution } from './types/installer.js';

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
} from './types/analyzer.js';

// ── Asset path resolver ───────────────────────────────────────────────
import * as path from 'path';

/**
 * Resolve a bundled asset path relative to the core package's `assets/` dir.
 *
 * Usage:
 * ```ts
 * import { resolveAssetPath } from '@awesome-palette/core';
 * const filePath = resolveAssetPath('instructions/planning.instructions.md');
 * ```
 */
export function resolveAssetPath(relativePath: string): string {
	return path.resolve(__dirname, '..', 'assets', relativePath);
}
