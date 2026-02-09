---
mode: agent
description: This reusable prompt is used to develop a test plan on either a component basis or for the entire project.
---

<!--
This instruction file is to be used with Abhishek's workflow, and is used to provide guidance on quick prototyping. The workflow uses a set of instruction files, prompts and chatmodes,
all pipelined together to create documents that help in Copilot implementing an idea into a working project.

Relevant workflow stage files: planning.instructions.md, design.instructions.md, implementation.instructions.md, tasking.instructions.md, testing.instructions.md, review.instructions.md
Relevant design files: uml.md, dataflows.md, sequences.md 

Relevant prompt files: planning.prompt.md, design.prompt.md, taskplan.prompt.md, testplan.prompt.md, review.prompt.md, task.prompt.md

Relevant chatmode files: Plan.chatmode.md, Deep-Planning.chatmode.md, Research.chatmode.md, Code.chatmode.md
-->

- For detailed testing instructions, refer to the [Testing instructions](../instructions/testing.instructions.md).

- You have to generate two types of testing documents:
    - Component Test documents (`<Component-Name>-Tests.md`)
    - Master Test Plan document (`TESTPLAN.md`)

- **DO NOT** display the contents in your response. Just write it directly to the respective files.
- This is a significant design task, so ensure that the task planning is comprehensive and well-structured.
