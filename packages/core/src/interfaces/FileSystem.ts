/**
 * FileSystem interface — platform-agnostic replacement for vscode.workspace.fs
 */
export interface FileSystem {
	/** Read a file and return its content as a UTF-8 string */
	readFile(filePath: string): Promise<string>;

	/** Write content to a file (creates or overwrites) */
	writeFile(filePath: string, content: string): Promise<void>;

	/** Check if a file or directory exists */
	exists(filePath: string): Promise<boolean>;

	/** Create a directory, optionally recursively */
	mkdir(dirPath: string, options?: { recursive: boolean }): Promise<void>;

	/** Get file/directory metadata */
	stat(filePath: string): Promise<{ isFile: boolean; isDirectory: boolean }>;
}
