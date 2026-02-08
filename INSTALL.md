# Installation Guide

## Quick Install (Recommended)

### From GitHub Releases

1. Go to the [Releases page](https://github.com/abhishek-dwaraki_hpeprod/awesome-palette/releases)
2. Download the latest `awesome-palette-vscode-*.vsix` file
3. Open VS Code
4. Open the Extensions view (`Ctrl+Shift+X` on Windows/Linux or `Cmd+Shift+X` on Mac)
5. Click the "..." menu at the top of the Extensions view
6. Select "Install from VSIX..."
7. Choose the downloaded `.vsix` file
8. Reload VS Code when prompted

## Alternative Methods

### From VS Code Marketplace (Coming Soon)

Once published, you'll be able to:
1. Open VS Code Extensions view
2. Search for "Awesome Copilot Palette"
3. Click Install

### Development Install

For contributors or developers who want to work on the extension:

```bash
# Clone the repository
git clone https://github.com/abhishek-dwaraki_hpeprod/awesome-palette.git
cd awesome-palette

# Install dependencies
npm install

# Build all packages
npm run build

# Package the extension
cd packages/vscode
npm run package

# Install the generated .vsix file
code --install-extension awesome-palette-vscode-*.vsix
```

## Verification

After installation, verify the extension is working:

1. Look for the "Awesome Copilot Palette" icon in the Activity Bar (left sidebar)
2. Click it to open the Catalog view
3. You should see available instructions, prompts, agents, and cookbooks

## Configuration

The extension can be configured via VS Code settings. Search for "Awesome Palette" in the settings panel or add to your `settings.json`:

```json
{
  "awesome-palette.remoteRepositories": [
    {
      "owner": "github",
      "repo": "awesome-copilot",
      "branch": "main",
      "enabled": true
    }
  ],
  "awesome-palette.enableOnlineFetching": true,
  "awesome-palette.githubToken": "",
  "awesome-palette.cache.enabled": true,
  "awesome-palette.cache.onlineTtlMs": 10800000,
  "awesome-palette.cache.enhancedTtlMs": 1800000
}
```

## Troubleshooting

### Extension doesn't appear after installation
- Reload VS Code (Command Palette → "Developer: Reload Window")
- Check that your VS Code version is 1.85.0 or higher

### Can't see the catalog
- Check if online fetching is enabled in settings
- Verify network connectivity
- Try refreshing the catalog (Command Palette → "Awesome Palette: Refresh Catalog")

### API rate limiting issues
- Add a GitHub Personal Access Token in settings under `awesome-palette.githubToken`
- This increases your GitHub API rate limit from 60 to 5000 requests/hour

## Uninstallation

1. Open Extensions view
2. Find "Awesome Copilot Palette"
3. Click the gear icon → Uninstall
4. Reload VS Code

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/abhishek-dwaraki_hpeprod/awesome-palette/issues).
