/**
 * Repository type definitions
 * Types for Online Repository Management
 */

export interface OnlineRepository {
	/** Display name for the repository */
	name: string;
	/** Full GitHub URL */
	url: string;
	/** Repository owner (e.g., 'github') */
	owner: string;
	/** Repository name (e.g., 'awesome-copilot') */
	repo: string;
	/** Branch to fetch from (defaults to 'main') */
	branch?: string;
	/** Path to instructions directory (defaults to 'instructions') */
	instructionsPath?: string;
	/** Path to prompts directory (defaults to 'prompts') */
	promptsPath?: string;
	/** Path to agents directory (defaults to 'agents') */
	agentsPath?: string;
	/** Path to skills directory (defaults to 'skills') */
	skillsPath?: string;
	/** Path to cookbooks directory (defaults to 'cookbooks') */
	cookbooksPath?: string;
	/** Whether this repository is enabled for fetching */
	enabled: boolean;
	/** API rate limit considerations */
	rateLimit?: {
		remaining: number;
		resetTime: Date;
	};
}

export interface RemoteFile {
	/** File name with extension */
	name: string;
	/** Relative path within the repository */
	path: string;
	/** File type based on extension and path */
	type: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook' | 'other';
	/** SHA hash for caching validation */
	sha: string;
	/** File size in bytes */
	size: number;
	/** GitHub download URL */
	downloadUrl: string;
	/** Source repository */
	repository: OnlineRepository;
	/** Last indexed timestamp */
	lastIndexed: Date;
	/** Optional: For folder-based types like skills */
	isFolder?: boolean;
	files?: RemoteSkillFile[];
	markerFile?: string;
}

/** Skill-specific file within a skill folder */
export interface RemoteSkillFile {
	/** Relative path within skill folder */
	relativePath: string;
	/** Full path in repository */
	fullPath: string;
	/** SHA hash for content validation */
	sha: string;
	/** File size in bytes */
	size: number;
	/** Download URL */
	downloadUrl: string;
}

export interface CachedFile {
	/** File metadata */
	file: RemoteFile;
	/** File content (only stored when downloaded) */
	content?: string;
	/** Cache timestamp */
	cachedAt: Date;
	/** Cache TTL in milliseconds */
	ttl: number;
	/** Whether content is cached locally */
	hasContent: boolean;
}

export interface RepositoryIndex {
	/** Repository metadata */
	repository: OnlineRepository;
	/** All indexed files */
	files: RemoteFile[];
	/** Index timestamp */
	indexedAt: Date;
	/** Index TTL in milliseconds */
	ttl: number;
	/** Whether index is valid */
	isValid: boolean;
	/** Index statistics */
	stats: {
		totalFiles: number;
		instructionFiles: number;
		promptFiles: number;
		agentFiles: number;
		skillFiles: number;
		cookbookFiles: number;
	};
}

export interface GitHubApiResponse {
	/** Whether the API call was successful */
	success: boolean;
	/** Response data */
	data?: any;
	/** Error message if failed */
	error?: string;
	/** Rate limit information */
	rateLimit?: {
		limit: number;
		remaining: number;
		resetTime: Date;
	};
	/** Response metadata */
	metadata?: {
		requestUrl: string;
		responseTime: number;
		statusCode: number;
	};
}

export interface RepositoryManagerConfig {
	/** Whether online fetching is enabled */
	enableOnlineFetching: boolean;
	/** Default cache TTL in milliseconds (1 hour) */
	defaultCacheTtl: number;
	/** Index refresh interval in milliseconds (6 hours) */
	indexRefreshInterval: number;
	/** Maximum file size to download (1MB) */
	maxFileSize: number;
	/** Request timeout in milliseconds */
	requestTimeout: number;
	/** User agent for GitHub API requests */
	userAgent: string;
	/** GitHub personal access token (optional) */
	githubToken?: string;
}
