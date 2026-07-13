import crypto from "crypto";

import Requirement from "../requirements/requirement.model.js";

import { TaskQueue }     from "../tasks/taskQueue.js";
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

        this.requirements = [];

        this.tasks = new TaskQueue();

        this.workingMemory = new WorkingMemory();

        this.evidence = [];

        this.metadata = {};

        this.answer = null;

        this.statistics = {
            plannerIterations: 0,
            executedTasks:     0,
            failedTasks:       0,
            replans:           0,
        };

    }

    touch() {
        this.updatedAt = new Date();
    }

    setState(state) {
        this.state = state;
        this.touch();
    }

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Requirements
    |--------------------------------------------------------------------------
    */

    addRequirement(requirement) {

        if (!(requirement instanceof Requirement)) {
            throw new Error("Expected Requirement instance.");
        }

        this.requirements.push(requirement);

        this.touch();

    }

    getRequirement(id) {

        return this.requirements.find(
            requirement => requirement.id === id
        );

    }

    startRequirement(id) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.start();

        this.touch();

    }

    completeRequirement(id, confidence = 1) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.complete(confidence);

        this.touch();

    }

    failRequirement(id, reason = "") {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.fail(reason);

        this.touch();

    }

    incrementRequirementAttempts(id) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.incrementAttempts();

        this.touch();

    }

    updateRequirementConfidence(id, confidence) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.updateConfidence(confidence);

        this.touch();

    }

    updateRequirementStrategy(id, strategy) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.setStrategy(strategy);

        this.touch();

    }

    updateRequirementDiagnosis(id, diagnosis) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.recordDiagnosis(diagnosis);

        this.touch();

    }

    setRequirementSummary(id, summary) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.setSummary(summary);

        this.touch();

    }

    recordRequirementExecution(id, entry) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.recordExecution(entry);

        this.touch();

    }

    addRequirementTask(id, task) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.addTask(task);

        this.touch();

    }

    addRequirementEvidence(id, evidence) {

        const requirement = this.getRequirement(id);

        if (!requirement) return;

        requirement.addEvidence(evidence);

        this.touch();

    }

    pendingRequirements() {

        return this.requirements.filter(
            requirement => requirement.isPending()
        );

    }

    inProgressRequirements() {

        return this.requirements.filter(
            requirement => requirement.isInProgress()
        );

    }

    completedRequirements() {

        return this.requirements.filter(
            requirement => requirement.isSatisfied()
        );

    }

    failedRequirements() {

        return this.requirements.filter(
            requirement => requirement.isFailed()
        );

    }

    hasPendingRequirements() {

        return this.pendingRequirements().length > 0;

    }

    allRequirementsDone() {

        return this.requirements.every(
            requirement =>
                requirement.isSatisfied() ||
                requirement.isFailed()
        );

    }

    allRequirementsSatisfied() {

        return this.requirements.every(
            requirement => requirement.isSatisfied()
        );

    }

    isFinished() {

        return this.allRequirementsDone();

    }

    /*
    |--------------------------------------------------------------------------
    | Tasks
    |--------------------------------------------------------------------------
    */

    addTask(task) {

        this.tasks.add(task);

        if (task.requirementId) {
            this.addRequirementTask(task.requirementId, task);
        }

        this.touch();

    }

    nextTask() {

        return this.tasks.next();

    }

    /*
    |--------------------------------------------------------------------------
    | Working Memory
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Evidence
    |--------------------------------------------------------------------------
    */

    addEvidence(evidence) {

        const record = {
            id:        crypto.randomUUID(),
            createdAt: new Date(),
            ...evidence,
        };

        this.evidence.push(record);

        if (record.requirementId) {
            this.addRequirementEvidence(record.requirementId, record);
        }

        this.touch();

        return record;

    }

    hasEvidence() {

        return this.evidence.length > 0;

    }

    /*
    |--------------------------------------------------------------------------
    | Mission Completion
    |--------------------------------------------------------------------------
    */

    finish(answer) {

        this.answer = answer;

        this.state = "COMPLETED";

        this.touch();

    }

    /*
    |--------------------------------------------------------------------------
    | Serialization
    |--------------------------------------------------------------------------
    */

    snapshot() {

        return {

            id:   this.id,

            goal: this.goal,

            state: this.state,

            requirements: this.requirements.map(
                requirement => requirement.snapshot()
            ),

            tasks: this.tasks.snapshot(),

            workingMemory: this.workingMemory.snapshot(),

            evidence: this.evidence,

            metadata: this.metadata,

            statistics: this.statistics,

            answer: this.answer,

        };

    }

}