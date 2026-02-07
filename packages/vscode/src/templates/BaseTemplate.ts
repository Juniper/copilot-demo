/**
 * BaseTemplate - Foundation class for HTML template generation in VS Code webviews.
 * Ported from Project-Olorin's BaseTemplate with import paths updated.
 */

import * as vscode from 'vscode';
import { ITemplateProvider, TemplateData } from '../types';

export abstract class BaseTemplate implements ITemplateProvider {
	protected extensionUri: vscode.Uri;

	constructor(extensionUri: vscode.Uri) {
		this.extensionUri = extensionUri;
	}

	/**
	 * Generate complete HTML document
	 */
	public generateHtml(data?: TemplateData): string {
		const title = data?.title || this.getDefaultTitle();
		const styles = this.generateCss();
		const scripts = this.generateJavaScript();
		const body = this.generateBody(data);

		return this.wrapInHtmlDocument(title, styles, scripts, body);
	}

	/**
	 * Generate CSS styles - override in subclasses
	 */
	public generateCss(): string {
		return this.getBaseStyles() + this.getCustomStyles();
	}

	/**
	 * Generate JavaScript - override in subclasses
	 */
	public generateJavaScript(): string {
		return this.getBaseScripts() + this.getCustomScripts();
	}

	/**
	 * Generate body content - must be implemented by subclasses
	 */
	protected abstract generateBody(data?: TemplateData): string;

	/**
	 * Get default title - can be overridden by subclasses
	 */
	protected abstract getDefaultTitle(): string;

	/**
	 * Get custom styles - override in subclasses
	 */
	protected getCustomStyles(): string {
		return '';
	}

	/**
	 * Get custom scripts - override in subclasses
	 */
	protected getCustomScripts(): string {
		return '';
	}

	/**
	 * Wrap content in complete HTML document structure
	 */
	protected wrapInHtmlDocument(title: string, styles: string, scripts: string, body: string): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    ${body}
    <script>
        ${scripts}
    </script>
</body>
</html>`;
	}

	/**
	 * Get base VS Code-compatible styles
	 */
	protected getBaseStyles(): string {
		return `
            /* Base VS Code Theme Integration */
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 20px;
                line-height: 1.6;
            }

            /* Typography */
            h1, h2, h3, h4, h5, h6 {
                color: var(--vscode-foreground);
                margin-top: 0;
                margin-bottom: 16px;
                font-weight: 600;
            }

            h1 {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }

            p {
                margin: 0 0 16px 0;
            }

            /* Buttons */
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                transition: background-color 0.2s ease;
            }

            button:hover:not(:disabled) {
                background-color: var(--vscode-button-hoverBackground);
            }

            button:disabled {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                cursor: not-allowed;
                opacity: 0.6;
            }

            button.secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            button.secondary:hover:not(:disabled) {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            /* Input Elements */
            input, textarea, select {
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                padding: 8px 12px;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
            }

            input:focus, textarea:focus, select:focus {
                outline: 1px solid var(--vscode-focusBorder);
                border-color: var(--vscode-focusBorder);
            }

            /* Tables */
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
            }

            th, td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            th {
                background-color: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                font-weight: 600;
            }

            tr:hover {
                background-color: var(--vscode-list-hoverBackground);
            }

            /* Layout Utilities */
            .container {
                max-width: 100%;
                margin: 0 auto;
            }

            .flex {
                display: flex;
            }

            .flex-column {
                flex-direction: column;
            }

            .flex-row {
                flex-direction: row;
            }

            .justify-between {
                justify-content: space-between;
            }

            .justify-center {
                justify-content: center;
            }

            .align-center {
                align-items: center;
            }

            .gap-sm {
                gap: 8px;
            }

            .gap-md {
                gap: 16px;
            }

            .gap-lg {
                gap: 24px;
            }

            /* Spacing Utilities */
            .m-0 { margin: 0; }
            .m-sm { margin: 8px; }
            .m-md { margin: 16px; }
            .m-lg { margin: 24px; }

            .p-0 { padding: 0; }
            .p-sm { padding: 8px; }
            .p-md { padding: 16px; }
            .p-lg { padding: 24px; }

            .mb-sm { margin-bottom: 8px; }
            .mb-md { margin-bottom: 16px; }
            .mb-lg { margin-bottom: 24px; }

            .mt-sm { margin-top: 8px; }
            .mt-md { margin-top: 16px; }
            .mt-lg { margin-top: 24px; }

            /* Status Indicators */
            .status-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 8px;
            }

            .status-success { background-color: var(--vscode-charts-green); }
            .status-warning { background-color: var(--vscode-charts-yellow); }
            .status-error { background-color: var(--vscode-charts-red); }
            .status-info { background-color: var(--vscode-charts-blue); }
            .status-unknown { background-color: var(--vscode-descriptionForeground); }

            /* Badges */
            .badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .badge-primary {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .badge-secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            /* Messages */
            .message {
                padding: 12px 16px;
                border-radius: 4px;
                margin: 16px 0;
            }

            .message-info {
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
            }

            .message-success {
                background-color: var(--vscode-textCodeBlock-background);
                border-left: 4px solid var(--vscode-charts-green);
            }

            .message-warning {
                background-color: var(--vscode-list-warningForeground);
                border-left: 4px solid var(--vscode-charts-yellow);
            }

            .message-error {
                background-color: var(--vscode-list-errorForeground);
                border-left: 4px solid var(--vscode-charts-red);
            }

            /* Loading States */
            .loading {
                opacity: 0.6;
                pointer-events: none;
            }

            .spinner {
                border: 2px solid var(--vscode-panel-border);
                border-top: 2px solid var(--vscode-button-background);
                border-radius: 50%;
                width: 16px;
                height: 16px;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-right: 8px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Responsive Design */
            @media (max-width: 600px) {
                body {
                    padding: 12px;
                }

                .flex-row {
                    flex-direction: column;
                }

                button {
                    width: 100%;
                    margin: 4px 0;
                }
            }
        `;
	}

	/**
	 * Get base JavaScript functionality
	 */
	protected getBaseScripts(): string {
		return `
            // VS Code API
            const vscode = acquireVsCodeApi();

            // Utility Functions
            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }

            function throttle(func, limit) {
                let inThrottle;
                return function() {
                    const args = arguments;
                    const context = this;
                    if (!inThrottle) {
                        func.apply(context, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                }
            }

            // Message Handling
            function sendMessage(type, data = {}) {
                vscode.postMessage({
                    type: type,
                    timestamp: new Date().toISOString(),
                    data: data
                });
            }

            // UI State Management
            function showLoading(element) {
                if (element) {
                    element.classList.add('loading');
                    const spinner = document.createElement('span');
                    spinner.className = 'spinner';
                    element.prepend(spinner);
                }
            }

            function hideLoading(element) {
                if (element) {
                    element.classList.remove('loading');
                    const spinner = element.querySelector('.spinner');
                    if (spinner) {
                        spinner.remove();
                    }
                }
            }

            function showMessage(text, type = 'info') {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message message-\${type}\`;
                messageDiv.textContent = text;

                // Insert at top of body or after header
                const header = document.querySelector('h1');
                if (header) {
                    header.insertAdjacentElement('afterend', messageDiv);
                } else {
                    document.body.insertAdjacentElement('afterbegin', messageDiv);
                }

                // Auto-remove after 5 seconds
                setTimeout(() => {
                    messageDiv.remove();
                }, 5000);
            }

            // Form Validation
            function validateForm(formElement) {
                const requiredInputs = formElement.querySelectorAll('[required]');
                let isValid = true;

                requiredInputs.forEach(input => {
                    if (!input.value.trim()) {
                        input.style.borderColor = 'var(--vscode-inputValidation-errorBorder)';
                        isValid = false;
                    } else {
                        input.style.borderColor = 'var(--vscode-input-border)';
                    }
                });

                return isValid;
            }

            // Storage Helpers
            function saveState(key, value) {
                try {
                    vscode.setState({ ...vscode.getState(), [key]: value });
                } catch (error) {
                    console.warn('Failed to save state:', error);
                }
            }

            function getState(key, defaultValue = null) {
                try {
                    const state = vscode.getState() || {};
                    return state[key] !== undefined ? state[key] : defaultValue;
                } catch (error) {
                    console.warn('Failed to get state:', error);
                    return defaultValue;
                }
            }

            // Event Delegation Helper
            function delegate(parent, selector, event, handler) {
                parent.addEventListener(event, function(e) {
                    if (e.target.matches(selector)) {
                        handler.call(e.target, e);
                    }
                });
            }

            // Initialize common functionality
            document.addEventListener('DOMContentLoaded', function() {
                // Add click feedback to all buttons
                delegate(document, 'button', 'click', function(e) {
                    if (!this.disabled) {
                        this.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            this.style.transform = '';
                        }, 100);
                    }
                });

                // Handle form submissions
                delegate(document, 'form', 'submit', function(e) {
                    e.preventDefault();
                    if (validateForm(this)) {
                        const formData = new FormData(this);
                        const data = Object.fromEntries(formData.entries());
                        sendMessage('formSubmit', { form: this.id || 'unknown', data });
                    }
                });

                // Auto-resize textareas
                delegate(document, 'textarea', 'input', function() {
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                });
            });

            // Error Handling
            window.addEventListener('error', function(e) {
                console.error('Template error:', e.error);
                sendMessage('templateError', {
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno
                });
            });
        `;
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	protected escapeHtml(text: string): string {
		if (typeof text !== 'string') {
			return '';
		}

		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/**
	 * Create HTML element helper
	 */
	protected createElement(tag: string, attributes: Record<string, string> = {}, content: string = ''): string {
		const attrs = Object.entries(attributes)
			.map(([key, value]) => `${key}="${this.escapeHtml(value)}"`)
			.join(' ');

		return `<${tag}${attrs ? ' ' + attrs : ''}>${content}</${tag}>`;
	}

	/**
	 * Generate grid layout
	 */
	protected generateGrid(items: Array<{ content: string; className?: string }>, columns: number = 2): string {
		const gridItems = items.map(item =>
			`<div class="grid-item ${item.className || ''}">${item.content}</div>`
		).join('');

		return `
            <div class="grid" style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 16px;">
                ${gridItems}
            </div>
        `;
	}

	/**
	 * Generate button with optional icon
	 */
	protected generateButton(text: string, options: {
		id?: string;
		className?: string;
		onclick?: string;
		disabled?: boolean;
		icon?: string;
	} = {}): string {
		const attributes: Record<string, string> = {};

		if (options.id) {
			attributes.id = options.id;
		}
		if (options.onclick) {
			attributes.onclick = options.onclick;
		}
		if (options.disabled) {
			attributes.disabled = 'disabled';
		}

		const className = ['button', options.className].filter(Boolean).join(' ');
		if (className) {
			attributes.class = className;
		}

		const content = options.icon ? `${options.icon} ${text}` : text;

		return this.createElement('button', attributes, content);
	}
}
