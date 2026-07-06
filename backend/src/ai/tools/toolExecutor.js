import { toolRegistry } from "./toolRegistry.js";

export class ToolExecutor {
    async execute({
        toolCalls,
        mission,
    }) {
        const results = [];

        for (const toolCall of toolCalls) {

            const tool = toolRegistry.get(toolCall.tool);

            const args = this.resolveArguments(
                toolCall.args,
                mission
            );

            this.injectRepositoryId(args, mission);
            this.validateArguments(tool, args);

            const startedAt = Date.now();

            const output = await tool.execute(args);

            const duration = Date.now() - startedAt;

            if (toolCall.saveAs) {
                mission.remember(
                    toolCall.saveAs,
                    output
                );
            }

            mission.addEvidence({
                taskId: toolCall.taskId ?? null,

                tool: tool.name,

                input: args,

                output,

                duration,
            });

            results.push({
                tool: tool.name,

                output,

                duration,
            });
        }

        return results;
    }

    resolveArguments(args, mission) {

        if (!args) {
            return {};
        }

        const resolved = {};

        for (const [key, value] of Object.entries(args)) {
            resolved[key] = this.resolveValue(
                value,
                mission
            );
        }

        return resolved;
    }

    resolveValue(value, mission) {

        if (
            typeof value === "string" &&
            value.startsWith("@")
        ) {
            return mission.recall(
                value.slice(1)
            );
        }

        if (Array.isArray(value)) {
            return value.map(v =>
                this.resolveValue(v, mission)
            );
        }

        if (
            value &&
            typeof value === "object"
        ) {
            const object = {};

            for (const [k, v] of Object.entries(value)) {
                object[k] = this.resolveValue(
                    v,
                    mission
                );
            }

            return object;
        }

        return value;
    }

    injectRepositoryId(args, mission) {
        if (args.repositoryId) {
            return;
        }

        const repositoryId =
            mission.metadata?.repositoryId ??
            mission.recall("repositoryId");

        if (repositoryId) {
            args.repositoryId = repositoryId;
        }
    }

    validateArguments(tool, args) {
        for (const key of tool.input?.required ?? []) {
            if (
                args[key] === undefined ||
                args[key] === null ||
                args[key] === ""
            ) {
                throw new Error(
                    `Tool '${tool.name}' missing required argument '${key}'.`
                );
            }
        }
    }
}
