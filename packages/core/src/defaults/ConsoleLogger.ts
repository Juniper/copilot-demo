/**
 * ConsoleLogger — default Logger implementation using console.*
 */
import type { Logger } from '../interfaces/Logger.js';

export class ConsoleLogger implements Logger {
	private prefix: string;

	constructor(prefix = 'awesome-palette') {
		this.prefix = prefix;
	}

	info(message: string): void {
		console.log(`[${this.prefix}] ${message}`);
	}

	debug(message: string): void {
		console.debug(`[${this.prefix}] ${message}`);
	}

	warn(message: string): void {
		console.warn(`[${this.prefix}] ${message}`);
	}

	error(message: string, error?: unknown): void {
		console.error(`[${this.prefix}] ${message}`);
		if (error) {
			console.error(error);
		}
	}
}
