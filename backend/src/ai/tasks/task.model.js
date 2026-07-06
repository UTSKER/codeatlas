import crypto from "crypto";

export class Task {
    constructor({
        title,
        description,
        tool,
        args = {},
        priority = 100,
    }) {
        if (!title) {
            throw new Error("Task title is required.");
        }

        this.id = crypto.randomUUID();

        this.title = title;

        this.description = description ?? "";

        this.tool = tool;

        this.args = args;

        this.priority = priority;

        this.status = "PENDING";

        this.result = null;

        this.error = null;

        this.createdAt = new Date();

        this.startedAt = null;

        this.completedAt = null;
    }

    start() {
        this.status = "RUNNING";
        this.startedAt = new Date();
    }

    complete(result) {
        this.status = "COMPLETED";
        this.result = result;
        this.completedAt = new Date();
    }

    fail(error) {
        this.status = "FAILED";
        this.error =
            error instanceof Error
                ? error.message
                : error;

        this.completedAt = new Date();
    }

    retry() {
        this.status = "PENDING";
        this.error = null;
        this.startedAt = null;
        this.completedAt = null;
    }

    isPending() {
        return this.status === "PENDING";
    }

    isRunning() {
        return this.status === "RUNNING";
    }

    isCompleted() {
        return this.status === "COMPLETED";
    }

    isFailed() {
        return this.status === "FAILED";
    }

    snapshot() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            tool: this.tool,
            args: this.args,
            priority: this.priority,
            status: this.status,
            result: this.result,
            error: this.error,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
        };
    }
}