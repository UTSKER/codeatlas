import { toolRegistry } from "../tools/toolRegistry.js";

const TRANSIENT_ERROR_PATTERNS = [
    "timeout",
    "temporarily",
    "connection",
    "deadlock",
    "econnreset",
];

export class TaskExecutor {
    async execute({ mission, task, plan }) {
        const outputs = [];

        for (const toolCall of plan.toolCalls ?? []) {
            if (!toolRegistry.has(toolCall.tool)) {
                throw new Error(
                    `Tool '${toolCall.tool}' not registered.`
                );
            }

            const tool = toolRegistry.get(toolCall.tool);

            const args = this.resolveArguments(
                toolCall.args,
                mission
            );

            this.injectRepositoryId(args, mission);
            this.validateArguments(tool, args);

            const startedAt = Date.now();
            const result = await this.executeWithRetry(tool, args);
            const duration = Date.now() - startedAt;

            outputs.push({
                tool: toolCall.tool,
                result,
                duration,
            });

            if (toolCall.saveAs) {
                mission.remember(
                    toolCall.saveAs,
                    result
                );
            }

            mission.addEvidence({
                taskId: task.id,
                tool: toolCall.tool,
                input: args,
                output: result,
                duration,
                createdAt: new Date(),
            });
        }

        return outputs;
    }

    resolveArguments(args, mission) {
        if (!args) return {};

        const resolved = {};

        for (const [key, value] of Object.entries(args)) {
            resolved[key] = this.resolveValue(value, mission);
        }

        return resolved;
    }

    resolveValue(value, mission) {
        if (typeof value === "string" && value.startsWith("@")) {
            return mission.recall(value.substring(1));
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
                object[k] = this.resolveValue(v, mission);
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

    async executeWithRetry(tool, args) {
        const maxAttempts = 2;
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await tool.execute(args);
            } catch (error) {
                lastError = error;

                if (
                    attempt === maxAttempts ||
                    !this.isTransient(error)
                ) {
                    throw error;
                }
            }
        }

        throw lastError;
    }

    isTransient(error) {
        const message = String(error?.message ?? "").toLowerCase();

        return TRANSIENT_ERROR_PATTERNS.some(pattern =>
            message.includes(pattern)
        );
    }
}
