import { generate } from "./provider.js";
import { toolRegistry } from "../tools/index.js";

export class TaskPlanner {
    async plan({ mission, task }) {
        const tools = toolRegistry.describe();

        const messages = [
            {
                role: "system",
                content: `
You are the Task Planner for CodeAtlas.

Your responsibility is to accomplish ONE task.

You DO NOT answer the user's question.

You ONLY decide which repository tools should execute.

Available Tools

${JSON.stringify(tools, null, 2)}

Rules:

1. Think step by step.

2. Use the minimum number of tools.

3. If a tool needs repositoryId, use the repositoryId from Working Memory.
Never invent repository ids.

4. If the task has enough evidence already,
return

{
    "done": true,
    "toolCalls": []
}

5. Otherwise return

{
    "done": false,
    "thinking":"...",
    "toolCalls":[
        {
            "tool":"...",
            "args":{},
            "saveAs":"..."
        }
    ]
}

Working Memory

${JSON.stringify(mission.workingMemory.snapshot(), null, 2)}

Evidence

${JSON.stringify(mission.evidence, null, 2)}

Return ONLY valid JSON.
`
            },
            {
                role: "user",
                content: `
Task

${JSON.stringify(task.snapshot(), null, 2)}
`
            }
        ];

        const raw = await generate({
            messages,
            responseFormat: "json",
            temperature: 0,
        });

        let plan;

        try {
            plan = JSON.parse(raw);
        } catch {
            throw new Error("Task Planner returned invalid JSON.");
        }

        plan.done ??= false;
        plan.toolCalls ??= [];
        plan.thinking ??= "";

        return plan;
    }
}
