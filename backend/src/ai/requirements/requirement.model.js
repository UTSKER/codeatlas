import { randomUUID } from "crypto";

export const RequirementStatus = Object.freeze({

    PENDING:     "PENDING",

    IN_PROGRESS: "IN_PROGRESS",

    SATISFIED:   "SATISFIED",

    FAILED:      "FAILED",

});

export const RequirementPriority = Object.freeze({

    LOW:    "LOW",

    MEDIUM: "MEDIUM",

    HIGH:   "HIGH",

});

class Requirement {

    constructor({

        id = randomUUID(),

        title,

        description,

        priority = RequirementPriority.MEDIUM,

        status = RequirementStatus.PENDING,

        acceptanceCriteria = [],

        maxAttempts = 5,

    }) {

        if (!title?.trim()) {
            throw new Error("Requirement title is required.");
        }

        this.id = id;

        this.title = title.trim();

        this.description = description?.trim() ?? "";

        this.priority = priority;

        this.status = status;

        this.acceptanceCriteria = acceptanceCriteria;

        this.tasks = [];

        this.evidence = [];

        this.confidence = 0;

        // -------------------------
        // Lifecycle
        // -------------------------

        this.attempts = 0;

        this.maxAttempts = maxAttempts;

        this.failureReason = null;

        this.createdAt = new Date();

        this.startedAt = null;

        this.completedAt = null;

        // -------------------------
        // Planning Metadata
        // -------------------------

        this.currentStrategy  = null;

        this.strategiesTried  = [];

        /**
         * Full diagnosis history — every diagnosis recorded during this
         * requirement's execution, in order. Used by the planner to avoid
         * repeating patterns that already failed.
         */
        this.diagnosisHistory = [];

        /**
         * Convenience accessor — the most recent diagnosis.
         */
        this.lastDiagnosis = null;

        /**
         * Execution history — one entry per plan+execute cycle.
         * Shape: { attempt, plan, toolOutputs[], timestamp }
         */
        this.executionHistory = [];

        /**
         * Human-readable summary generated after the requirement is
         * completed or definitively failed. Used by the AnswerGenerator.
         */
        this.summary = null;

    }

    // ─────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────

    start() {

        this.status = RequirementStatus.IN_PROGRESS;

        if (!this.startedAt) {
            this.startedAt = new Date();
        }

    }

    complete(confidence = this.confidence) {

        this.status = RequirementStatus.SATISFIED;

        this.confidence = confidence;

        this.completedAt = new Date();

    }

    fail(reason = "") {

        this.status = RequirementStatus.FAILED;

        this.failureReason = reason;

        this.completedAt = new Date();

    }

    incrementAttempts() {

        this.attempts++;

    }

    canRetry() {

        return this.attempts < this.maxAttempts;

    }

    // ─────────────────────────────────────────────────────────────
    // Strategy tracking
    // ─────────────────────────────────────────────────────────────

    /**
     * Set (or update) the current retrieval strategy.
     * Appends to strategiesTried if not already present.
     */
    setStrategy(strategy) {

        this.currentStrategy = strategy;

        if (
            strategy &&
            !this.strategiesTried.includes(strategy)
        ) {
            this.strategiesTried.push(strategy);
        }

    }

    /** Alias kept for API consistency with the spec. */
    recordStrategy(strategy) {
        this.setStrategy(strategy);
    }

    // ─────────────────────────────────────────────────────────────
    // Diagnosis tracking
    // ─────────────────────────────────────────────────────────────

    /**
     * Record a verifier diagnosis. Appends to history AND updates
     * lastDiagnosis so both the planner (history) and quick checks
     * (lastDiagnosis) work correctly.
     */
    recordDiagnosis(diagnosis) {

        if (!diagnosis) return;

        this.lastDiagnosis = diagnosis;

        this.diagnosisHistory.push({
            diagnosis,
            strategy: this.currentStrategy,
            attempt:  this.attempts,
            recordedAt: new Date(),
        });

    }

    /** @deprecated use recordDiagnosis() */
    setDiagnosis(diagnosis) {
        this.recordDiagnosis(diagnosis);
    }

    // ─────────────────────────────────────────────────────────────
    // Execution history
    // ─────────────────────────────────────────────────────────────

    /**
     * Record one plan+execute cycle for later context injection.
     *
     * @param {{ attempt: number, plan: object, toolOutputs: object[] }} entry
     */
    recordExecution(entry) {

        this.executionHistory.push({
            ...entry,
            recordedAt: new Date(),
        });

    }

    // ─────────────────────────────────────────────────────────────
    // Evidence & Tasks
    // ─────────────────────────────────────────────────────────────

    addTask(task) {

        this.tasks.push(task);

    }

    addEvidence(evidence) {

        this.evidence.push(evidence);

    }

    updateConfidence(confidence) {

        this.confidence = confidence;

    }

    /**
     * Set the human-readable summary for this requirement.
     * Called by the scheduler after completion or failure.
     */
    setSummary(text) {

        this.summary = text ?? null;

    }

    // ─────────────────────────────────────────────────────────────
    // Status predicates
    // ─────────────────────────────────────────────────────────────

    isPending() {
        return this.status === RequirementStatus.PENDING;
    }

    isInProgress() {
        return this.status === RequirementStatus.IN_PROGRESS;
    }

    isSatisfied() {
        return this.status === RequirementStatus.SATISFIED;
    }

    isFailed() {
        return this.status === RequirementStatus.FAILED;
    }

    // ─────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────

    snapshot() {

        return {

            id: this.id,

            title: this.title,

            description: this.description,

            priority: this.priority,

            status: this.status,

            confidence: this.confidence,

            attempts: this.attempts,

            maxAttempts: this.maxAttempts,

            currentStrategy: this.currentStrategy,

            strategiesTried: this.strategiesTried,

            diagnosisHistory: this.diagnosisHistory,

            lastDiagnosis: this.lastDiagnosis,

            executionHistory: this.executionHistory,

            summary: this.summary,

            acceptanceCriteria: this.acceptanceCriteria,

            tasks: this.tasks,

            evidence: this.evidence,

            failureReason: this.failureReason,

            createdAt: this.createdAt,

            startedAt: this.startedAt,

            completedAt: this.completedAt,

        };

    }

}

export default Requirement;