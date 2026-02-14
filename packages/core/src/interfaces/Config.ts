/**
 * PaletteConfig — platform-agnostic replacement for vscode.workspace.getConfiguration()
 */

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

export interface RepositoryConfig {
	/** Repository owner (e.g. "github" or "another-organization") */
	owner: string;
	/** Repository name (e.g. "awesome-copilot") */
	repo: string;
	/** Branch to fetch from (default: "main") */
	branch: string;
	/** Whether this repository is enabled */
	enabled: boolean;
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

export interface PaletteConfig {
	/** List of remote awesome-copilot repositories to fetch from */
	remoteRepositories: RepositoryConfig[];
	/** Whether online fetching is enabled */
	enableOnlineFetching: boolean;
	/** GitHub personal access token (optional, for higher rate limits) */
	githubToken?: string;
	/** Application version string for cache invalidation */
	version?: string;
	/** Cache configuration */
	cache: {
		/** Whether caching is enabled */
		enabled: boolean;
		/** Online catalog cache TTL in milliseconds (default: 3 hours) */
		onlineTtlMs: number;
		/** Enhanced catalog cache TTL in milliseconds (default: 30 min) */
		enhancedTtlMs: number;
	};
}

/**
 * Create a PaletteConfig with sensible defaults
 */
export function createDefaultConfig(overrides?: Partial<PaletteConfig>): PaletteConfig {
	return {
		remoteRepositories: [
			{
				owner: 'github',
				repo: 'awesome-copilot',
				branch: 'main',
				enabled: true
			}
		],
		enableOnlineFetching: true,
		cache: {
			enabled: true,
			onlineTtlMs: 3 * 60 * 60 * 1000,   // 3 hours
			enhancedTtlMs: 30 * 60 * 1000       // 30 minutes
		},
		...overrides
	};
}
