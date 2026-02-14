/**
 * Contract: Config Extensions
 *
 * TypeScript interface contracts showing the extensions to existing
 * configuration types required by the Structure Analysis feature.
 *
 * NOTE: This is a design contract, not production code. Changes will
 * be applied to the existing files in packages/core/src/.
 */

// ── RepositoryConfig Extension ────────────────────────────────────────

/**
 * Extended RepositoryConfig — adds optional path overrides.
 * 
 * Existing fields (owner, repo, branch, enabled) are unchanged.
 * The new `pathOverrides` field is optional and backward-compatible.
 */
export interface RepositoryConfig {
	/** Repository owner (e.g. "github" or "another-organization") */
	owner: string;
	/** Repository name (e.g. "awesome-copilot") */
	repo: string;
	/** Branch to fetch from (default: "main") */
	branch: string;
	/** Whether this repository is enabled */
	enabled: boolean;

	// ── NEW FIELD ──────────────────────────────────────────────────
	/**
	 * Optional per-type directory path overrides.
	 *
	 * When provided, the system scans ONLY the specified directories
	 * for the given types (FR-006/FR-007). Types not listed fall back
	 * to automatic discovery (FR-008).
	 *
	 * Naming convention filtering still applies within overridden paths.
	 */
	pathOverrides?: PathOverrides;
}

/** Per-type directory path overrides */
export interface PathOverrides {
	/** Override directory for instruction files */
	instructions?: string;
	/** Override directory for prompt files */
	prompts?: string;
	/** Override directory for agent files */
	agents?: string;
	/** Override directory for skill directories */
	skills?: string;
	/** Override directory for cookbook files */
	cookbooks?: string;
}

// ── RepositoryManagerConfig Extension ─────────────────────────────────

/**
 * Extended RepositoryManagerConfig — adds scan depth and exclusion settings.
 *
 * All existing fields are unchanged. New fields are additive.
 */
export interface RepositoryManagerConfig {
	// ── EXISTING FIELDS (unchanged) ────────────────────────────────
	enableOnlineFetching: boolean;
	defaultCacheTtl: number;
	indexRefreshInterval: number;
	maxFileSize: number;
	requestTimeout: number;
	userAgent: string;
	githubToken?: string;

	// ── NEW FIELDS ─────────────────────────────────────────────────
	/**
	 * Maximum directory depth for structure analysis.
	 * Applied globally to all repositories (FR-009).
	 * Default: 3
	 */
	maxScanDepth: number;

	/**
	 * Directory prefixes excluded from scanning (FR-010).
	 * Entries are matched as path prefixes against Git tree paths.
	 * Default: ['.git/', 'node_modules/', '.github/workflows/', 'dist/',
	 *           'build/', '__pycache__/', '.venv/', '.env/', 'vendor/',
	 *           'coverage/', '.next/', '.nuxt/', 'out/', 'target/',
	 *           'bin/', 'obj/']
	 */
	excludedDirectories: string[];
}

// ── OnlineRepository — no structural changes ──────────────────────────
//
// The existing optional fields (instructionsPath, promptsPath, etc.)
// are REINTERPRETED as path overrides. Their types and optionality
// remain identical. The behavioral change is:
//
//   BEFORE: fields always populated with defaults ('instructions', 'prompts', etc.)
//   AFTER:  fields left undefined when no override is needed;
//           RepositoryManager populates them only when RepositoryConfig
//           includes explicit pathOverrides.
//
// This change is internal to initializeDefaultRepositories() and does
// not affect the OnlineRepository interface definition.
