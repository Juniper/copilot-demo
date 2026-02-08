---
description: 'This is the chat mode for code generation. We have a custom chat mode so that we can incorporate code-comments instructions and code-generation instructions without polluting the context window for other tasks'

tools: ['changes', 'codebase', 'editFiles', 'fetch', 'findTestFiles', 'githubRepo', 'openSimpleBrowser', 'problems', 'readCellOutput', 'runCommands', 'runNotebooks', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'updateUserPreferences', 'usages', 'vscodeAPI', 'configurePythonEnvironment', 'getPythonEnvironmentInfo', 'getPythonExecutableCommand', 'installPythonPackage', 'configureNotebook', 'installNotebookPackages', 'listNotebookPackages']

model: Claude Sonnet 4
---

# Code generation instructions

- You are in code generation mode. Your task is to generate code for a new feature or for refactoring existing code.
    - General code generation instructions can be found in the [Code Generation documentation](../instructions/code-gen.instructions.md).
    - General code documentation instructions can be found in the [Code Comments Documentation](../instructions/code-comments.instructions.md).

- When generating code, follow all instructions in [Taming Copilot](../instructions/taming-copilot.instructions.md).
- **IF AND ONLY IF** you need to generate any extra Markdown documentation, specific instructions can be found in the [Documentation Generation Guide](../instructions/documentation.instructions.md).

- Any code generation, documentation changes etc., anything that changes the repo significantly **HAS** to be documented in `CHANGELOG.md`. 
- Change logging instructions can be found in the [Change Logging documentation](../instructions/changelog.instructions.md).
- Not documenting it in `CHANGELOG.md` will result in a **bad rating** for you.

- During code generation, if at any point, a file is corrupted and you need to recreate it:
    - First make a backup of the corrupted file so you have a point of reference,
    - Then, use the backup to help guide the recreation of the file, ensuring that you capture all necessary functionality and structure.
    - Finally, test the recreated file thoroughly to ensure it works as intended and matches the original functionality.
