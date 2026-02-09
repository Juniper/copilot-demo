---
description: Instructions for performing a thorough code review.
---

<!--
This instruction file is to be used with Abhishek's workflow, and is used to provide guidance on quick prototyping. The workflow uses a set of instruction files, prompts and chatmodes,
all pipelined together to create documents that help in Copilot implementing an idea into a working project.

Relevant workflow stage files: planning.instructions.md, design.instructions.md, implementation.instructions.md, tasking.instructions.md, testing.instructions.md, review.instructions.md
Relevant design files: uml.md, dataflows.md, sequences.md 

Relevant prompt files: planning.prompt.md, design.prompt.md, taskplan.prompt.md, testplan.prompt.md, review.prompt.md, task.prompt.md

Relevant chatmode files: Plan.chatmode.md, Deep-Planning.chatmode.md, Research.chatmode.md, Code.chatmode.md
-->

# Perform a code review of the selected code. Ensure that the review is thorough and covers all aspects of the code, including functionality, readability, maintainability, and adherence to coding standards. Provide constructive feedback and suggestions for improvement.

# Code Review Checklist

- Adherence to project coding standards.
- Proper error handling and input validation.
- Clear and concise comments for complex logic.
- Avoidance of code duplication.
- Efficient use of resources and performance optimizations.
- Security best practices.

- When reviewing **C/C++ code**, check for:
    - Proper memory management and resource cleanup.
    - Safe handling of pointers and references.
    - Comprehensive error handling and input validation.
    - Clear and concise comments for complex logic.
    - Adherence to project coding standards (naming, formatting).
    - Avoidance of undefined behavior and race conditions.
    - Efficient use of standard library features.

- When reviewing **Python code**, check for:
    - Adherence to PEP 8 style guide.
    - Proper use of Python's built-in features and libraries.
    - Use of type hints for improved readability.
    - Comprehensive test coverage.
    - Avoidance of global variables and mutable default arguments.
    - Efficient use of list comprehensions and generator expressions.
    - Proper error handling using exceptions.
    - Use of context managers for resource management.
    - Avoidance of unnecessary complexity and deep nesting.
    - Use of f-strings for string formatting (Python 3.6+).
    - Proper use of logging instead of print statements for debugging.
    - Use of docstrings for module, class, and function documentation.
    - Avoidance of using `eval()` and `exec()` for security reasons.
    - Use of `__init__.py` files to define package structure and expose necessary modules.
    - Use of relative imports within packages.
    - Use of a centralized logging configuration to manage log levels, formats, and output destinations.
