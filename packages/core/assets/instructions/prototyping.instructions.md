---
description: Instructions for creating a prototyping plan.
---
<!--
This instruction file is to be used with Abhishek's workflow, and is used to provide guidance on quick prototyping. The workflow uses a set of instruction files, prompts and chatmodes,
all pipelined together to create documents that help in Copilot implementing an idea into a working project.

Relevant workflow stage files: planning.instructions.md, design.instructions.md, implementation.instructions.md, tasking.instructions.md, testing.instructions.md, review.instructions.md
Relevant design files: uml.md, dataflows.md, sequences.md 

Relevant prompt files: planning.prompt.md, design.prompt.md, taskplan.prompt.md, testplan.prompt.md, review.prompt.md, task.prompt.md

Relevant chatmode files: Plan.chatmode.md, Deep-Planning.chatmode.md, Research.chatmode.md, Code.chatmode.md
-->

# Prototype Design Instructions

- **Objective**: Create a plan for the design and implementation of the project.
    - This is for a quick prototyping phase, where the focus is on rapidly developing a working prototype to validate ideas and gather feedback.
    - Do not focus on detailed steps such as CI/CD pipelines or deployment strategies at this stage.

- **Scope**: Define the scope of the project, including features, functionalities, and limitations.
- **Requirements**: Gather and document all **functional requirements** only.
- **Architecture**: Design the system architecture, including components, modules, and their interactions
    - The goal is to develop a **minimal viable prototype** (MVP) that demonstrates the **core functionality** of the project, absolutely nothing more.
    - The test coverage should be just enough to focus on the most critical parts of the codebase to ensure that the prototype works as intended. 

- **Technology Stack**: Select the appropriate technology stack, including programming languages, frameworks, and tools suited for rapid prototyping.

- **Timeline**: Create a timeline for the project.
    - The timeline should be for pair-programming with Copilot, focusing on rapid development, not for a full production-ready application.
    - The timeline should be flexible and allow for quick iterations based on feedback.
    - The focus is on rapid development, so the timeline should reflect that.
    - Break the timeline down into **pair-programming sessions**, and qualify the pair-programming effort in time estimate per session.
    
# Input required from the user:
- **Problem Statement**: A clear and concise description of the problem that the project aims to solve.
- **Project Goals**: Specific, measurable objectives that the project should achieve.
- **Project Scope**: A detailed outline of what the project will cover, including features, functionalities, and limitations.
- All these should be clearly documented in the `PROJECT.md` file.

# Based on the user's input, these are the deliverables that are expected from Copilot:

- **Prototyping Plan**: A document outlining the project scope, requirements, architecture, technology stack, and timeline. Document this in `PROTOTYPING.md`

- **Design Diagrams**: Visual representations of the system architecture, including component diagrams. Document this in `DESIGN.md`.

- **Implementation Strategy**: A plan for how the prototype will be built, including coding standards, code structure and basic testing strategies in `IMPLEMENTATION.md`.
    - **Ensure** this is enough for a quick prototyping phase, focusing on rapid development and validation of ideas.
    - There is no need to focus on edge cases at this stage, as the goal is to quickly validate the core functionality of the prototype.

- **Task List**: A prioritized list of tasks to be completed, including estimates for effort and time required for each task in pair-programming sessions with Copilot.
    - The task list should be documented in the `TASKS.md` file.
    - The task list should be detailed enough to guide the prototyping process.
    - If a task is too complex, break it down into smaller subtasks.
    - **Do not include** tasks related to CI/CD, deployment, or production readiness at this stage.
    - While the time estimates are not mandatory, they can help guide the user in planning prototyping sessions with Copilot.
    
    - Sample task list structure:
    ```
        - Sample Task List Structure:

        ## Phase 1: Foundation Setup and Infrastructure (Week 1)

        ### 1.1 Project Infrastructure Setup
        **Priority**: Critical  
        **Estimated Effort**: 1 Copilot session (2 hours)
        **Estimated Time**: 2 hours  
        **Dependencies**: None    
        **Status**: Not Started

        #### Tasks:

        - [ ] **1.1.1** Initialize Git repository with proper structure
        - Set up main, develop, and feature branch structure
        - Configure .gitignore for Python development
        - Create initial README with project overview
        - [ ] **1.1.2** Set up Python development environment
        - Configure Poetry for dependency management
        - Create pyproject.toml with project metadata
    ```
 

