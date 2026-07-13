import { generate } from "../llm/provider.js";
import { toolRegistry } from "../tools/toolRegistry.js";
import { describeToolsForPlanner } from "../tools/toolMetadata.js";
import { ContextBuilder } from "../memory/contextBuilder.js";
import { ExecutionPlan } from "./executionPlan.model.js";
import { buildTaskPlannerPrompt } from "./taskPlanner.prompt.js";
import { getRepositoryMetadata } from "./repositoryMetadata.js";

export class TaskPlanner {

    async plan({ mission, requirement, task }) {

        const tools = describeToolsForPlanner(toolRegistry.describe());

        const repositoryId =
            mission.metadata?.repositoryId ??
            mission.recall("repositoryId");

        const repositoryMetadata = repositoryId
            ? await getRepositoryMetadata(repositoryId)
            : null;

        if (repositoryMetadata) {
            mission.metadata.repositoryCapabilities = {
                availableStrategies: repositoryMetadata.availableStrategies,
                embeddingsAvailable: repositoryMetadata.embeddings?.available ?? false,
                embeddingCount: repositoryMetadata.embeddings?.count ?? 0,
                totalSymbols: repositoryMetadata.symbols?.total ?? 0,
                callGraphEdges: repositoryMetadata.callGraphEdges ?? 0,
                importEdges: repositoryMetadata.importEdges ?? 0,
            };
        }

        const planningContext = ContextBuilder.buildPlanningContext({
            mission,
            requirement,
            task,
            repositoryMetadata,
        });

        const messages = buildTaskPlannerPrompt({
            tools,
            repositoryMetadata,
            planningContext,
        });

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

        plan.strategy = plan.strategy ?? null;
        plan.reasoning = plan.reasoning ?? plan.thinking ?? "";
        plan.toolCalls = plan.toolCalls ?? [];

        const executionPlan = new ExecutionPlan(plan);

        task.lastPlan = executionPlan.snapshot();
        task.replanGuidance = null;

        return executionPlan;
    }
}
