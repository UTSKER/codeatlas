import { generate }                  from "../llm/provider.js";
import { Mission }                   from "./mission.model.js";
import Requirement                   from "../requirements/requirement.model.js";
import { buildMissionPlannerPrompt } from "../prompts/missionPlanner.prompt.js";
import { logger }                    from "../logger.js";

/**
 * missionPlanner — transforms a user question into a Mission with Requirements.
 *
 * This is the first stage of the autonomous pipeline. It:
 *   1. Calls the LLM to decompose the question into a goal + requirements.
 *   2. Validates the LLM response.
 *   3. Constructs a Mission and populates it with Requirement objects.
 *
 * It does NOT choose retrieval strategies, call tools, or answer the question.
 */
export async function missionPlanner(question) {

    if (!question?.trim()) {
        throw new Error("A question is required to start a mission.");
    }

    logger.info("Mission Planner — decomposing question into requirements", {
        question: question.slice(0, 100),
    });

    const messages = buildMissionPlannerPrompt(question);

    const raw = await generate({
        messages,
        responseFormat: "json",
        temperature: 0,
    });

    let plan;

    try {
        plan = JSON.parse(raw);
    } catch {
        throw new Error("Mission Planner returned invalid JSON.");
    }

    if (!plan.goal?.trim()) {
        throw new Error(
            "Mission Planner returned an empty goal. " +
            "The LLM response must include a 'goal' field."
        );
    }

    const requirements = plan.requirements ?? [];

    if (requirements.length === 0) {
        throw new Error(
            "Mission Planner returned 0 requirements. " +
            "Every mission must have at least one requirement."
        );
    }

    const mission = new Mission(plan.goal);

    for (const item of requirements) {

        if (!item.title || !item.description) {
            throw new Error(
                "Mission Planner returned a requirement without title or description."
            );
        }

        mission.addRequirement(
            new Requirement({
                title:              item.title,
                description:        item.description,
                priority:           item.priority          ?? "MEDIUM",
                acceptanceCriteria: item.acceptanceCriteria ?? [],
            })
        );

    }

    mission.setState("PLANNING");

    logger.missionCreated(mission);

    logger.info("Requirements generated", {
        count: mission.requirements.length,
        titles: mission.requirements
            .map(r => `"${r.title}"`)
            .join(", ")
            .slice(0, 120),
    });

    return mission;

}