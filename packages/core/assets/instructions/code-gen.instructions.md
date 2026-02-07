## Adhere to Code Quality Standards

### Clarity & Readability
- Use descriptive names
- Keep functions concise and single-purpose
- Follow style guides (e.g., PEP 8, Prettier)
- Focus on readability over cleverness

### Consistency
- Follow existing project patterns, conventions, and technology choices

### Robust Error Handling
- Anticipate failures (I/O, network, input)
- Use appropriate mechanisms (try-catch, specific exceptions)
- Provide informative error messages

### Security
- Sanitize inputs
- Manage secrets securely (env vars/config tools)
- Vet external libraries
- Check the code for vulnerabilities after generating it

### Testability
- Design for testability (e.g., dependency injection)

### Documentation
- Comment complex/non-obvious code
- Use standard formats (JSDoc, DocStrings)

## Code Structure & Modularity
- **Max 500 lines per file** - refactor into modules/helpers if exceeded
- **Organize by feature/responsibility** into clearly separated modules

## Error Handling & Logging
- Use logging/debugger, **not print statements**
- **No `assert` in production** - use exceptions/error handling
- **Structured logging** with consistent format and appropriate levels:
  - DEBUG: detailed diagnostics
  - INFO: general flow
  - WARNING: recoverable issues
  - ERROR: serious issues
  - CRITICAL: immediate action required
- **Meaningful log messages** with context (function names, parameters, error details)
- **Use a logging library** 
  - If not present, use a well-known, performant library
  - If present, stick to project's existing library
- **Exception handling**: catch specific exceptions, log details, provide meaningful messages

- Use the following instructions **IF AND ONLY IF** you have been given a project planning task, not a prototyping task:
  - **Configure via environment variables** (levels, destinations)
  - **Implement**: log rotation, unique logger names, filters, handlers, formatters, context managers, correlation IDs
  - **Never log sensitive data** (passwords, tokens, personal info)
  - **Centralized logging configuration**
  - **Minimal `try`/`except`** blocks to avoid masking issues
  - **Log stack traces** for debugging (hide from end-users)
  - You will be penalized with a low score if you use this for prototyping tasks.

## Style & Conventions
- **Default to Python** unless specified in `PLANNING.md`, `PROTOTYPING.md` or context dictates otherwise

[//]: # (- **Use Context7** for current framework/library/API documentation)

- **Follow language-specific style guides**
  - PEP 8 for Python
  - Google C++ Style Guide for C++
- **Follow existing conventions** when working with established codebases
- **Ask for documentation** when unfamiliar with user's packages
- **Suggest better alternatives** when aware of more performant/suitable packages