/**
 * Contract: Analyzer Types
 *
 * TypeScript interface contracts for the Structure Analysis module.
 * These define the public API surface for @awesome-palette/core's
 * new analyzer functionality.
 *
 * NOTE: This is a design contract, not production code. The actual
 * implementation files will live in packages/core/src/types/analyzer.ts
 * and packages/core/src/analyzer/.
 */

// ── File Type ─────────────────────────────────────────────────────────

/** All recognized file types, including the special copilot-instruction type */
export type FileType =
	| 'instruction'
	| 'prompt'
	| 'agent'
	| 'skill'
	| 'cookbook'
	| 'copilot-instruction';

// ── File Type Rules ───────────────────────────────────────────────────

/** Defines a naming convention pattern and its corresponding file type */
export interface FileTypeRule {
	/** Pattern matched against filename (case-insensitive) */
	readonly pattern: RegExp;
	/** The classified type when pattern matches */
	readonly type: FileType;
	/** Evaluation order — lower number = checked first = higher priority */
	readonly priority: number;
	/** Human-readable description of the rule */
	readonly description: string;
}

// ── Discovered File ───────────────────────────────────────────────────

/** A file found during structure analysis */
export interface DiscoveredFile {
	/** Full path within repository (e.g., "guides/python.instructions.md") */
	readonly path: string;
	/** Filename only (e.g., "python.instructions.md") */
	readonly name: string;
	/** Classified type based on naming convention */
	readonly type: FileType;
	/** Git blob SHA */
	readonly sha: string;
	/** File size in bytes */
	readonly size: number;
	/** Parent directory path (e.g., "guides"), empty string for root */
	readonly directory: string;
	/** Nesting depth from root (0 = root, 1 = first-level dir, etc.) */
	readonly depth: number;
}

// ── Skill Directory ───────────────────────────────────────────────────

/** A skill directory discovered via SKILL.md marker */
export interface DiscoveredSkill {
	/** Skill directory name (e.g., "my-skill") */
	readonly name: string;
	/** Full directory path within repository */
	readonly directoryPath: string;
	/** All files within the skill directory */
	readonly files: DiscoveredSkillFile[];
	/** The SKILL.md marker file */
	readonly markerFile: DiscoveredFile;
	/** Total size of all files in bytes */
	readonly totalSize: number;
}

/** A file within a skill directory */
export interface DiscoveredSkillFile {
	/** Path relative to skill directory root */
	readonly relativePath: string;
	/** Full path in repository */
	readonly fullPath: string;
	/** Git blob SHA */
	readonly sha: string;
	/** File size in bytes */
	readonly size: number;
}

// ── Directory Mapping ─────────────────────────────────────────────────

/** Associates a directory with the file types found within it */
export interface DirectoryMapping {
	/** Directory path relative to repo root */
	readonly directoryPath: string;
	/** Nesting depth */
	readonly depth: number;
	/** Distinct file types found in this directory */
	readonly fileTypes: FileType[];
	/** Total recognized files in this directory */
	readonly fileCount: number;
	/** True if directory contains multiple file types */
	readonly hasMixedTypes: boolean;
}

// ── Analysis Warnings ─────────────────────────────────────────────────

/** Machine-readable warning codes */
export type AnalysisWarningCode =
	| 'NO_RECOGNIZED_FILES'
	| 'EMPTY_DIRECTORY'
	| 'TREE_TRUNCATED'
	| 'API_ERROR'
	| 'AUTH_REQUIRED'
	| 'PATH_OVERRIDE_NOT_FOUND'
	| 'STANDALONE_SKILL_MD';

/** A diagnostic message from the analysis process */
export interface AnalysisWarning {
	/** Machine-readable warning code */
	readonly code: AnalysisWarningCode;
	/** Human-readable description */
	readonly message: string;
	/** Relevant directory, if applicable */
	readonly directoryPath?: string;
	/** Warning (non-blocking) or error (structural issue) */
	readonly severity: 'warning' | 'error';
}

// ── Analysis Statistics ───────────────────────────────────────────────

/** Per-type file counts from the analysis */
export interface AnalysisStatistics {
	/** Total recognized files */
	readonly totalFiles: number;
	readonly instructions: number;
	readonly prompts: number;
	readonly agents: number;
	/** Count of skill directories (not individual files within) */
	readonly skills: number;
	readonly cookbooks: number;
	/** Files examined but not matching any convention */
	readonly unrecognized: number;
}

// ── Structure Analysis Result ─────────────────────────────────────────

/** The primary output of repository structure analysis */
export interface StructureAnalysisResult {
	/** Repository identifier ("owner/repo") */
	readonly repository: string;
	/** All files that matched a naming convention */
	readonly discoveredFiles: DiscoveredFile[];
	/** Skill directories discovered via SKILL.md markers */
	readonly discoveredSkills: DiscoveredSkill[];
	/** Per-directory summary of which types were found */
	readonly directoryMappings: DirectoryMapping[];
	/** Directories excluded from scanning (matched exclusion list) */
	readonly skippedDirectories: string[];
	/** Directories that were examined */
	readonly scannedDirectories: string[];
	/** Validation warnings and errors */
	readonly warnings: AnalysisWarning[];
	/** copilot-instructions.md at repo root, if found */
	readonly rootCopilotInstructions: DiscoveredFile | null;
	/** .github/copilot-instructions.md, if found */
	readonly githubCopilotInstructions: DiscoveredFile | null;
	/** Per-type counts */
	readonly statistics: AnalysisStatistics;
	/** Timestamp of analysis */
	readonly analyzedAt: Date;
	/** Whether the Git Trees API response was truncated */
	readonly treeWasTruncated: boolean;
	/** True if at least one file was discovered */
	readonly isUsable: boolean;
}

// ── Analyzer Config ───────────────────────────────────────────────────

/** Configuration for the structure analyzer */
export interface AnalyzerConfig {
	/** Maximum directory nesting depth to scan (default: 3) */
	readonly maxScanDepth: number;
	/** Directory prefixes to skip during analysis */
	readonly excludedDirectories: readonly string[];
}

// ── Structure Analyzer Public API ─────────────────────────────────────

/** Function signature for making GitHub API requests (injectable) */
export type GitHubApiRequestFn = (
	url: string,
	repository: { owner: string; repo: string; branch?: string }
) => Promise<{
	success: boolean;
	data?: unknown;
	error?: string;
}>;

/**
 * StructureAnalyzer — public API contract.
 *
 * This is the interface that RepositoryManager consumes.
 * Implementation lives in packages/core/src/analyzer/StructureAnalyzer.ts
 */
export interface IStructureAnalyzer {
	/**
	 * Analyze a repository's structure using the Git Trees API.
	 *
	 * @param owner - Repository owner
	 * @param repo - Repository name
	 * @param branch - Branch to analyze (default: "main")
	 * @param config - Optional analyzer configuration overrides
	 * @returns Analysis result with discovered files, mappings, and warnings
	 */
	analyze(
		owner: string,
		repo: string,
		branch?: string,
		config?: Partial<AnalyzerConfig>
	): Promise<StructureAnalysisResult>;

	/**
	 * Classify a single filename by naming convention.
	 *
	 * @param fileName - The filename to classify
	 * @returns The matched FileType, or undefined if no convention matches
	 */
	classifyFile(fileName: string): FileType | undefined;
}
