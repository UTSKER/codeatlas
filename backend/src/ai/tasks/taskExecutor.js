import { toolRegistry } from "../tools/toolRegistry.js";
import { EvidenceStore } from "../memory/evidenceStore.js";
import { logger }        from "../logger.js";

const TRANSIENT_ERROR_PATTERNS = [
    "timeout",
    "temporarily",
    "connection",
    "deadlock",
    "econnreset",
];

export class TaskExecutor {

    /**
     * Execute all tool calls in the plan.
     *
     * For each tool call:
     *   1. Resolve @variable references from working memory.
     *   2. Inject repositoryId if absent.
     *   3. Validate required arguments.
     *   4. Execute the tool (with retry on transient failures).
     *   5. Store evidence on the mission (mission + requirement level).
     *   6. Store result in working memory if saveAs is specified.
     *   7. Log the tool call and result.
     *
     * After all tool calls, record the full execution cycle on the task.
     *
     * @param {{ mission, task, plan }} param
     * @returns {Promise<Array<{ tool, result, duration, stepIndex }>>}
     */
    async execute({ mission, task, plan }) {

        const outputs = [];
        const store   = new EvidenceStore(mission.evidence);

        const requirementId = task.requirementId;

        for (
            let stepIndex = 0;
            stepIndex < (plan.toolCalls ?? []).length;
            stepIndex++
        ) {

            const toolCall = plan.toolCalls[stepIndex];

            if (!toolRegistry.has(toolCall.tool)) {
                throw new Error(
                    `Tool '${toolCall.tool}' not registered.`
                );
            }

            const tool = toolRegistry.get(toolCall.tool);

            const args = this.resolveArguments(toolCall.args, mission);

            this.injectRepositoryId(args, mission);
            this.validateArguments(tool, args);

            logger.executorToolStart(requirementId, toolCall.tool, args);

            const startedAt = Date.now();
            const result    = await this.executeWithRetry(tool, args);
            const duration  = Date.now() - startedAt;

            logger.executorToolResult(requirementId, toolCall.tool, result, duration);

            outputs.push({
                tool:      toolCall.tool,
                result,
                duration,
                stepIndex,
            });

            // Persist variable in working memory if requested
            if (toolCall.saveAs) {
                mission.remember(toolCall.saveAs, result);
            }

            // Store evidence at mission level (also propagates to requirement)
            mission.addEvidence({
                requirementId,
                taskId:     task.id,
                tool:       toolCall.tool,
                strategy:   plan.strategy ?? null,
                stepIndex,
                input:      args,
                output:     result,
                wasEmpty:   store.isEmptyOutput(result),
                duration,
                createdAt:  new Date(),
            });

        }

        // ── Record the full execution cycle on the task ──────────────
        // This feeds into ContextBuilder.buildPlanningContext() on the
        // next iteration so the planner can see exactly what ran.

        task.recordExecution({
            attempt:     task.executionHistory.length + 1,
            plan:        plan.snapshot(),
            toolOutputs: outputs.map(o => ({
                tool:     o.tool,
                result:   this._truncateForHistory(o.result),
                duration: o.duration,
            })),
        });

        // Also record on the requirement via the mission helper
        mission.recordRequirementExecution(requirementId, {
            attempt:     (mission.getRequirement(requirementId)?.executionHistory?.length ?? 0) + 1,
            plan:        plan.snapshot(),
            toolOutputs: outputs.map(o => ({
                tool:     o.tool,
                result:   this._truncateForHistory(o.result),
                duration: o.duration,
            })),
        });

        return outputs;

    }

    // ─────────────────────────────────────────────────────────────────
    // Argument resolution
    // ─────────────────────────────────────────────────────────────────

    resolveArguments(args, mission) {

        if (!args) return {};

        const resolved = {};

        for (const [key, value] of Object.entries(args)) {
            resolved[key] = this.resolveValue(value, mission, key);
        }

        return resolved;

    }

    /**
     * Resolve a value, expanding @variable references from working memory.
     *
     * When an @variable resolves to an array-of-objects and the target
     * argument key is a path/id field (e.g. 'path', 'filePath', 'symbolId'),
     * automatically extract the best scalar from the first element.
     *
     * This handles the LLM pattern of chaining:
     *   findImports → saveAs: "imports" → loadFile { path: "@imports" }
     *
     * @param {*}      value    The raw argument value (may be "@varName")
     * @param {object} mission  The mission (for working memory recall)
     * @param {string} argKey   The argument key (e.g. "path", "symbolId")
     */
    resolveValue(value, mission, argKey = "") {

        if (typeof value === "string" && value.startsWith("@")) {
            const recalled = mission.recall(value.substring(1));
            return this._coerceForKey(recalled, argKey);
        }

        if (Array.isArray(value)) {
            return value.map(v => this.resolveValue(v, mission, argKey));
        }

        if (value && typeof value === "object") {
            const object = {};

            for (const [k, v] of Object.entries(value)) {
                object[k] = this.resolveValue(v, mission, k);
            }

            return object;
        }

        return value;

    }

    /**
     * Coerce a working-memory value to the scalar type expected by argKey.
     *
     * When the LLM uses saveAs and then references that variable in a
     * field like "path", "filePath", "symbolId", or "symbolName", the
     * recalled value is often an array of result objects.
     * We extract the most sensible scalar instead of passing the whole
     * array as the argument value, which would fail validation.
     */
    _coerceForKey(value, argKey) {

        // If it's already a scalar, use it as-is
        if (
            value === null ||
            value === undefined ||
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value;
        }

        // Unwrap single-element array
        if (Array.isArray(value) && value.length === 1) {
            return this._coerceForKey(value[0], argKey);
        }

        // For array results: extract the best value based on argKey
        if (Array.isArray(value) && value.length > 0) {

            const key   = argKey.toLowerCase();
            const first = value[0];

            // Path-like fields: extract path or filePath
            if (
                key === "path" ||
                key === "filepath" ||
                key === "file" ||
                key === "filename"
            ) {
                for (const candidate of value) {
                    const p = candidate?.path ?? candidate?.filePath ?? candidate?.file;
                    if (typeof p === "string" && p) return p;
                }
            }

            // Symbol id / name fields
            if (key === "symbolid") {
                for (const candidate of value) {
                    const id = candidate?.symbol?.id ?? candidate?.symbolId ?? candidate?.id;
                    if (id) return id;
                }
            }

            if (key === "symbolname") {
                for (const candidate of value) {
                    const name = candidate?.symbol?.name ?? candidate?.symbolName ?? candidate?.name;
                    if (typeof name === "string" && name) return name;
                }
            }

            // Query field: build a comma-separated list of names
            if (key === "query") {
                const names = value
                    .slice(0, 3)
                    .map(c => c?.name ?? c?.symbol?.name ?? c?.path)
                    .filter(Boolean);
                if (names.length > 0) return names.join(", ");
            }

            // Generic: try to extract a path from the first element
            if (first && typeof first === "object") {
                const p = first.path ?? first.filePath ?? first.file ?? first.name;
                if (typeof p === "string" && p) return p;
            }

            // Fall back: return the first element as-is
            return first;

        }

        // Object: try to extract field by argKey, then common path fields
        if (value && typeof value === "object") {
            const key = argKey.toLowerCase();

            // Direct property match
            if (value[argKey] !== undefined) return value[argKey];

            // Path-like coercion
            if (key === "path" || key === "filepath" || key === "file") {
                return value.path ?? value.filePath ?? value.file ?? value.name ?? value;
            }

            if (key === "symbolid") {
                return value.id ?? value.symbolId ?? value?.symbol?.id ?? value;
            }

            if (key === "symbolname") {
                return value.name ?? value.symbolName ?? value?.symbol?.name ?? value;
            }
        }

        return value;

    }


    // ─────────────────────────────────────────────────────────────────
    // Repository ID injection
    // ─────────────────────────────────────────────────────────────────

    injectRepositoryId(args, mission) {

        if (args.repositoryId) return;

        const repositoryId =
            mission.metadata?.repositoryId ??
            mission.recall("repositoryId");

        if (repositoryId) {
            args.repositoryId = repositoryId;
        }

    }

    // ─────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────
    // Retry
    // ─────────────────────────────────────────────────────────────────

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

                logger.warn(
                    `Tool '${tool.name}' transient failure — retrying (attempt ${attempt}/${maxAttempts})`,
                    { error: error.message }
                );
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

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    /**
     * Truncate large results before storing in execution history to keep
     * context sizes manageable. Raw results are already in mission.evidence.
     */
    _truncateForHistory(result) {

        if (Array.isArray(result)) {
            return result.slice(0, 5);
        }

        if (typeof result === "string" && result.length > 500) {
            return result.slice(0, 500) + "…";
        }

        return result;

    }

}
