/**
 * StructureAnalyzer
 *
 * Core component for analyzing repository structure using the Git Trees API.
 * Discovers files matching naming conventions, detects skill directories,
 * and builds directory mappings with comprehensive error handling.
 *
 * Key responsibilities:
 * - Fetch repository tree via Git Trees API (recursive)
 * - Classify files by naming conventions (delegates to FileTypeRules)
 * - Detect skill directories via SKILL.md markers
 * - Build directory mappings and statistics
 * - Handle API errors, truncation, and edge cases
 * - Generate actionable warnings for structural issues
 */

import type { Logger } from '../interfaces/Logger.js';
import type {
  IStructureAnalyzer,
  GitHubApiRequestFn,
  StructureAnalysisResult,
  AnalyzerConfig,
  FileType,
  DiscoveredFile,
  DiscoveredSkill,
  DiscoveredSkillFile,
  DirectoryMapping,
  AnalysisWarning,
  AnalysisStatistics,
} from '../types/analyzer.js';
import { classifyFile, DEFAULT_EXCLUDED_DIRECTORIES } from './FileTypeRules.js';

// ── GitTree API Response Type ─────────────────────────────────────────

/** Git Trees API response structure */
interface GitTreeResponse {
  sha: string;
  url: string;
  tree: GitTreeEntry[];
  truncated: boolean;
}

/** Individual entry in the Git tree */
interface GitTreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

// ── Internal Working Data ─────────────────────────────────────────────

/** Internal representation during processing */
interface ProcessedFile {
  path: string;
  name: string;
  type: FileType;
  sha: string;
  size: number;
  directory: string;
  depth: number;
}

// ══════════════════════════════════════════════════════════════════════
// StructureAnalyzer Implementation
// ══════════════════════════════════════════════════════════════════════

export class StructureAnalyzer implements IStructureAnalyzer {
  private readonly _logger: Logger;
  private readonly _apiRequestFn: GitHubApiRequestFn;

  constructor(logger: Logger, apiRequestFn: GitHubApiRequestFn) {
    this._logger = logger;
    this._apiRequestFn = apiRequestFn;
  }

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /**
   * Analyze repository structure via Git Trees API.
   *
   * Performs recursive tree traversal, file classification, skill directory
   * detection, and generates comprehensive analysis results with warnings.
   */
  public async analyze(
    owner: string,
    repo: string,
    branch: string = 'main',
    config?: Partial<AnalyzerConfig>
  ): Promise<StructureAnalysisResult> {
    const repository = `${owner}/${repo}`;
    this._logger.info(`Starting structure analysis for ${repository} (${branch})`);

    // Step 4: Prepare configuration
    const analyzerConfig: AnalyzerConfig = {
      maxScanDepth: config?.maxScanDepth ?? 3,
      excludedDirectories: config?.excludedDirectories ?? DEFAULT_EXCLUDED_DIRECTORIES,
    };

    this._logger.info(
      `Config: maxScanDepth=${analyzerConfig.maxScanDepth}, excludedDirs=${analyzerConfig.excludedDirectories.length}`
    );

    // Step 1: API Call
    const url = `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    
    let apiResponse: { success: boolean; data?: unknown; error?: string };
    try {
      apiResponse = await this._apiRequestFn(url, { owner, repo, branch });
    } catch (error) {
      // Step 2: Error Handling - Unexpected exception
      this._logger.error('API request threw exception', error);
      return this._buildErrorResult(repository, {
        code: 'API_ERROR',
        message: `Failed to fetch repository tree: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    }

    // Step 2: Error Handling - Check response
    if (!apiResponse.success) {
      const errorMsg = apiResponse.error || 'Unknown API error';
      this._logger.error(`API request failed: ${errorMsg}`);

      // Check for authentication errors (401/403)
      if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.toLowerCase().includes('unauthorized')) {
        return this._buildErrorResult(repository, {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required. Please configure a GitHub token with repo access.',
          severity: 'error',
        });
      }

      // Generic API error
      return this._buildErrorResult(repository, {
        code: 'API_ERROR',
        message: `GitHub API error: ${errorMsg}`,
        severity: 'error',
      });
    }

    // Parse response
    const treeData = apiResponse.data as GitTreeResponse;
    const warnings: AnalysisWarning[] = [];

    // Step 3: Truncation Check
    if (treeData.truncated) {
      this._logger.warn('Git tree response was truncated - large repository may have incomplete results');
      warnings.push({
        code: 'TREE_TRUNCATED',
        message: 'Repository tree was truncated by GitHub API. Some files may not be included in analysis.',
        severity: 'warning',
      });
    }

    // Step 5: Filter Tree Entries
    const filteredEntries = this._filterTreeEntries(treeData.tree, analyzerConfig);
    this._logger.info(`Filtered ${filteredEntries.length} blob entries from ${treeData.tree.length} total entries`);

    // Step 6: File Classification
    const processedFiles = this._classifyFiles(filteredEntries);
    this._logger.info(`Classified ${processedFiles.length} files matching naming conventions`);

    // Step 7: Skill Directory Detection
    const { discoveredSkills, remainingFiles, skillWarnings } = this._detectSkillDirectories(processedFiles);
    warnings.push(...skillWarnings);
    this._logger.info(`Detected ${discoveredSkills.length} skill directories`);

    // Step 8: copilot-instructions.md Detection
    const { rootCopilotInstructions, githubCopilotInstructions, finalFiles } = 
      this._extractCopilotInstructions(remainingFiles);

    if (rootCopilotInstructions) {
      this._logger.info('Found copilot-instructions.md at repository root');
    }
    if (githubCopilotInstructions) {
      this._logger.info('Found .github/copilot-instructions.md');
    }

    // Convert ProcessedFile to DiscoveredFile
    const discoveredFiles: DiscoveredFile[] = finalFiles.map(f => ({
      path: f.path,
      name: f.name,
      type: f.type,
      sha: f.sha,
      size: f.size,
      directory: f.directory,
      depth: f.depth,
    }));

    // Step 9: Build DirectoryMapping
    const directoryMappings = this._buildDirectoryMappings(discoveredFiles);
    this._logger.info(`Built ${directoryMappings.length} directory mappings`);

    // Step 10: Build AnalysisStatistics
    const statistics = this._buildStatistics(discoveredFiles, discoveredSkills);

    // Step 11: Generate Warnings
    if (discoveredFiles.length === 0 && discoveredSkills.length === 0) {
      warnings.push({
        code: 'NO_RECOGNIZED_FILES',
        message: 'No files matching awesome-copilot naming conventions were found in this repository.',
        severity: 'warning',
      });
    }

    // Step 12: Set isUsable Flag
    const isUsable = discoveredFiles.length > 0 || discoveredSkills.length > 0;

    // Step 13: Return Result
    const result: StructureAnalysisResult = {
      repository,
      discoveredFiles,
      discoveredSkills,
      directoryMappings,
      skippedDirectories: this._extractSkippedDirectories(treeData.tree, analyzerConfig),
      scannedDirectories: this._extractScannedDirectories(treeData.tree, analyzerConfig),
      warnings,
      rootCopilotInstructions,
      githubCopilotInstructions,
      statistics,
      analyzedAt: new Date(),
      treeWasTruncated: treeData.truncated,
      isUsable,
    };

    this._logger.info(
      `Analysis complete: ${statistics.totalFiles} files, ${discoveredSkills.length} skills, ${warnings.length} warnings, usable=${isUsable}`
    );

    return result;
  }

  /**
   * Classify a single file by naming convention.
   * Delegates to FileTypeRules.classifyFile().
   */
  public classifyFile(fileName: string): FileType | undefined {
    return classifyFile(fileName);
  }

  // ────────────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ────────────────────────────────────────────────────────────────────

  /**
   * Build an error result when API fails.
   */
  private _buildErrorResult(repository: string, warning: AnalysisWarning): StructureAnalysisResult {
    return {
      repository,
      discoveredFiles: [],
      discoveredSkills: [],
      directoryMappings: [],
      skippedDirectories: [],
      scannedDirectories: [],
      warnings: [warning],
      rootCopilotInstructions: null,
      githubCopilotInstructions: null,
      statistics: {
        totalFiles: 0,
        instructions: 0,
        prompts: 0,
        agents: 0,
        skills: 0,
        cookbooks: 0,
        unrecognized: 0,
      },
      analyzedAt: new Date(),
      treeWasTruncated: false,
      isUsable: false,
    };
  }

  /**
   * Step 5: Filter tree entries by depth and exclusions.
   */
  private _filterTreeEntries(tree: GitTreeEntry[], config: AnalyzerConfig): GitTreeEntry[] {
    return tree.filter(entry => {
      // Only process files (blobs), not subdirectories (trees)
      if (entry.type !== 'blob') {
        return false;
      }

      // Calculate depth by counting '/' separators
      const depth = this._calculateDepth(entry.path);
      if (depth > config.maxScanDepth) {
        return false;
      }

      // Check if path starts with any excluded directory prefix
      for (const excludedDir of config.excludedDirectories) {
        if (entry.path.startsWith(excludedDir)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Step 6: Classify files by naming conventions.
   */
  private _classifyFiles(entries: GitTreeEntry[]): ProcessedFile[] {
    const processedFiles: ProcessedFile[] = [];

    for (const entry of entries) {
      const fileName = this._extractFileName(entry.path);
      const type = classifyFile(fileName);

      if (type) {
        const directory = this._extractDirectory(entry.path);
        const depth = this._calculateDepth(entry.path);

        processedFiles.push({
          path: entry.path,
          name: fileName,
          type,
          sha: entry.sha,
          size: entry.size ?? 0,
          directory,
          depth,
        });
      }
    }

    return processedFiles;
  }

  /**
   * Step 7: Detect skill directories via SKILL.md markers.
   */
  private _detectSkillDirectories(files: ProcessedFile[]): {
    discoveredSkills: DiscoveredSkill[];
    remainingFiles: ProcessedFile[];
    skillWarnings: AnalysisWarning[];
  } {
    const discoveredSkills: DiscoveredSkill[] = [];
    const skillWarnings: AnalysisWarning[] = [];
    const filesToRemove = new Set<string>(); // Track paths to remove from main list

    // Find all SKILL.md markers
    const skillMarkers = files.filter(f => f.type === 'skill');

    for (const marker of skillMarkers) {
      // Check for standalone SKILL.md at root (depth === 0)
      if (marker.depth === 0) {
        this._logger.warn('Found standalone SKILL.md at repository root - this is not valid');
        skillWarnings.push({
          code: 'STANDALONE_SKILL_MD',
          message: 'SKILL.md found at repository root. SKILL.md must be inside a skill directory.',
          severity: 'warning',
        });
        filesToRemove.add(marker.path);
        continue;
      }

      // Extract parent directory path (everything before /SKILL.md)
      const directoryPath = marker.directory;
      const skillName = this._extractFileName(directoryPath);

      // Find all sibling files (same parent directory)
      const siblingFiles: DiscoveredSkillFile[] = [];
      for (const file of files) {
        if (file.path.startsWith(directoryPath + '/') && file.path !== marker.path) {
          // Calculate relative path within skill directory
          const relativePath = file.path.substring(directoryPath.length + 1);
          siblingFiles.push({
            relativePath,
            fullPath: file.path,
            sha: file.sha,
            size: file.size,
          });
          filesToRemove.add(file.path);
        }
      }

      // Add the marker file itself to sibling files
      siblingFiles.push({
        relativePath: 'SKILL.md',
        fullPath: marker.path,
        sha: marker.sha,
        size: marker.size,
      });
      filesToRemove.add(marker.path);

      // Calculate total size
      const totalSize = siblingFiles.reduce((sum, f) => sum + f.size, 0);

      // Create the DiscoveredSkill
      discoveredSkills.push({
        name: skillName,
        directoryPath,
        files: siblingFiles,
        markerFile: {
          path: marker.path,
          name: marker.name,
          type: marker.type,
          sha: marker.sha,
          size: marker.size,
          directory: marker.directory,
          depth: marker.depth,
        },
        totalSize,
      });
    }

    // Remove skill-related files from main list
    const remainingFiles = files.filter(f => !filesToRemove.has(f.path));

    return { discoveredSkills, remainingFiles, skillWarnings };
  }

  /**
   * Step 8: Extract copilot-instructions.md files.
   */
  private _extractCopilotInstructions(files: ProcessedFile[]): {
    rootCopilotInstructions: DiscoveredFile | null;
    githubCopilotInstructions: DiscoveredFile | null;
    finalFiles: ProcessedFile[];
  } {
    let rootCopilotInstructions: DiscoveredFile | null = null;
    let githubCopilotInstructions: DiscoveredFile | null = null;
    const finalFiles: ProcessedFile[] = [];

    for (const file of files) {
      if (file.type === 'copilot-instruction') {
        if (file.path === 'copilot-instructions.md' && file.depth === 0) {
          // Root level copilot-instructions.md
          rootCopilotInstructions = {
            path: file.path,
            name: file.name,
            type: file.type,
            sha: file.sha,
            size: file.size,
            directory: file.directory,
            depth: file.depth,
          };
        } else if (file.path === '.github/copilot-instructions.md') {
          // .github/copilot-instructions.md
          githubCopilotInstructions = {
            path: file.path,
            name: file.name,
            type: file.type,
            sha: file.sha,
            size: file.size,
            directory: file.directory,
            depth: file.depth,
          };
        } else {
          // Other copilot-instructions.md files (keep in main list)
          finalFiles.push(file);
        }
      } else {
        finalFiles.push(file);
      }
    }

    return { rootCopilotInstructions, githubCopilotInstructions, finalFiles };
  }

  /**
   * Step 9: Build directory mappings.
   */
  private _buildDirectoryMappings(files: DiscoveredFile[]): DirectoryMapping[] {
    // Group files by directory
    const dirMap = new Map<string, DiscoveredFile[]>();

    for (const file of files) {
      const dir = file.directory || '.';
      if (!dirMap.has(dir)) {
        dirMap.set(dir, []);
      }
      dirMap.get(dir)!.push(file);
    }

    // Build DirectoryMapping for each directory
    const mappings: DirectoryMapping[] = [];

    for (const [directoryPath, dirFiles] of dirMap.entries()) {
      const fileTypes = Array.from(new Set(dirFiles.map(f => f.type)));
      const depth = directoryPath === '.' ? 0 : this._calculateDepth(directoryPath) + 1;

      mappings.push({
        directoryPath,
        depth,
        fileTypes,
        fileCount: dirFiles.length,
        hasMixedTypes: fileTypes.length > 1,
      });
    }

    return mappings.sort((a, b) => a.directoryPath.localeCompare(b.directoryPath));
  }

  /**
   * Step 10: Build analysis statistics.
   */
  private _buildStatistics(files: DiscoveredFile[], skills: DiscoveredSkill[]): AnalysisStatistics {
    let instructions = 0;
    let prompts = 0;
    let agents = 0;
    let cookbooks = 0;

    for (const file of files) {
      switch (file.type) {
        case 'instruction':
          instructions++;
          break;
        case 'prompt':
          prompts++;
          break;
        case 'agent':
          agents++;
          break;
        case 'cookbook':
          cookbooks++;
          break;
        // Note: copilot-instruction files are counted in totalFiles but not separately
        // Note: skill type files should have been removed by skill detection
      }
    }

    return {
      totalFiles: files.length,
      instructions,
      prompts,
      agents,
      skills: skills.length,
      cookbooks,
      unrecognized: 0,
    };
  }

  /**
   * Extract list of directories that were skipped due to exclusion rules.
   */
  private _extractSkippedDirectories(tree: GitTreeEntry[], config: AnalyzerConfig): string[] {
    const skipped = new Set<string>();

    for (const entry of tree) {
      for (const excludedDir of config.excludedDirectories) {
        if (entry.path.startsWith(excludedDir)) {
          // Extract the actual directory that was skipped
          const dir = entry.path.split('/')[0];
          skipped.add(dir);
          break;
        }
      }
    }

    return Array.from(skipped).sort();
  }

  /**
   * Extract list of directories that were scanned (not excluded, within depth).
   */
  private _extractScannedDirectories(tree: GitTreeEntry[], config: AnalyzerConfig): string[] {
    const scanned = new Set<string>();

    for (const entry of tree) {
      const depth = this._calculateDepth(entry.path);
      if (depth > config.maxScanDepth) {
        continue;
      }

      let isExcluded = false;
      for (const excludedDir of config.excludedDirectories) {
        if (entry.path.startsWith(excludedDir)) {
          isExcluded = true;
          break;
        }
      }

      if (!isExcluded) {
        const dir = entry.path.split('/')[0];
        if (dir !== entry.path) {
          // This is in a subdirectory
          scanned.add(dir);
        }
      }
    }

    return Array.from(scanned).sort();
  }

  /**
   * Calculate nesting depth from path.
   * Root files (no '/') = depth 0
   * 'dir/file.md' = depth 1
   * 'dir/subdir/file.md' = depth 2
   */
  private _calculateDepth(path: string): number {
    const separators = (path.match(/\//g) || []).length;
    return separators;
  }

  /**
   * Extract filename from full path (last segment after final '/').
   */
  private _extractFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Extract parent directory from path (everything before last '/').
   * Returns empty string for root-level files.
   */
  private _extractDirectory(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) {
      return ''; // Root level
    }
    return path.substring(0, lastSlash);
  }
}
