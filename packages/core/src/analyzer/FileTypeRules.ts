/**
 * FileTypeRules
 *
 * Classification rules and utilities for identifying file types based on
 * naming conventions. Supports exact matches, suffix patterns, and rightmost
 * suffix matching for ambiguous filenames.
 */

import type { FileType, FileTypeRule } from '../types/analyzer.js';

// ── Default File Type Rules ───────────────────────────────────────────

/**
 * Default file type classification rules, sorted by priority.
 * Lower priority number = checked first = higher precedence.
 *
 * For ambiguous filenames (e.g., "testing.instructions.prompt.md"),
 * the classifyFile function will match the rightmost (most specific) suffix.
 */
export const DEFAULT_FILE_TYPE_RULES: readonly FileTypeRule[] = [
  {
    priority: 1,
    pattern: /^skill\.md$/i,
    type: 'skill',
    description: 'SKILL.md marker file for skill directories',
  },
  {
    priority: 2,
    pattern: /^copilot-instructions\.md$/i,
    type: 'copilot-instruction',
    description: 'Root/.github copilot-instructions.md special file',
  },
  {
    priority: 3,
    pattern: /\.instructions?\.md$/i,
    type: 'instruction',
    description: 'Files ending with .instructions.md or .instruction.md',
  },
  {
    priority: 4,
    pattern: /\.prompt\.md$/i,
    type: 'prompt',
    description: 'Files ending with .prompt.md',
  },
  {
    priority: 5,
    pattern: /\.agent\.md$/i,
    type: 'agent',
    description: 'Files ending with .agent.md',
  },
  {
    priority: 6,
    pattern: /\.cookbook\.md$/i,
    type: 'cookbook',
    description: 'Files ending with .cookbook.md',
  },
];

// ── Default Excluded Directories ──────────────────────────────────────

/**
 * Default list of directory prefixes to exclude during analysis.
 * Based on RQ-7 from research.md.
 */
export const DEFAULT_EXCLUDED_DIRECTORIES: readonly string[] = [
  '.git/',
  'node_modules/',
  '.github/workflows/',
  'dist/',
  'build/',
  '__pycache__/',
  '.venv/',
  '.env/',
  'vendor/',
  'coverage/',
  '.next/',
  '.nuxt/',
  'out/',
  'target/',
  'bin/',
  'obj/',
];

// ── File Classification ───────────────────────────────────────────────

/**
 * Classifies a file based on naming conventions.
 *
 * For ambiguous filenames (e.g., "testing.instructions.prompt.md"),
 * matches the rightmost (most specific) suffix by:
 * 1. Trying all patterns that match
 * 2. Selecting the one that matches furthest to the right
 * 3. If multiple match at same position, using priority
 *
 * @param fileName - The filename to classify
 * @param rules - Optional custom rules (defaults to DEFAULT_FILE_TYPE_RULES)
 * @returns The matched FileType, or undefined if no rule matches
 *
 * @example
 * classifyFile('SKILL.md') // => 'skill'
 * classifyFile('copilot-instructions.md') // => 'copilot-instruction'
 * classifyFile('python.instructions.md') // => 'instruction'
 * classifyFile('generate.prompt.md') // => 'prompt'
 * classifyFile('testing.instructions.prompt.md') // => 'prompt' (rightmost match)
 * classifyFile('guide.agent.cookbook.md') // => 'cookbook' (rightmost match)
 * classifyFile('README.md') // => undefined
 */
export function classifyFile(
  fileName: string,
  rules: readonly FileTypeRule[] = DEFAULT_FILE_TYPE_RULES
): FileType | undefined {
  // Track all matching rules with their match positions
  const matches: Array<{
    rule: FileTypeRule;
    matchIndex: number;
  }> = [];

  for (const rule of rules) {
    const match = fileName.match(rule.pattern);
    if (match) {
      // For exact matches (^...$), matchIndex is 0
      // For suffix matches, we want the position where the match starts
      const matchIndex = match.index ?? 0;
      matches.push({ rule, matchIndex });
    }
  }

  if (matches.length === 0) {
    return undefined;
  }

  // Sort by match position (rightmost first), then by priority
  matches.sort((a, b) => {
    // Higher matchIndex (further right) comes first
    if (b.matchIndex !== a.matchIndex) {
      return b.matchIndex - a.matchIndex;
    }
    // Same position: lower priority number comes first
    return a.rule.priority - b.rule.priority;
  });

  // Return the type from the best match
  return matches[0].rule.type;
}
