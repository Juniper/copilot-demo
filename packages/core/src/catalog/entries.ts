/**
 * Default catalog entries — hardcoded instruction, chatmode, and prompt metadata.
 * Extracted from Project-Olorin's CustomInstructionsCatalog for reuse in
 * the platform-agnostic awesome-palette core.
 */

import type { CatalogEntry } from '../types/catalog.js';

// ---------------------------------------------------------------------------
// Language-specific instructions
// ---------------------------------------------------------------------------
const languageInstructions: CatalogEntry[] = [
	{
		id: 'python-instructions',
		name: 'Python Development Standards',
		type: 'instruction',
		category: 'language',
		description: 'Python development standards and best practices',
		filePath: 'instructions/python.instructions.md',
		metadata: { languages: ['python'], projectTypes: ['web', 'cli', 'library', 'data'] }
	},
	{
		id: 'cpp-instructions',
		name: 'C++ Coding Conventions',
		type: 'instruction',
		category: 'language',
		description: 'C++ coding conventions and guidelines',
		filePath: 'instructions/cpp.instructions.md',
		metadata: { languages: ['cpp', 'c'], projectTypes: ['desktop', 'library', 'embedded'] }
	},
	{
		id: 'go-instructions',
		name: 'Go Development Idioms',
		type: 'instruction',
		category: 'language',
		description: 'Go idioms and best practices',
		filePath: 'instructions/go.instructions.md',
		metadata: { languages: ['go'], projectTypes: ['web', 'cli', 'microservice'] }
	}
];

// ---------------------------------------------------------------------------
// Framework / Domain-specific instructions
// ---------------------------------------------------------------------------
const domainInstructions: CatalogEntry[] = [
	{
		id: 'algorithms-instructions',
		name: 'Algorithm Implementation Guidelines',
		type: 'instruction',
		category: 'domain',
		description: 'Algorithm implementation guidelines',
		filePath: 'instructions/algorithms.instructions.md',
		metadata: { characteristics: ['algorithmic', 'performance-critical'] }
	},
	{
		id: 'kubernetes-instructions',
		name: 'Kubernetes Deployment Practices',
		type: 'instruction',
		category: 'domain',
		description: 'K8s deployment practices',
		filePath: 'instructions/kubernetes-deployment.instructions.md',
		metadata: { characteristics: ['containerized', 'cloud-native'], frameworks: ['kubernetes'] }
	},
	{
		id: 'performance-instructions',
		name: 'Performance Optimization Guidelines',
		type: 'instruction',
		category: 'domain',
		description: 'Performance tuning guidelines',
		filePath: 'instructions/performance-optimization.instructions.md',
		metadata: { characteristics: ['performance-critical', 'high-load'] }
	},
	{
		id: 'testing-instructions',
		name: 'Testing Strategies and Patterns',
		type: 'instruction',
		category: 'domain',
		description: 'Testing strategies and patterns',
		filePath: 'instructions/testing.instructions.md',
		metadata: { characteristics: ['test-driven', 'quality-focused'] }
	},
	{
		id: 'design-instructions',
		name: 'System Design Principles',
		type: 'instruction',
		category: 'domain',
		description: 'System design principles',
		filePath: 'instructions/design.instructions.md',
		metadata: { projectTypes: ['web', 'microservice', 'fullstack'], characteristics: ['architectural'] }
	},
	{
		id: 'documentation-instructions',
		name: 'Documentation Standards',
		type: 'instruction',
		category: 'process',
		description: 'Documentation standards',
		filePath: 'instructions/documentation.instructions.md',
		metadata: { characteristics: ['documentation-heavy', 'open-source'] }
	}
];

// ---------------------------------------------------------------------------
// Development process instructions
// ---------------------------------------------------------------------------
const processInstructions: CatalogEntry[] = [
	{
		id: 'code-gen-instructions',
		name: 'Code Generation Guidelines',
		type: 'instruction',
		category: 'process',
		description: 'Code generation guidelines',
		filePath: 'instructions/code-gen.instructions.md',
		metadata: { characteristics: ['automated', 'templated'] }
	},
	{
		id: 'code-comments-instructions',
		name: 'Code Commenting Standards',
		type: 'instruction',
		category: 'process',
		description: 'Code commenting standards',
		filePath: 'instructions/code-comments.instructions.md',
		metadata: { characteristics: ['maintainable', 'documented'] }
	},
	{
		id: 'review-instructions',
		name: 'Code Review Practices',
		type: 'instruction',
		category: 'process',
		description: 'Code review practices',
		filePath: 'instructions/review.instructions.md',
		metadata: { characteristics: ['collaborative', 'quality-focused'] }
	},
	{
		id: 'planning-instructions',
		name: 'Project Planning Methodologies',
		type: 'instruction',
		category: 'process',
		description: 'Project planning methodologies',
		filePath: 'instructions/planning.instructions.md',
		metadata: { characteristics: ['planning-intensive', 'structured'] }
	},
	{
		id: 'research-instructions',
		name: 'Research and Investigation Techniques',
		type: 'instruction',
		category: 'process',
		description: 'Research and investigation techniques',
		filePath: 'instructions/research.instructions.md',
		metadata: { characteristics: ['research-oriented', 'exploratory'] }
	},
	{
		id: 'tasking-instructions',
		name: 'Task Breakdown and Management',
		type: 'instruction',
		category: 'process',
		description: 'Task breakdown and management',
		filePath: 'instructions/tasking.instructions.md',
		metadata: { characteristics: ['task-oriented', 'structured'] }
	},
	{
		id: 'changelog-instructions',
		name: 'Change Documentation Practices',
		type: 'instruction',
		category: 'process',
		description: 'Change documentation practices',
		filePath: 'instructions/changelog.instructions.md',
		metadata: { characteristics: ['versioned', 'documented'] }
	},
	{
		id: 'taming-copilot-instructions',
		name: 'GitHub Copilot Optimization',
		type: 'instruction',
		category: 'tools',
		description: 'GitHub Copilot optimization',
		filePath: 'instructions/taming-copilot.instructions.md',
		metadata: { characteristics: ['ai-assisted', 'copilot-optimized'] }
	},
	{
		id: 'prototyping-instructions',
		name: 'Rapid Prototyping Approaches',
		type: 'instruction',
		category: 'process',
		description: 'Rapid prototyping approaches',
		filePath: 'instructions/prototyping.instructions.md',
		metadata: { characteristics: ['prototype', 'rapid-development'] }
	},
	{
		id: 'sequences-instructions',
		name: 'Sequence Diagram Creation',
		type: 'instruction',
		category: 'documentation',
		description: 'Sequence diagram creation',
		filePath: 'instructions/sequences.instructions.md',
		metadata: { characteristics: ['documented', 'visual'] }
	},
	{
		id: 'uml-instructions',
		name: 'UML Diagram Standards',
		type: 'instruction',
		category: 'documentation',
		description: 'UML diagram standards',
		filePath: 'instructions/uml.instructions.md',
		metadata: { characteristics: ['documented', 'visual', 'architectural'] }
	}
];

// ---------------------------------------------------------------------------
// Agents (formerly chat modes)
// ---------------------------------------------------------------------------
const agents: CatalogEntry[] = [
	{
		id: 'code-agent',
		name: 'Code Development Assistant',
		type: 'agent',
		category: 'general',
		description: 'Focused coding assistance mode',
		filePath: 'agents/Code.agent.md',
		metadata: { projectTypes: ['web', 'cli', 'library', 'desktop', 'mobile'] }
	},
	{
		id: 'expert-explainer-agent',
		name: 'Expert Technical Explainer',
		type: 'agent',
		category: 'learning',
		description: 'Detailed technical explanations',
		filePath: 'agents/Expert-Explainer.agent.md',
		metadata: { characteristics: ['learning-oriented', 'explanatory'] }
	},
	{
		id: 'deep-planning-agent',
		name: 'Deep Planning Specialist',
		type: 'agent',
		category: 'planning',
		description: 'Comprehensive project planning',
		filePath: 'agents/Deep-Planning.agent.md',
		metadata: { characteristics: ['planning-intensive', 'strategic'] }
	}
];

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const prompts: CatalogEntry[] = [
	{
		id: 'code-review-prompt',
		name: 'Code Review Template',
		type: 'prompt',
		category: 'review',
		description: 'Code review template',
		filePath: 'prompts/code-review.prompt.md',
		metadata: { characteristics: ['review-focused', 'quality-assurance'] }
	},
	{
		id: 'design-prompt',
		name: 'System Design Template',
		type: 'prompt',
		category: 'design',
		description: 'System design template',
		filePath: 'prompts/design.prompt.md',
		metadata: { characteristics: ['architectural', 'design-focused'] }
	},
	{
		id: 'planning-prompt',
		name: 'Project Planning Template',
		type: 'prompt',
		category: 'planning',
		description: 'Project planning template',
		filePath: 'prompts/planning.prompt.md',
		metadata: { characteristics: ['planning-intensive'] }
	},
	{
		id: 'testplan-prompt',
		name: 'Test Planning Template',
		type: 'prompt',
		category: 'testing',
		description: 'Test planning template',
		filePath: 'prompts/testplan.prompt.md',
		metadata: { characteristics: ['test-driven', 'quality-focused'] }
	},
	{
		id: 'python-unittests-prompt',
		name: 'Python Unit Test Generation',
		type: 'prompt',
		category: 'testing',
		description: 'Python unit test generation',
		filePath: 'prompts/python-unittests.prompt.md',
		metadata: { languages: ['python'], characteristics: ['test-driven'] }
	},
	{
		id: 'cpp-unittests-prompt',
		name: 'C++ Unit Test Generation',
		type: 'prompt',
		category: 'testing',
		description: 'C++ unit test generation',
		filePath: 'prompts/cpp-unittests.prompt.md',
		metadata: { languages: ['cpp', 'c'], characteristics: ['test-driven'] }
	},
	{
		id: 'commit-message-prompt',
		name: 'Git Commit Message Template',
		type: 'prompt',
		category: 'version-control',
		description: 'Git commit message template',
		filePath: 'prompts/commit-message.prompt.md',
		metadata: { characteristics: ['version-controlled', 'documented'] }
	},
	{
		id: 'task-prompt',
		name: 'Task Breakdown Template',
		type: 'prompt',
		category: 'planning',
		description: 'Task breakdown template',
		filePath: 'prompts/task.prompt.md',
		metadata: { characteristics: ['task-oriented', 'structured'] }
	},
	{
		id: 'prototyping-prompt',
		name: 'Rapid Prototyping Template',
		type: 'prompt',
		category: 'development',
		description: 'Rapid prototyping template',
		filePath: 'prompts/prototyping.prompt.md',
		metadata: { characteristics: ['prototype', 'rapid-development'] }
	}
];

// ---------------------------------------------------------------------------
// Cookbooks (recipes and code snippets)
// ---------------------------------------------------------------------------
const cookbooks: CatalogEntry[] = [
	{
		id: 'api-design-cookbook',
		name: 'API Design Cookbook',
		type: 'cookbook',
		category: 'design',
		description: 'API design patterns and best practices',
		filePath: 'cookbooks/api-design.cookbook.md',
		metadata: { projectTypes: ['web', 'microservice'], characteristics: ['api-focused'] }
	},
	{
		id: 'testing-cookbook',
		name: 'Testing Strategies Cookbook',
		type: 'cookbook',
		category: 'testing',
		description: 'Testing patterns, strategies, and examples',
		filePath: 'cookbooks/testing.cookbook.md',
		metadata: { characteristics: ['test-driven', 'quality-focused'] }
	},
	{
		id: 'performance-cookbook',
		name: 'Performance Optimization Cookbook',
		type: 'cookbook',
		category: 'optimization',
		description: 'Performance optimization techniques and patterns',
		filePath: 'cookbooks/performance.cookbook.md',
		metadata: { characteristics: ['performance-focused'] }
	}
];

// ---------------------------------------------------------------------------
// Combined default export
// ---------------------------------------------------------------------------

/**
 * All built-in catalog entries shipped with awesome-palette core.
 * Order: language instructions, domain instructions, process instructions,
 *        agents, prompts, cookbooks.
 */
export const defaultCatalogEntries: CatalogEntry[] = [
	...languageInstructions,
	...domainInstructions,
	...processInstructions,
	...agents,
	...prompts,
	...cookbooks
];
