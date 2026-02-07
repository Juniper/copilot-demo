/**
 * VSCodeFileSystem — bridges FileSystem interface to vscode.workspace.fs
 */
import * as vscode from 'vscode';
import type { FileSystem } from '@awesome-palette/core';

export class VSCodeFileSystem implements FileSystem {
	async readFile(filePath: string): Promise<string> {
		const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
		return Buffer.from(content).toString('utf-8');
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(filePath),
			Buffer.from(content, 'utf-8')
		);
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
			return true;
		} catch {
			return false;
		}
	}

	async mkdir(dirPath: string, _options?: { recursive: boolean }): Promise<void> {
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
	}

	async stat(filePath: string): Promise<{ isFile: boolean; isDirectory: boolean }> {
		const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
		return {
			isFile: stat.type === vscode.FileType.File,
			isDirectory: stat.type === vscode.FileType.Directory
		};
	}
}
