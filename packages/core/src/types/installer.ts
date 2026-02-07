/**
 * Installer type definitions
 */

/** A file available for installation */
export interface InstallableFile {
	name: string;
	type: 'instruction' | 'prompt' | 'chatmode';
	source: 'Bundled' | 'Online';
	path: string;
	description?: string;
	repositoryUrl?: string;
}

/** Installation status for files */
export type InstallationStatus = 'available' | 'installed' | 'conflict' | 'installing';

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
}

/** Conflict resolution options */
export enum ConflictResolution {
	OVERWRITE = 'overwrite',
	SKIP = 'skip',
	RENAME = 'rename'
}
