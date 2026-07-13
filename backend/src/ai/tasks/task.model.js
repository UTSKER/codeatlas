import crypto from "crypto";

export const TaskState = Object.freeze({

    PENDING:   "PENDING",

    RUNNING:   "RUNNING",

    COMPLETED: "COMPLETED",

    FAILED:    "FAILED",

});

export class Task {

    constructor({

        title,

        description,

        requirementId,

        tool,

        args = {},

        priority = 100,

    }) {

        if (!title?.trim()) {
            throw new Error("Task title is required.");
        }

        if (!requirementId) {
            throw new Error("Task must belong to a requirement.");
        }

        this.id = crypto.randomUUID();

        this.requirementId = requirementId;

        this.title = title.trim();

        this.description = description?.trim() ?? "";

        this.tool = tool ?? null;

        this.args = args;

        this.priority = priority;

        this.status = TaskState.PENDING;

        this.result = null;

        this.error  = null;

        this.createdAt   = new Date();
        this.startedAt   = null;
        this.completedAt = null;

        this.lastPlan = null;

        this.replanGuidance = null;

        /**
         * Full history of plan+execute cycles for this task.
         * Each entry: { attempt, plan, toolOutputs[], recordedAt }
         *
         * Injected into the planner context so the LLM can see
         * exactly what was tried and what each tool returned.
         */
        this.executionHistory = [];

    }

    // ─────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────

    start() {

        this.status = TaskState.RUNNING;

        this.startedAt = new Date();

    }

    complete(result) {

        this.status = TaskState.COMPLETED;

        this.result = result;

        this.completedAt = new Date();

    }

    fail(error) {

        this.status = TaskState.FAILED;

        this.error =
            error instanceof Error
                ? error.message
                : error;

        this.completedAt = new Date();

    }

    retry() {

        this.status    = TaskState.PENDING;
        this.error     = null;
        this.result    = null;
        this.startedAt = null;
        this.completedAt = null;

    }

    // ─────────────────────────────────────────────────────────────
    // Execution History
    // ─────────────────────────────────────────────────────────────

    /**
     * Record one plan+execute cycle.
     *
     * @param {{
     *   attempt:     number,
     *   plan:        object,
     *   toolOutputs: Array<{ tool: string, result: any, duration: number }>,
     * }} entry
     */
    recordExecution(entry) {

        this.executionHistory.push({
            ...entry,
            recordedAt: new Date(),
        });

    }

    // ─────────────────────────────────────────────────────────────
    // Status predicates
    // ─────────────────────────────────────────────────────────────

    isPending()   { return this.status === TaskState.PENDING;   }
    isRunning()   { return this.status === TaskState.RUNNING;   }
    isCompleted() { return this.status === TaskState.COMPLETED; }
    isFailed()    { return this.status === TaskState.FAILED;    }

    // ─────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────

    snapshot() {

        return {

            id: this.id,

            requirementId: this.requirementId,

            title: this.title,

            description: this.description,

            tool: this.tool,

            args: this.args,

            priority: this.priority,

            status: this.status,

            result: this.result,

            error: this.error,

            createdAt:   this.createdAt,
            startedAt:   this.startedAt,
            completedAt: this.completedAt,

            lastPlan: this.lastPlan,

            replanGuidance: this.replanGuidance,

            executionHistory: this.executionHistory,

        };

    }

}