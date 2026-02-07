/**
 * UI type definitions for awesome-palette VS Code extension.
 * Minimal subset ported from Project-Olorin's ui/types — only catalog-relevant types.
 */

// ===== Core Component Interfaces =====

/**
 * Base interface for webview providers
 */
export interface IWebviewProvider {
	show(): Promise<void>;
	hide?(): void;
	dispose?(): void;
}

/**
 * Base interface for template providers
 */
export interface ITemplateProvider {
	generateHtml(data?: any): string;
	generateCss?(): string;
	generateJavaScript?(): string;
}

// ===== Message System Types =====

/**
 * Base webview message structure
 */
export interface WebviewMessage {
	type: string;
	timestamp?: string;
	data?: any;
	[key: string]: any;
}

/**
 * Base webview response structure
 */
export interface WebviewResponse {
	success: boolean;
	message?: string;
	data?: any;
	error?: string;
}

/**
 * Message types for the catalog system
 */
export enum MessageType {
	// Catalog operations
	SHOW_CATALOG = 'showCatalog',
	SHOW_INSTALLED = 'showInstalled',
	INSTALL_FILE = 'installFile',
	BATCH_INSTALL = 'batchInstall',
	CHECK_INSTALLATION_STATUS = 'checkInstallationStatus',
	RESOLVE_CONFLICT = 'resolveConflict',
	OPEN_GITHUB_FOLDER = 'openGithubFolder',

	// UI updates
	INSTALLATION_STATUS_UPDATE = 'installationStatusUpdate',

	// Error handling
	TEMPLATE_ERROR = 'templateError'
}

// ===== Template Types =====

/**
 * Template data for HTML generation
 */
export interface TemplateData {
	title?: string;
	data?: any;
	theme?: 'light' | 'dark';
	scripts?: string[];
	styles?: string[];
	[key: string]: any;
}
