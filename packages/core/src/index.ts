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
export type { PaletteConfig, RepositoryConfig } from './interfaces/Config.js';

// ── Core classes ──────────────────────────────────────────────────────
export { CatalogManager } from './catalog/CatalogManager.js';
export { RepositoryManager } from './repository/RepositoryManager.js';
export { FileInstaller } from './installer/FileInstaller.js';

// ── Default implementations ───────────────────────────────────────────
export { ConsoleLogger } from './defaults/ConsoleLogger.js';
export { NodeFileSystem } from './defaults/NodeFileSystem.js';

// ── Catalog entries ───────────────────────────────────────────────────
export { defaultCatalogEntries } from './catalog/entries.js';

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
