/**
 * CatalogTemplate - HTML template generation for catalog webview.
 * Ported from Project-Olorin's CatalogTemplate with rebranding and updated imports.
 */

import * as vscode from 'vscode';
import { BaseTemplate } from './BaseTemplate';
import { TemplateData } from '../types';
import type { InstallableFileWithStatus } from '@awesome-palette/core';

export interface CatalogTemplateData extends TemplateData {
	filesWithStatus: InstallableFileWithStatus[];
	showSearch?: boolean;
	showBatchActions?: boolean;
}

export class CatalogTemplate extends BaseTemplate {

	constructor(extensionUri: vscode.Uri) {
		super(extensionUri);
	}

	/**
	 * Get default title for catalog
	 */
	protected getDefaultTitle(): string {
		return 'Awesome Palette File Catalog';
	}

	/**
	 * Generate catalog-specific body content
	 */
	protected generateBody(data?: CatalogTemplateData): string {
		const filesWithStatus = data?.filesWithStatus || [];
		const showSearch = data?.showSearch !== false;
		const showBatchActions = data?.showBatchActions !== false;

		return `
            <h1>${this.getDefaultTitle()}</h1>

            ${showSearch ? this._generateSearchContainer(filesWithStatus) : ''}
            ${showBatchActions ? this._generateBatchActions() : ''}
            ${this._generateSummary(filesWithStatus)}
            ${this._generateCatalogTable(filesWithStatus)}
            ${this._generateNoResultsMessage()}
            ${this._generateFooter()}
        `;
	}

	/**
	 * Get catalog-specific custom styles
	 */
	protected getCustomStyles(): string {
		return `
            /* Search Container */
            .search-container {
                margin-bottom: 20px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
            }

            .search-input {
                width: 100%;
                padding: 8px 12px;
                margin-bottom: 10px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                font-size: 14px;
            }

            .search-input:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }

            .quick-filters {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }

            .filter-button {
                padding: 4px 8px;
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .filter-button:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .filter-button.active {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .search-results-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }

            /* Batch Actions */
            .batch-actions {
                margin: 15px 0;
                padding: 10px;
                background-color: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                display: none;
            }

            .batch-actions.visible {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            /* Table Styles */
            .catalog-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            .catalog-table th,
            .catalog-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            .catalog-table th {
                background-color: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                font-weight: bold;
                position: sticky;
                top: 0;
            }

            .catalog-table tr:hover {
                background-color: var(--vscode-list-hoverBackground);
            }

            .catalog-table tr.hidden {
                display: none;
            }

            /* Badge Styles */
            .type-badge, .source-badge, .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .type-instruction {
                background-color: #007acc;
                color: white;
            }

            .type-prompt {
                background-color: #28a745;
                color: white;
            }

            .type-agent {
                background-color: #ffc107;
                color: black;
            }

            .type-skill {
                background-color: #9c27b0;
                color: white;
            }

            .type-cookbook {
                background-color: #ff5722;
                color: white;
            }

            .source-bundled {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .source-online {
                background-color: #17a2b8;
                color: white;
            }

            .status-available {
                background-color: #6c757d;
                color: white;
            }

            .status-installed {
                background-color: #28a745;
                color: white;
            }

            .status-conflict {
                background-color: #ffc107;
                color: black;
            }

            .status-installing {
                background-color: #17a2b8;
                color: white;
            }

            /* Install Button Styles */
            .install-button {
                font-size: 11px;
                padding: 4px 8px;
            }

            .install-button.installed {
                background-color: #28a745;
                cursor: default;
            }

            .install-button.conflict {
                background-color: #ffc107;
                color: black;
            }

            /* Summary Styles */
            .summary {
                margin-bottom: 20px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
            }

            .file-path {
                max-width: 300px;
                word-break: break-all;
                font-family: var(--vscode-editor-font-family);
                font-size: 11px;
            }

            /* No results message */
            .no-results {
                text-align: center;
                padding: 40px 20px;
                color: var(--vscode-descriptionForeground);
                display: none;
            }

            .no-results.visible {
                display: block;
            }

            /* Footer */
            .catalog-footer {
                margin-top: 30px;
                text-align: center;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
                font-size: 12px;
            }
        `;
	}

	/**
	 * Get catalog-specific custom scripts
	 */
	protected getCustomScripts(): string {
		return `
            // Catalog-specific variables
            let allFiles = [];
            let currentFilters = [];
            let selectedFiles = new Set();

            // Initialize catalog functionality
            function initializeCatalog(filesData) {
                allFiles = filesData;
                setupEventListeners();
                performSearch();
            }

            // Setup event listeners
            function setupEventListeners() {
                // Search functionality
                const searchInput = document.getElementById('catalogSearch');
                if (searchInput) {
                    searchInput.addEventListener('input', function(e) {
                        debounce(performSearch, 300)(e.target.value);
                    });
                }

                // Quick filter buttons
                document.querySelectorAll('.filter-button').forEach(button => {
                    button.addEventListener('click', function() {
                        const filter = this.dataset.filter;
                        if (this.classList.contains('active')) {
                            removeFilter(filter);
                            this.classList.remove('active');
                        } else {
                            addFilter(filter);
                            this.classList.add('active');
                        }
                        performSearch();
                    });
                });

                // Clear filters
                const clearFilters = document.getElementById('clearFilters');
                if (clearFilters) {
                    clearFilters.addEventListener('click', function() {
                        clearAllFilters();
                    });
                }

                // Select all checkbox
                const selectAll = document.getElementById('selectAll');
                if (selectAll) {
                    selectAll.addEventListener('change', function() {
                        const isChecked = this.checked;
                        const visibleCheckboxes = document.querySelectorAll('tr:not(.hidden) .file-checkbox');
                        visibleCheckboxes.forEach(checkbox => {
                            checkbox.checked = isChecked;
                            updateSelection(checkbox);
                        });
                    });
                }

                // Individual file checkboxes
                document.addEventListener('change', function(e) {
                    if (e.target.classList.contains('file-checkbox')) {
                        updateSelection(e.target);
                    }
                });

                // Install buttons
                document.addEventListener('click', function(e) {
                    if (e.target.classList.contains('install-button') && !e.target.disabled) {
                        try {
                            const fileData = JSON.parse(e.target.dataset.file);
                            installFile(fileData);
                        } catch (error) {
                            console.error('Error handling install button click:', error);
                        }
                    }
                });

                // Batch install button
                const installSelected = document.getElementById('installSelected');
                if (installSelected) {
                    installSelected.addEventListener('click', function() {
                        const selectedFileData = Array.from(selectedFiles).map(checkbox =>
                            JSON.parse(checkbox.dataset.file)
                        );
                        if (selectedFileData.length > 0) {
                            batchInstall(selectedFileData);
                        }
                    });
                }

                // Deselect all button
                const deselectAll = document.getElementById('deselectAll');
                if (deselectAll) {
                    deselectAll.addEventListener('click', function() {
                        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
                            checkbox.checked = false;
                        });
                        selectedFiles.clear();
                        updateBatchActions();
                        updateSelectAllState();
                    });
                }
            }

            // Search and filter functions
            function performSearch(searchTerm = '') {
                const searchValue = (searchTerm || (document.getElementById('catalogSearch')?.value || '')).toLowerCase();
                const rows = document.querySelectorAll('.catalog-table tbody tr');
                let visibleCount = 0;

                rows.forEach(row => {
                    const name = (row.dataset.name || '').toLowerCase();
                    const type = (row.dataset.type || '').toLowerCase();
                    const source = (row.dataset.source || '').toLowerCase();

                    let isVisible = true;

                    // Apply search term
                    if (searchValue) {
                        const matchesSearch = name.includes(searchValue) ||
                                            type.includes(searchValue) ||
                                            source.includes(searchValue);
                        if (!matchesSearch) isVisible = false;
                    }

                    // Apply filters
                    for (const filter of currentFilters) {
                        if (!matchesFilter(row, filter)) {
                            isVisible = false;
                            break;
                        }
                    }

                    if (isVisible) {
                        row.classList.remove('hidden');
                        visibleCount++;
                    } else {
                        row.classList.add('hidden');
                    }
                });

                updateResultsCount(visibleCount);
                updateNoResultsMessage(visibleCount === 0);
                updateSelectAllState();
            }

            function matchesFilter(row, filter) {
                const [key, value] = filter.split(':');
                const rowValue = row.dataset[key];
                return rowValue === value;
            }

            function addFilter(filter) {
                if (!currentFilters.includes(filter)) {
                    currentFilters.push(filter);
                    updateClearFiltersButton();
                }
            }

            function removeFilter(filter) {
                const index = currentFilters.indexOf(filter);
                if (index > -1) {
                    currentFilters.splice(index, 1);
                    updateClearFiltersButton();
                }
            }

            function clearAllFilters() {
                currentFilters = [];
                const searchInput = document.getElementById('catalogSearch');
                if (searchInput) {
                    searchInput.value = '';
                }
                document.querySelectorAll('.filter-button.active').forEach(btn => {
                    btn.classList.remove('active');
                });
                updateClearFiltersButton();
                performSearch();
            }

            function updateClearFiltersButton() {
                const clearButton = document.getElementById('clearFilters');
                if (clearButton) {
                    const hasFilters = currentFilters.length > 0 ||
                                      (document.getElementById('catalogSearch')?.value || '').length > 0;
                    clearButton.style.display = hasFilters ? 'inline-block' : 'none';
                }
            }

            function updateResultsCount(count) {
                const resultsCount = document.getElementById('resultsCount');
                if (resultsCount) {
                    resultsCount.textContent = count + ' files found';
                }
            }

            function updateNoResultsMessage(show) {
                const noResults = document.getElementById('noResults');
                const catalogTable = document.getElementById('catalogTable');

                if (noResults) {
                    noResults.classList.toggle('visible', show);
                }
                if (catalogTable) {
                    catalogTable.style.display = show ? 'none' : 'table';
                }
            }

            // Selection functions
            function updateSelection(checkbox) {
                if (checkbox.checked) {
                    selectedFiles.add(checkbox);
                } else {
                    selectedFiles.delete(checkbox);
                }
                updateBatchActions();
                updateSelectAllState();
            }

            function updateBatchActions() {
                const count = selectedFiles.size;
                const selectedCount = document.getElementById('selectedCount');
                const batchActions = document.getElementById('batchActions');

                if (selectedCount) {
                    selectedCount.textContent = count + ' selected';
                }
                if (batchActions) {
                    batchActions.classList.toggle('visible', count > 0);
                }
            }

            function updateSelectAllState() {
                const visibleCheckboxes = document.querySelectorAll('tr:not(.hidden) .file-checkbox');
                const checkedVisibleCheckboxes = document.querySelectorAll('tr:not(.hidden) .file-checkbox:checked');
                const selectAllCheckbox = document.getElementById('selectAll');

                if (!selectAllCheckbox) return;

                if (visibleCheckboxes.length === 0) {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = false;
                } else if (checkedVisibleCheckboxes.length === visibleCheckboxes.length) {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = true;
                } else if (checkedVisibleCheckboxes.length > 0) {
                    selectAllCheckbox.indeterminate = true;
                    selectAllCheckbox.checked = false;
                } else {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = false;
                }
            }

            // Installation functions
            function installFile(fileData) {
                sendMessage('installFile', { fileData: fileData });
            }

            function batchInstall(selectedFileData) {
                sendMessage('batchInstall', { selectedFiles: selectedFileData });
            }

            // Handle status updates from extension
            function updateFileStatus(fileName, newStatus) {
                const row = document.querySelector(\`tr[data-name="\${fileName.toLowerCase()}"]\`);
                if (row) {
                    // Update data-status attribute for filter compatibility
                    row.dataset.status = newStatus;

                    const statusBadge = row.querySelector('.status-badge');
                    const installButton = row.querySelector('.install-button');

                    if (statusBadge) {
                        statusBadge.className = \`status-badge status-\${newStatus}\`;
                        statusBadge.textContent = getStatusIcon(newStatus) + ' ' + newStatus;
                    }

                    if (installButton && newStatus === 'installed') {
                        installButton.textContent = 'Installed';
                        installButton.disabled = true;
                        installButton.className = 'install-button installed';
                    }
                }
            }

            function updateAllFileStatuses(filesWithStatus) {
                allFiles = filesWithStatus;
                performSearch();
            }

            function handleBatchInstallComplete(results) {
                results.forEach(result => {
                    updateFileStatus(result.fileName, result.success ? 'installed' : 'conflict');
                });

                selectedFiles.clear();
                updateBatchActions();
                updateSelectAllState();
            }

            function getStatusIcon(status) {
                switch (status) {
                    case 'available': return '📦';
                    case 'installed': return '✅';
                    case 'conflict': return '⚠️';
                    case 'installing': return '🔄';
                    default: return '❓';
                }
            }

            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;

                switch (message.type) {
                    case 'fileInstalled':
                        updateFileStatus(message.fileName, 'installed');
                        break;
                    case 'installationError':
                        console.error('Installation error:', message.error);
                        showMessage('Installation failed: ' + message.error, 'error');
                        break;
                    case 'batchInstallComplete':
                        handleBatchInstallComplete(message.results);
                        break;
                    case 'installationStatusUpdate':
                        updateAllFileStatuses(message.filesWithStatus);
                        break;
                }
            });
        `;
	}

	/**
	 * Generate search container
	 */
	private _generateSearchContainer(filesWithStatus: InstallableFileWithStatus[]): string {
		return `
            <div class="search-container">
                <input type="text" id="catalogSearch" class="search-input"
                       placeholder="Search files... (e.g., 'python', 'type:instruction', 'source:bundled')" />

                <div class="quick-filters">
                    <button class="filter-button" data-filter="type:instruction">Instructions</button>
                    <button class="filter-button" data-filter="type:prompt">Prompts</button>
                    <button class="filter-button" data-filter="type:agent">Agents</button>
                    <button class="filter-button" data-filter="type:skill">Skills</button>
                    <!-- <button class="filter-button" data-filter="type:cookbook">Cookbooks</button> -->
                    <button class="filter-button" data-filter="source:bundled">Bundled</button>
                    <button class="filter-button" data-filter="source:online">Online</button>
                    <button class="filter-button" data-filter="status:available">Available</button>
                    <button class="filter-button" data-filter="status:installed">Installed</button>
                    <button class="filter-button" data-filter="status:conflict">Conflicts</button>
                </div>

                <div class="search-results-info">
                    <span id="resultsCount">${filesWithStatus.length} files found</span>
                    <button id="clearFilters" style="display:none;">Clear Filters</button>
                </div>
            </div>
        `;
	}

	/**
	 * Generate batch actions section
	 */
	private _generateBatchActions(): string {
		return `
            <div class="batch-actions" id="batchActions">
                <div>
                    <span id="selectedCount">0 selected</span>
                </div>
                <div>
                    <button id="installSelected">Install Selected</button>
                    <button id="deselectAll">Deselect All</button>
                </div>
            </div>
        `;
	}

	/**
	 * Generate summary section
	 */
	private _generateSummary(filesWithStatus: InstallableFileWithStatus[]): string {
		const instructionCount = filesWithStatus.filter(item => item.type === 'instruction').length;
		const promptCount = filesWithStatus.filter(item => item.type === 'prompt').length;
		const agentCount = filesWithStatus.filter(item => item.type === 'agent').length;
		const skillCount = filesWithStatus.filter(item => item.type === 'skill').length;
		const cookbookCount = filesWithStatus.filter(item => item.type === 'cookbook').length;
		const bundledCount = filesWithStatus.filter(item => item.source === 'Bundled').length;
		const onlineCount = filesWithStatus.filter(item => item.source === 'Online').length;
		const availableCount = filesWithStatus.filter(item => item.status === 'available').length;
		const installedCount = filesWithStatus.filter(item => item.status === 'installed').length;
		const conflictCount = filesWithStatus.filter(item => item.status === 'conflict').length;

		return `
            <div class="summary">
                <strong>Total Files:</strong> ${filesWithStatus.length}<br>
                <strong>Instructions:</strong> ${instructionCount} |
                <strong>Prompts:</strong> ${promptCount} |
                <strong>Agents:</strong> ${agentCount} |
                <strong>Skills:</strong> ${skillCount} |
                <strong>Cookbooks:</strong> ${cookbookCount}<br>
                <strong>Bundled:</strong> ${bundledCount} |
                <strong>Online:</strong> ${onlineCount}<br>
                <strong>Available:</strong> ${availableCount} |
                <strong>Installed:</strong> ${installedCount} |
                <strong>Conflicts:</strong> ${conflictCount}
            </div>
        `;
	}

	/**
	 * Generate catalog table
	 */
	private _generateCatalogTable(filesWithStatus: InstallableFileWithStatus[]): string {
		const tableRows = filesWithStatus.map(item => this._generateTableRow(item)).join('');

		return `
            <table id="catalogTable" class="catalog-table">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAll" /></th>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Location / Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
	}

	/**
	 * Generate individual table row
	 */
	private _generateTableRow(item: InstallableFileWithStatus): string {
		const statusIcon = this._getStatusIcon(item.status);
		const statusClass = `status-${item.status}`;
		const installButton = this._getInstallButton(item);

		return `
            <tr data-name="${this.escapeHtml(item.name.toLowerCase())}"
                data-type="${this.escapeHtml(item.type)}"
                data-source="${this.escapeHtml(item.source.toLowerCase())}"
                data-status="${this.escapeHtml(item.status)}">
                <td>
                    <input type="checkbox" class="file-checkbox" data-file='${this.escapeHtml(JSON.stringify(item))}' />
                </td>
                <td><strong>${this.escapeHtml(item.name)}</strong></td>
                <td><span class="type-badge type-${this.escapeHtml(item.type)}">${this.escapeHtml(item.type)}</span></td>
                <td><span class="source-badge source-${this.escapeHtml(item.source.toLowerCase())}">${this.escapeHtml(item.source)}</span></td>
                <td>
                    <span class="status-badge ${statusClass}">${statusIcon} ${this.escapeHtml(item.status)}</span>
                </td>
                <td>
                    <div class="file-path">
                        <small>${this.escapeHtml(item.path)}</small>
                        ${item.description ? `<br><em>${this.escapeHtml(item.description)}</em>` : ''}
                    </div>
                </td>
                <td>${installButton}</td>
            </tr>
        `;
	}

	/**
	 * Generate no results message
	 */
	private _generateNoResultsMessage(): string {
		return `
            <div class="no-results" id="noResults">
                <h3>No files match your search criteria</h3>
                <p>Try adjusting your search terms or clearing filters.</p>
            </div>
        `;
	}

	/**
	 * Generate footer
	 */
	private _generateFooter(): string {
		return `
            <div class="catalog-footer">
                Awesome Palette — browse and install GitHub Copilot instructions, prompts, and agents
            </div>
        `;
	}

	/**
	 * Get status icon for file installation status
	 */
	private _getStatusIcon(status: string): string {
		switch (status) {
			case 'available': return '📦';
			case 'installed': return '✅';
			case 'conflict': return '⚠️';
			case 'installing': return '🔄';
			default: return '❓';
		}
	}

	/**
	 * Get install button HTML for a file based on its status
	 */
	private _getInstallButton(file: InstallableFileWithStatus): string {
		const fileDataJson = this.escapeHtml(JSON.stringify(file));

		switch (file.status) {
			case 'available':
				return `<button class="install-button" data-file='${fileDataJson}'>Install</button>`;
			case 'installed':
				return `<button class="install-button installed" disabled>Installed</button>`;
			case 'conflict':
				return `<button class="install-button conflict" data-file='${fileDataJson}'>Resolve</button>`;
			case 'installing':
				return `<button class="install-button" disabled>Installing...</button>`;
			default:
				return `<button class="install-button" disabled>Unknown</button>`;
		}
	}

	/**
	 * Generate complete catalog HTML with initialization script.
	 */
	public generateCatalogHtml(filesWithStatus: InstallableFileWithStatus[]): string {
		const templateData: CatalogTemplateData = {
			title: this.getDefaultTitle(),
			filesWithStatus: filesWithStatus,
			showSearch: true,
			showBatchActions: true
		};

		const initScript = `
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    if (typeof initializeCatalog === 'function') {
                        initializeCatalog(${JSON.stringify(filesWithStatus)});
                    }
                });
            </script>
        `;

		return this.generateHtml(templateData) + initScript;
	}
}
