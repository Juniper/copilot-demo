# Awesome Copilot Palette

Browse and install GitHub Copilot instructions, prompts, agents, skills, and cookbooks from awesome-copilot repositories into your workspace.

## Overview

Awesome Copilot Palette provides a curated catalog of GitHub Copilot customization files. Install reusable instruction files (`.instructions.md`), prompt files (`.prompt.md`), and agent modes (`.agent.md`) into your workspace's `.github/` directory with one click. The extension ships with bundled assets and can fetch additional files from remote GitHub repositories like [github/awesome-copilot](https://github.com/github/awesome-copilot).

## Features

- **Catalog Browser** — Browse all available instructions, prompts, and agents from a sidebar panel or full catalog view
- **One-Click Install** — Install individual files or batch-install multiple files into your workspace's `.github/` directory
- **Remote Repositories** — Fetch additional customization files from configurable GitHub repositories
- **Smart Caching** — Layered caching (local, online, enhanced) with configurable TTLs to minimize API requests
- **Installation Status** — See which catalog files are already installed in your current workspace
- **Conflict Resolution** — Handle file conflicts during installation (overwrite, skip, or rename)

## Quick Start

1. Open the Awesome Copilot Palette view from the Activity Bar (look for the wand icon)
2. Browse available instructions, prompts, agents, and cookbooks
3. Click on any item to view details
4. Click "Install" to add it to your workspace's `.github/` directory
5. Use the files with GitHub Copilot in your project

## Configuration

Configure the extension via VS Code settings (search for "Awesome Palette"):

| Setting | Default | Description |
|---------|---------|-------------|
| `remoteRepositories` | github/awesome-copilot | GitHub repositories to fetch files from |
| `enableOnlineFetching` | true | Enable/disable fetching from remote repositories |
| `githubToken` | (empty) | GitHub PAT for higher API rate limits (optional) |
| `cache.enabled` | true | Enable catalog caching |
| `cache.onlineTtlMs` | 10800000 (3h) | Online catalog cache TTL |
| `cache.enhancedTtlMs` | 1800000 (30m) | Enhanced catalog cache TTL |

### Adding GitHub Token

To increase API rate limits from 60 to 5000 requests/hour:

1. Create a Personal Access Token at https://github.com/settings/tokens
2. No scopes needed (public repositories only)
3. Paste token in VS Code settings under `awesome-palette.githubToken`

## Commands

- **Open Copilot Catalog** — Open the full catalog browser view
- **Refresh Catalog** — Manually refresh the catalog from remote repositories

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

## Troubleshooting

**Extension doesn't appear after installation**
- Reload VS Code (Command Palette → "Developer: Reload Window")
- Ensure VS Code version is 1.85.0 or higher

**Can't see the catalog**
- Check if online fetching is enabled in settings
- Verify network connectivity
- Try "Awesome Palette: Refresh Catalog" command

**API rate limiting issues**
- Add a GitHub Personal Access Token in settings

## Support

For issues or questions, visit the [GitHub repository](https://github.com/abhishek-dwaraki_hpeprod/awesome-palette/issues).

## License

HPE Internal Use Only.
