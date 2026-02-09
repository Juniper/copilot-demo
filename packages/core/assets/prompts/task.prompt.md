---
mode: agent
description: 'This is the task prompt for the GitHub Copilot Chat agent to accomplish a specific coding task.'
---

<!--
This instruction file is to be used with Abhishek's workflow, and is used to provide guidance on quick prototyping. The workflow uses a set of instruction files, prompts and chatmodes,
all pipelined together to create documents that help in Copilot implementing an idea into a working project.

Relevant workflow stage files: planning.instructions.md, design.instructions.md, implementation.instructions.md, tasking.instructions.md, testing.instructions.md, review.instructions.md
Relevant design files: uml.md, dataflows.md, sequences.md 

Relevant prompt files: planning.prompt.md, design.prompt.md, taskplan.prompt.md, testplan.prompt.md, review.prompt.md, task.prompt.md

Relevant chatmode files: Plan.chatmode.md, Deep-Planning.chatmode.md, Research.chatmode.md, Code.chatmode.md
-->

# This file is a reusable prompt for the GitHub Copilot Chat agent to accomplish **ONE SINGLE TASK** specified by the task number in the Copilot chat window. 

- When asked to perform a task, first: 

- `TASKS.md` is a file present in the workspace that contains a list of tasks with their corresponding task numbers.
- Check if `TASKS.md` has been provided as context. If it has not, use the `functions.search` tool to search for `TASKS.md` in the workspace.
    - If `TASKS.md` is not present, **ASK** the user to provide a complete description of the task they want to accomplish, including any specific requirements or constraints.
    - If `TASKS.md` is present:
        - If the user has provided a task number, use ${input:taskId} to find the corresponding **meta** task in `TASKS.md`.
        - If the meta-task is not found, inform the user that the task number is invalid or that the task does not exist. **STOP HERE**.
        - If the meta-task is found:
            - First, using the meta-task context, find out the relevant component in question, for example: **Component Document**: [Extension Setup Tasks](./Extension-Setup-Tasks.md)
            - Search `docs/tasks` for the relevant context of the actual tasks relating to that component in **<Component>-Tasks.md**. `taskIDs` **may repeat** across component task lists.
            - Only use the **NEXT UNFINISHED TASK** in the list from `docs/tasks/<Component>-Tasks.md`. You will be penalized with a bad rating for executing more than one component task at a time.
            - Then summarize the task to the user and outline the steps you'll take to complete it.
            - When beginning work on the first subtask for this parent task, update the meta-task's `Status` line in `TASKS.md` to `⚠️ IN PROGRESS`.
            - You will also need to update the parent task and its subtasks' `Status` lines accordingly in `<Component>-Tasks.md`
            - Execute the task at hand.
            - When a subtask completion causes all subtasks of the parent task to be complete, update the parent task's `Status` line in `TASKS.md` to `✅ COMPLETED`.
            - If the parent task is completed, generate a comprehensive commit workflow and commit the changes to the repository. Use the [Commit Prompt](../prompts/commit-message.prompt.md).

        - **Mark completed tasks in `<Component>-Tasks.md`** immediately after finishing them.
        - **Mark completed tasks in `TASKS.md`** immediately after finishing them. 
        - This is **very important** to keep track of the progress and ensure that the task is not repeated. 
        - **DO NOT** implement **ANY** other task than the one specified by ${input:taskId}.

- If the task requires implementing tasks outside of the current task's scope, ask the user about for permission
    - If permission is granted, add the additional tasks to `TASKS.md` as subtasks of the current task as appropriate.
    - Only then proceed with the implementation of the current task.

- If implementing the task requires additional context, such as code files or configuration files, use the provided context to guide the implementation.


