/**
 * VSCodeLogger — bridges Logger interface to vscode.OutputChannel
 */
import * as vscode from 'vscode';
import type { Logger } from '@awesome-palette/core';

export class VSCodeLogger implements Logger {
	private _outputChannel: vscode.OutputChannel;
	private _prefix: string;

	constructor(outputChannel: vscode.OutputChannel, prefix = 'awesome-palette') {
		this._outputChannel = outputChannel;
		this._prefix = prefix;
	}

	info(message: string): void {
		this._outputChannel.appendLine(`[${this._prefix}] ${message}`);
	}

	debug(message: string): void {
		this._outputChannel.appendLine(`[${this._prefix}:debug] ${message}`);
	}

	warn(message: string): void {
		this._outputChannel.appendLine(`[${this._prefix}:warn] ${message}`);
	}

	error(message: string, error?: unknown): void {
		this._outputChannel.appendLine(`[${this._prefix}:error] ${message}`);
		if (error) {
			this._outputChannel.appendLine(`  ${error instanceof Error ? error.stack || error.message : String(error)}`);
		}
	}
}
