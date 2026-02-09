---
mode: 'agent'
tools: ['create_and_submit_pull_request_review']
description: This prompt is designed to help developers create clear and concise commit messages that follow best practices and conventions. It also calls the MCP server to create and submit a pull request review.
---

# Commit Message Guidelines

- Keep commits atomic and focused on single changes
- Start with a capital letter and use the present tense.
- Keep the subject line under 50 characters.
- Separate subject from body with a blank line.
- Reference relevant Jira ticket numbers if applicable.
- In the body, explain the motivation and context for the change.
- Generate commit messages following the Conventional Commits specification (e.g., `feat(api): add user endpoint`). 
- Use the following format for commit messages:
  ```
  <type>(<scope>): <subject>

  <body>
  ```
  Where:
  - `<type>` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, or `chore`.
  - `<scope>` is optional and describes the area of the codebase affected.
  - `<subject>` is a brief description of the change.
  - `<body>` provides additional context or details about the change.
- Use imperative mood. Infer type (feat, fix, chore, refactor, test, docs) and scope from the changes.
- Update `.gitignore` for new build artifacts or dependencies.
