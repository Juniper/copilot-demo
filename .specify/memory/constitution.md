<!--
Sync Impact Report — Constitution v1.0.0
────────────────────────────────────────────────────────────────────────
Version Change: Template → v1.0.0 (Initial Ratification)
Date: 2026-02-13

Defined Principles:
  1. Platform-Agnostic Library First (NEW)
  2. Lightweight Testing (NEW)
  3. Dependency Direction Rule (NEW)
  4. Strict TypeScript Required (NEW)
  5. Pre-1.0 Flexibility (NEW)

Pending Sections (Deferred to Next Iteration):
  - Security & Privacy Requirements
  - Documentation Standards
  - Performance & Quality Attributes

Template Sync Status:
  ✅ spec-template.md — Compatible (no updates required)
  ✅ plan-template.md — Constitution Check section matches new principles
  ✅ tasks-template.md — Task execution respects dependency direction
  ⚠️  Additional sections pending — Will require constitution v1.1.0 after next iteration

Follow-up Actions:
  - Define Governance amendment process in next iteration
  - Add Security/Privacy section for GitHub token handling
  - Add Documentation requirements (README, API docs, inline comments)
────────────────────────────────────────────────────────────────────────
-->

# Awesome Copilot Palette Constitution

## Core Principles

### I. Platform-Agnostic Library First

All business logic MUST live in `@awesome-palette/core` as a platform-independent library. The core package MUST NOT depend on VS Code APIs, Node.js filesystem modules, or any platform-specific runtime.

**Requirements:**
- Core classes accept Logger, FileSystem, and Config abstractions via constructor injection
- Platform adapters (vscode, cli) inject concrete implementations
- No direct imports of `vscode`, `fs`, `path` (Node.js), or other platform modules in core
- All core functionality MUST be testable without platform dependencies

**Rationale:** Enables multi-platform deployment (VS Code extension, CLI tool, web application, other editors), simplifies testing through dependency injection, and enforces clear architectural boundaries between business logic and platform concerns.

### II. Lightweight Testing

Integration tests cover major workflows. Unit tests target bug fixes and complex logic. No coverage mandates or TDD requirements at this stage.

**Requirements:**
- Integration tests for primary user flows (catalog fetch, file installation, caching)
- Unit tests for bug fixes (regression prevention)
- Unit tests for complex algorithms (caching logic, conflict resolution)
- Test scripts defined in package.json for each package

**Rationale:** Minimal testing overhead during rapid early development while protecting critical paths. As the project matures, this principle can evolve toward stricter coverage requirements (upgrade path to 60%+ core coverage exists).

### III. Dependency Direction Rule

Dependencies MUST flow outward from core to adapters. The core package remains adapter-free.

**Dependency Graph:**
```
@awesome-palette/core  ← Base layer (no dependencies on adapters)
         ↑
         |
    ┌────┴────┐
    ↓         ↓
  vscode     cli  ← Adapter layer (depends on core)
```

**Requirements:**
- `@awesome-palette/core` MUST NOT import from `vscode` or `cli` packages
- Adapters (vscode, cli) MAY depend on core via published exports only
- Shared utilities belong in core, not duplicated across adapters
- New packages require architecture review to verify dependency direction

**Rationale:** Prevents circular dependencies, enforces clean layering, and maintains core portability. Violations break the platform-agnostic guarantee.

### IV. Strict TypeScript Required

All packages MUST use TypeScript strict mode with complete type definitions for public APIs.

**Requirements:**
- `strict: true` enabled in all tsconfig.json files
- No `any` types except for genuine opaque external data (GitHub API responses, VS Code API interop during migration)
- Public APIs MUST export complete type definitions
- ESLint + Prettier configurations enforced via pre-commit hooks
- Type-check passes before merge (`npm run check-types` in CI)

**Rationale:** Strong type safety catches bugs at compile time, provides excellent IDE autocomplete for consumers, and serves as living documentation for API contracts. Strict TypeScript reduces runtime errors and improves maintainability.

### V. Pre-1.0 Flexibility

All packages remain 0.x while the API surface stabilizes. Breaking changes are allowed freely with documentation.

**Requirements:**
- Core package follows 0.MINOR.PATCH versioning (currently 0.1.0)
- VS Code extension follows 0.MAJOR.MINOR (currently 0.7.0)
- Breaking changes in core MUST be documented in CHANGELOG.md with migration notes
- Lock to 1.0.0 once API contracts are stable and battle-tested
- Post-1.0: Adopt strict SemVer with deprecation cycles for breaking changes

**Rationale:** Enables fast iteration and API refinement during early development without the burden of deprecation cycles. Users understand 0.x signals instability. Once mature, SemVer provides stability guarantees.

## Governance

**Status:** Initial ratification — Full governance process to be defined in v1.1.0

**Amendment Process (Temporary):**
- Constitution changes require explicit discussion and approval
- Version bumps follow SemVer rules applied to the constitution itself:
  - MAJOR: Removing or fundamentally redefining a core principle
  - MINOR: Adding new principles or expanding sections (Security, Documentation)
  - PATCH: Clarifications, typo fixes, wording improvements
- Amendments update LAST_AMENDED_DATE and increment version

**Compliance:**
- SpecKit workflows (`/speckit.plan`, `/speckit.analyze`) verify constitution alignment
- PRs should reference constitution principles when making architectural decisions
- Principle violations require explicit justification or constitution amendment

**Pending Governance Sections (v1.1.0):**
- Security & Privacy Requirements (GitHub token handling, data protection)
- Documentation Standards (README structure, API docs, inline comment rules)
- Performance & Quality Attributes (bundle size, response time targets)
- Formal amendment approval process

**Version**: 1.0.0 | **Ratified**: 2026-02-13 | **Last Amended**: 2026-02-13
