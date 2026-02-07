/**
 * NodeFileSystem — default FileSystem implementation using Node.js fs/promises
 */
import * as fs from 'fs/promises';
import type { FileSystem } from '../interfaces/FileSystem.js';

export class NodeFileSystem implements FileSystem {
	async readFile(filePath: string): Promise<string> {
		return fs.readFile(filePath, 'utf-8');
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		await fs.writeFile(filePath, content, 'utf-8');
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	async mkdir(dirPath: string, options?: { recursive: boolean }): Promise<void> {
		await fs.mkdir(dirPath, options);
	}

	async stat(filePath: string): Promise<{ isFile: boolean; isDirectory: boolean }> {
		const stats = await fs.stat(filePath);
		return {
			isFile: stats.isFile(),
			isDirectory: stats.isDirectory()
		};
	}
}
