import crypto from "crypto";

import { TaskQueue } from "../tasks/taskQueue.js";

import { WorkingMemory } from "../memory/workingMemory.js";



export class Mission {
    constructor(goal) {
        if (!goal?.trim()) {
            throw new Error("Mission goal is required.");
        }

        this.id = crypto.randomUUID();

        this.goal = goal.trim();

        this.state = "CREATED";

        this.createdAt = new Date();
        this.updatedAt = new Date();

        this.informationRequirements = [];

        this.tasks = new TaskQueue();

        this.workingMemory = new WorkingMemory();

        this.evidence = [];

        this.metadata = {};

        this.answer = null;

        this.statistics = {
            plannerIterations: 0,
            executedTasks: 0,
            failedTasks: 0,
            replans: 0,
        };
    }

    setState(state) {
        this.state = state;
        this.touch();
    }

    touch() {
        this.updatedAt = new Date();
    }

    incrementPlannerIteration() {
        this.statistics.plannerIterations++;
        this.touch();
    }

    incrementExecutedTasks() {
        this.statistics.executedTasks++;
        this.touch();
    }

    incrementFailedTasks() {
        this.statistics.failedTasks++;
        this.touch();
    }

    incrementReplans() {
        this.statistics.replans++;
        this.touch();
    }

    addRequirement({
        id = crypto.randomUUID(),
        description,
        status = "PENDING",
    }) {
        this.informationRequirements.push({
            id,
            description,
            status,
        });

        this.touch();
    }

    completeRequirement(id) {
        const requirement = this.informationRequirements.find(
            r => r.id === id
        );

        if (!requirement) return;

        requirement.status = "COMPLETED";

        this.touch();
    }

    pendingRequirements() {
        return this.informationRequirements.filter(
            r => r.status === "PENDING"
        );
    }

    completedRequirements() {
        return this.informationRequirements.filter(
            r => r.status === "COMPLETED"
        );
    }

    hasPendingRequirements() {
        return this.pendingRequirements().length > 0;
    }

    addTask(task) {
        this.tasks.add(task);
        this.touch();
    }

    nextTask() {
        return this.tasks.next();
    }

    remember(key, value) {
        this.workingMemory.set(key, value);
        this.touch();
    }

    recall(key) {
        return this.workingMemory.get(key);
    }

    forget(key) {
        this.workingMemory.delete(key);
        this.touch();
    }

    addEvidence(evidence) {
        this.evidence.push({
            id: crypto.randomUUID(),
            createdAt: new Date(),
            ...evidence,
        });

        this.touch();
    }

    hasEvidence() {
        return this.evidence.length > 0;
    }

    finish(answer) {
        this.answer = answer;
        this.state = "COMPLETED";
        this.touch();
    }

    snapshot() {
        return {
            id: this.id,
            goal: this.goal,

            state: this.state,

            informationRequirements:
                this.informationRequirements,

            tasks: this.tasks.snapshot(),

            workingMemory: this.workingMemory.snapshot(),

            evidence: this.evidence,

            metadata: this.metadata,

            statistics: this.statistics,

            answer: this.answer,
        };
    }
}