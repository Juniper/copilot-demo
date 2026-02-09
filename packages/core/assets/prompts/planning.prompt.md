---
mode: agent
description: This reusable prompt is used to initiate the planning process for a project.
---

<!--
This instruction file is to be used with Abhishek's workflow, and is used to provide guidance on quick prototyping. The workflow uses a set of instruction files, prompts and chatmodes,
all pipelined together to create documents that help in Copilot implementing an idea into a working project.

Relevant workflow stage files: planning.instructions.md, design.instructions.md, implementation.instructions.md, tasking.instructions.md, testing.instructions.md, review.instructions.md
Relevant design files: uml.md, dataflows.md, sequences.md 

Relevant prompt files: planning.prompt.md, design.prompt.md, taskplan.prompt.md, testplan.prompt.md, review.prompt.md, task.prompt.md

Relevant chatmode files: Plan.chatmode.md, Deep-Planning.chatmode.md, Research.chatmode.md, Code.chatmode.md
--> 

# This reusable prompt is used to guide the planning and design process for a project. The input context is received from the user as a project description, and the output is a detailed plan that includes the project scope, requirements, architecture, technology stack, and timeline.

- For detailed planning instructions, refer to the [planning instructions](../instructions/planning.instructions.md).

- Read the `PROJECT.md` file for the problem statement, project goals, and scope. If it is not provided, ask the user to provide one.
- Gather any additional information or clarifications needed to create a comprehensive plan.
- **DO NOT** display the contents in your response. Just write it directly to the respective files.
