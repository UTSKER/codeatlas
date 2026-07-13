import { generate } from "./provider.js";
import { ContextBuilder } from "../memory/contextBuilder.js";

export class AnswerGenerator {
    async generate({ mission }) {

        const context = ContextBuilder.buildAnswerContext(mission);

        const messages = [
            {
                role: "system",
                content: `You are CodeAtlas — an autonomous repository intelligence system.

You answer software engineering questions STRICTLY from evidence collected by the agent.

RULES:
1. Answer ONLY using the collected evidence below. Never hallucinate.
2. If evidence is insufficient, clearly say what is missing and why.
3. Structure your answer around the requirements that WERE satisfied.
4. For requirements with no evidence, explicitly state they could not be satisfied.
5. Be concrete — cite file paths, function names, and module names from the evidence.
6. Do NOT invent repository structure. Do NOT guess.
7. If ALL requirements failed to collect evidence, explain what was tried and suggest manual investigation paths.

FORMAT:
- Use markdown headings to organize by requirement.
- For each requirement, state: satisfied / partially satisfied / not satisfied.
- Provide the technical explanation grounded in evidence.
- End with a summary of what is known and what remains unknown.`,
            },
            {
                role: "user",
                content: JSON.stringify(context, null, 2),
            },
        ];

        return await generate({
            messages,
            temperature: 0,
        });
    }
}