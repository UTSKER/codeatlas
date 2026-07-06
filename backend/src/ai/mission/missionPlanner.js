import { generate } from "../llm/provider.js";
import { Mission } from "./mission.model.js";
import { buildMissionPlannerPrompt } from "../prompts/missionPlanner.prompt.js";

export async function missionPlanner(question) {
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

    const mission = new Mission(plan.goal);

    for (const requirement of plan.informationRequirements ?? []) {
        mission.addRequirement({
            description: requirement.description,
        });
    }

    mission.setState("MISSION_CREATED");

    return mission;
}