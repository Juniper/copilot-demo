/**
 * Installer type definitions
 */

/** A file available for installation */
export interface InstallableFile {
	name: string;
	type: 'instruction' | 'prompt' | 'agent' | 'skill' | 'cookbook';
	source: 'Bundled' | 'Online';
	path: string;
	description?: string;
	repositoryUrl?: string;
	/** Optional: For folder-based types like skills */
	isFolder?: boolean;
	files?: InstallableFileChild[];
}

/** Child file within a folder-based installable */
export interface InstallableFileChild {
	relativePath: string;
	content?: string;
	sha?: string;
	size: number;
	downloadUrl?: string;
}

/** Installation status for files */
export type InstallationStatus = 'available' | 'installed' | 'conflict' | 'partial' | 'installing';

/** InstallableFile with status information */
export interface InstallableFileWithStatus extends InstallableFile {
	status: InstallationStatus;
	targetPath?: string;
}

/** Result of a file installation operation */
export interface InstallationResult {
	success: boolean;
	filePath: string;
	fileName: string;
	error?: string;
	skipped?: boolean;
	overwritten?: boolean;
	/** Files installed (for folder operations) */
	filesInstalled?: number;
	/** Total files in folder (for folder operations) */
	totalFiles?: number;
}

/** Conflict resolution options */
export enum ConflictResolution {
	OVERWRITE = 'overwrite',
	SKIP = 'skip',
	RENAME = 'rename'
}
