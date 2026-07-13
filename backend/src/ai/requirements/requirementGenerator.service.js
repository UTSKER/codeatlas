import { generate } from "../llm/provider.js";
import Requirement from "./requirement.model.js";
import requirementGeneratorPrompt from "./prompts/requirementGenerator.prompt.js";

/**
 * RequirementGeneratorService — standalone service that generates requirements
 * for a mission using the LLM.
 *
 * NOTE: In the current pipeline the Mission Planner (missionPlanner.js)
 * already generates both the goal and the requirements in a single LLM call.
 * This service exists for cases where requirements need to be (re)generated
 * separately — e.g. after replanning, or for future modular use.
 */
class RequirementGeneratorService {

    /**
     * Generate Requirement objects for a mission.
     *
     * @param {import('../mission/mission.model.js').Mission} mission
     * @returns {Promise<Requirement[]>}
     */
    async generate(mission) {

        const prompt = requirementGeneratorPrompt(mission);

        const raw = await generate({
            messages: [
                {
                    role: "system",
                    content: prompt,
                },
                {
                    role: "user",
                    content: mission.goal,
                },
            ],
            responseFormat: "json",
            temperature: 0,
        });

        let items;

        try {
            items = JSON.parse(raw);
        } catch {
            throw new Error("RequirementGenerator returned invalid JSON.");
        }

        if (!Array.isArray(items)) {
            throw new Error("RequirementGenerator must return an array.");
        }

        return items.map(item => new Requirement({
            title: item.title,
            description: item.description,
            priority: item.priority ?? "MEDIUM",
            acceptanceCriteria: item.acceptanceCriteria ?? [],
        }));

    }

}

export default new RequirementGeneratorService();
