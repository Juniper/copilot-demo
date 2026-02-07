/**
 * PaletteConfig — platform-agnostic replacement for vscode.workspace.getConfiguration()
 */

export interface RepositoryConfig {
	/** Repository owner (e.g. "HPE-EMU" or "github") */
	owner: string;
	/** Repository name (e.g. "awesome-copilot") */
	repo: string;
	/** Branch to fetch from (default: "main") */
	branch: string;
	/** Whether this repository is enabled */
	enabled: boolean;
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
				owner: 'HPE-EMU',
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
