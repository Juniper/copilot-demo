/**
 * Logger interface — platform-agnostic replacement for vscode.OutputChannel
 */
export interface Logger {
	info(message: string): void;
	debug(message: string): void;
	warn(message: string): void;
	error(message: string, error?: unknown): void;
}
