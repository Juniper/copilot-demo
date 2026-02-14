# Quickstart: Repository Structure Analysis

**Feature**: 001-repo-structure-analysis  
**Date**: 2026-02-13

## What This Feature Does

Adds automatic structure discovery and file type classification to `@awesome-palette/core` so that custom repositories are analyzed dynamically — regardless of how their directories are named — using file naming conventions as the authoritative type signal.

## How It Works

### 1. Auto-Discovery (default behavior)

When a repository is indexed without path overrides, `RepositoryManager` delegates to `StructureAnalyzer`:

```typescript
import { RepositoryManager, createDefaultConfig } from '@awesome-palette/core';

const config = createDefaultConfig({
  remoteRepositories: [
    {
      owner: 'my-org',
      repo: 'my-copilot-configs',
      branch: 'main',
      enabled: true
      // No pathOverrides → auto-discovery kicks in
    }
  ]
});

const repoManager = new RepositoryManager(logger, config);
const indexes = await repoManager.indexAllRepositories();

// The index now contains files discovered from ANY directory
// in the repo, classified by naming convention
for (const [key, index] of indexes) {
  console.log(`${key}: ${index.stats.totalFiles} files found`);

  // Access the structure analysis result
  if (index.structureAnalysis) {
    console.log(`  Directories scanned: ${index.structureAnalysis.scannedDirectories.length}`);
    console.log(`  Warnings: ${index.structureAnalysis.warnings.length}`);
    console.log(`  Usable: ${index.structureAnalysis.isUsable}`);
  }
}
```

### 2. With Path Overrides

For repositories where you know the exact structure:

```typescript
const config = createDefaultConfig({
  remoteRepositories: [
    {
      owner: 'my-org',
      repo: 'my-copilot-configs',
      branch: 'main',
      enabled: true,
      pathOverrides: {
        instructions: 'custom-instructions',
        prompts: 'my-prompts'
        // agents, skills, cookbooks → auto-discovered
      }
    }
  ]
});
```

### 3. Using StructureAnalyzer Directly

For programmatic analysis without the full indexing pipeline:

```typescript
import { StructureAnalyzer } from '@awesome-palette/core';

const analyzer = new StructureAnalyzer(logger, apiRequestFn);

const result = await analyzer.analyze('my-org', 'my-copilot-configs', 'main', {
  maxScanDepth: 3
});

// Inspect results
console.log(`Total files: ${result.statistics.totalFiles}`);
console.log(`Instructions: ${result.statistics.instructions}`);
console.log(`Prompts: ${result.statistics.prompts}`);
console.log(`Agents: ${result.statistics.agents}`);
console.log(`Skills: ${result.statistics.skills}`);
console.log(`Cookbooks: ${result.statistics.cookbooks}`);

// Check for root-level Copilot instructions
if (result.rootCopilotInstructions) {
  console.log(`Root copilot-instructions.md found at: ${result.rootCopilotInstructions.path}`);
}

// Review warnings
for (const warning of result.warnings) {
  console.log(`[${warning.severity}] ${warning.code}: ${warning.message}`);
}
```

### 4. Classifying Individual Files

```typescript
const analyzer = new StructureAnalyzer(logger, apiRequestFn);

analyzer.classifyFile('python.instructions.md');     // → 'instruction'
analyzer.classifyFile('code-review.prompt.md');       // → 'prompt'
analyzer.classifyFile('Expert.agent.md');             // → 'agent'
analyzer.classifyFile('SKILL.md');                    // → 'skill' (marker)
analyzer.classifyFile('testing.cookbook.md');          // → 'cookbook'
analyzer.classifyFile('copilot-instructions.md');     // → 'copilot-instruction'
analyzer.classifyFile('README.md');                   // → undefined (no match)
```

## Backward Compatibility

The default `github/awesome-copilot` repository continues to use hardcoded paths (set in `initializeDefaultRepositories()`) — identical to current behavior. The auto-discovery path is only activated when no path fields are set on the `OnlineRepository`.

## Key Types

| Type | Location | Purpose |
|------|----------|---------|
| `StructureAnalysisResult` | `types/analyzer.ts` | Primary analysis output |
| `DiscoveredFile` | `types/analyzer.ts` | A classified file from the analysis |
| `DiscoveredSkill` | `types/analyzer.ts` | A skill directory with its files |
| `DirectoryMapping` | `types/analyzer.ts` | Per-directory type summary |
| `FileTypeRule` | `types/analyzer.ts` | Naming convention → type mapping |
| `AnalysisWarning` | `types/analyzer.ts` | Diagnostic from analysis |
| `AnalyzerConfig` | `types/analyzer.ts` | Depth and exclusion settings |
| `PathOverrides` | `interfaces/Config.ts` | Per-repo directory overrides |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `maxScanDepth` | `3` | Max directory depth for auto-discovery |
| `excludedDirectories` | `.git/`, `node_modules/`, etc. | Skipped directory prefixes |
| `pathOverrides.instructions` | `undefined` | Override instructions directory |
| `pathOverrides.prompts` | `undefined` | Override prompts directory |
| `pathOverrides.agents` | `undefined` | Override agents directory |
| `pathOverrides.skills` | `undefined` | Override skills directory |
| `pathOverrides.cookbooks` | `undefined` | Override cookbooks directory |
