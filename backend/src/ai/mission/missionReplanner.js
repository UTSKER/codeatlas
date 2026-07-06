import { generate } from "../llm/provider.js";

export class MissionReplanner {
    async replan({
        mission,
        task,
        verification,
    }) {
        const messages = [
            {
                role: "system",
                content: `
You are CodeAtlas Replanner.

The current task does NOT have enough evidence.

Your job is to decide what should happen next.

Rules:

1. NEVER answer the user's question.

2. NEVER restart the mission.

3. Reuse existing working memory.

4. Decide ONE of the following:

{
    "action":"CONTINUE",
    "reason":"..."
}

or

{
    "action":"NEW_TASK",
    "reason":"...",
    "task":{
        "title":"...",
        "description":"...",
        "priority":1
    }
}

or

{
    "action":"FAIL",
    "reason":"..."
}

Return ONLY valid JSON.
`
            },
            {
                role: "user",
                content: JSON.stringify({
                    goal: mission.goal,

                    currentTask: task.snapshot(),

                    verification,

                    workingMemory:
                        mission.workingMemory.snapshot(),

                    evidence:
                        mission.evidence
                }, null, 2)
            }
        ];

        const raw = await generate({
            messages,
            responseFormat: "json",
            temperature: 0,
        });

        const decision = JSON.parse(raw);

        decision.action ??= "FAIL";
        decision.reason ??= "";

        return decision;
    }
}