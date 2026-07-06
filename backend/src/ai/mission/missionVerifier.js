import { generate } from "../llm/provider.js";

export class MissionVerifier {
    async verify({ mission, task }) {
        const messages = [
            {
                role: "system",
                content: `
You are CodeAtlas Verifier.

Your job is NOT to answer the user's question.

Your only responsibility is deciding whether the CURRENT TASK
has collected enough evidence.

If enough information exists:

{
    "completed": true,
    "confidence": 0.94,
    "reason": "..."
}

Otherwise:

{
    "completed": false,
    "confidence": 0.41,
    "reason": "...",
    "missingInformation":[
        "...",
        "..."
    ]
}

Return ONLY JSON.
`
            },
            {
                role: "user",
                content: JSON.stringify({
                    goal: mission.goal,

                    task: task.snapshot(),

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
            temperature: 0
        });

        const result = JSON.parse(raw);

        return {
            completed: result.completed ?? false,

            confidence: result.confidence ?? 0,

            reason: result.reason ?? "",

            missingInformation:
                result.missingInformation ?? []
        };
    }
}