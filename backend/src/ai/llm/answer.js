import { generate } from "./provider.js";

export class AnswerGenerator {
    async generate({ mission }) {
        const messages = [
            {
                role: "system",
                content: `
You are CodeAtlas.

You are an expert software engineer.

Answer ONLY using the collected evidence.

If the evidence is insufficient,
explicitly state what is missing.

Never hallucinate.

Never invent repository structure.

Produce a detailed technical explanation.
`
            },
            {
                role: "user",
                content: JSON.stringify({
                    goal: mission.goal,

                    workingMemory:
                        mission.workingMemory.snapshot(),

                    evidence:
                        mission.evidence,
                }, null, 2)
            }
        ];

        return await generate({
            messages,
            temperature: 0,
        });
    }
}