# Awesome Copilot Palette

A VS Code extension and CLI for browsing, managing, and installing curated GitHub Copilot instructions, prompts, and agent modes into your projects.

## Overview

Awesome Copilot Palette provides a catalog of reusable Copilot customization files — instruction files (`.instructions.md`), prompt files (`.prompt.md`), and agent modes (`.agent.md`) — that can be installed into any workspace. It ships with a curated set of bundled assets and can fetch additional files from remote GitHub repositories (e.g., [github/awesome-copilot](https://github.com/github/awesome-copilot)).

## Installation

### Quick Install from GitHub Releases

1. Go to the [Releases page](https://github.com/abhishek-dwaraki_hpeprod/awesome-palette/releases)
2. Download the latest `awesome-palette-vscode-*.vsix` file
3. Open VS Code → Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click "..." menu → "Install from VSIX..." → Select downloaded file
5. Reload VS Code

For detailed installation instructions, troubleshooting, and alternative methods, see [INSTALL.md](./INSTALL.md).

## Features

- **Catalog Browser** — Browse all available instructions, prompts, and agents from a sidebar panel or full catalog view
- **One-Click Install** — Install individual files or batch-install multiple files into your workspace's `.github/` directory
- **Remote Repositories** — Fetch additional customization files from configurable GitHub repositories
- **Smart Caching** — Layered caching (local, online, enhanced) with configurable TTLs to minimize API requests
- **Installation Status** — See which catalog files are already installed in your current workspace
- **Conflict Resolution** — Handle file conflicts during installation (overwrite, skip, or rename)

## Project Structure

This is a monorepo with three packages:

```
packages/
├── core/       # Platform-agnostic library: catalog, repository, installer
├── vscode/     # VS Code extension: sidebar, webview, commands
└── cli/        # Command-line interface (planned)
```

### `@awesome-palette/core`

The core library containing all business logic with no VS Code dependencies:

- **CatalogManager** — Manages the catalog of available files (local + remote), with caching
- **RepositoryManager** — Fetches and indexes files from GitHub repositories via the API
- **FileInstaller** — Handles installing catalog files into a target workspace directory

### `awesome-palette-vscode`

The VS Code extension providing the UI:

- **SidebarProvider** — Lightweight sidebar view with catalog summary statistics
- **CatalogWebviewProvider** — Full catalog browser with search, filtering, and installation
- Two commands: `Open Copilot Catalog` and `Refresh Catalog`

### `awesome-palette-cli`

Command-line interface for using the catalog outside of VS Code. (Planned)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- VS Code >= 1.85.0 (for the extension)

### Build

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:core
npm run build:vscode
```

### Development

```bash
# Type-check all packages
npm run check-types

# Watch mode for the VS Code extension
cd packages/vscode && npm run watch
```

To test the extension, open the monorepo in VS Code and press `F5` to launch an Extension Development Host.

## Configuration

The extension exposes the following settings under `awesome-palette.*`:

| Setting | Default | Description |
|---------|---------|-------------|
| `remoteRepositories` | `[{owner: "github", repo: "awesome-copilot", branch: "main", enabled: true}]` | GitHub repositories to fetch files from |
| `enableOnlineFetching` | `true` | Enable/disable fetching from remote repositories |
| `githubToken` | `""` | GitHub PAT for higher API rate limits (optional) |
| `cache.enabled` | `true` | Enable catalog caching |
| `cache.onlineTtlMs` | `10800000` (3h) | Online catalog cache TTL |
| `cache.enhancedTtlMs` | `1800000` (30m) | Enhanced catalog cache TTL |

## Bundled Assets

The extension ships with a curated set of files covering:

- **Language-specific instructions** — Python, C++, Go
- **Domain instructions** — Algorithms, Kubernetes, Performance, Testing, Design, Documentation
- **Process instructions** — Code generation, Code comments, Code review, Planning, Research, Tasking, Changelog, Prototyping, Sequence diagrams, UML
- **Agents** — Code Development Assistant, Expert Technical Explainer, Deep Planning Specialist
- **Prompts** — Code review, System design, Project planning, Test planning, Unit tests (Python/C++), Commit messages, Task breakdown, Prototyping

## License

HPE Internal Use Only.
