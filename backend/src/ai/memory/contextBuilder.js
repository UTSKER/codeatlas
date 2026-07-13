import { EvidenceStore } from "./evidenceStore.js";

/**
 * ContextBuilder — assembles the LLM context blocks for each pipeline stage.
 *
 * Every stage (Planner, Verifier, Replanner, AnswerGenerator) receives a
 * carefully shaped context object. Richer context = fewer replans needed.
 *
 * Key principle: always include the full history of what was tried and why
 * it failed so the LLM can avoid repeating the same mistakes.
 */
export class ContextBuilder {

    /*
    |--------------------------------------------------------------------------
    | Planner Context
    |--------------------------------------------------------------------------
    | Receives everything the Planner needs to choose a strategy and build
    | a multi-step tool chain. Includes:
    |   - Full diagnosis & strategy history from the Requirement
    |   - Execution history (what tools ran, what they returned)
    |   - Working memory variables available for reuse
    |   - Repository capabilities to constrain strategy selection
    */

    static buildPlanningContext({
        mission,
        requirement,
        task,
        repositoryMetadata = null,
    }) {

        const store = new EvidenceStore(mission.evidence);
        const requirementEvidence = store.forRequirement(requirement.id);

        const attemptedTools      = store.toolsUsedForRequirement(requirement.id);
        const attemptedStrategies = store.strategiesUsedForRequirement(requirement.id);

        // Summarise execution history from the task (last 3 cycles)
        const recentExecutions = (task.executionHistory ?? [])
            .slice(-3)
            .map(e => ({
                attempt:     e.attempt,
                strategy:    e.plan?.strategy ?? null,
                tools:       (e.toolOutputs ?? []).map(o => ({
                    tool:      o.tool,
                    resultCount: Array.isArray(o.result)
                        ? o.result.length
                        : (o.result != null ? 1 : 0),
                    wasEmpty: o.result == null ||
                        (Array.isArray(o.result) && o.result.length === 0),
                    duration: o.duration,
                })),
            }));

        // Diagnosis history from the requirement (last 5)
        const diagnosisHistory = (requirement.diagnosisHistory ?? [])
            .slice(-5)
            .map(d => ({
                attempt:   d.attempt,
                strategy:  d.strategy,
                diagnosis: d.diagnosis,
            }));

        return {

            goal: mission.goal,

            requirement: {
                id:                 requirement.id,
                title:              requirement.title,
                description:        requirement.description,
                acceptanceCriteria: requirement.acceptanceCriteria,
                // Planning metadata for strategy selection
                currentStrategy:    requirement.currentStrategy,
                strategiesTried:    requirement.strategiesTried,
                lastDiagnosis:      requirement.lastDiagnosis,
                diagnosisHistory,
                attempts:           requirement.attempts,
                maxAttempts:        requirement.maxAttempts,
                summary:            requirement.summary ?? null,
            },

            currentTask: task.snapshot(),

            // Recent execution history (plan + tool outputs) for this task
            recentExecutions,

            workingMemory:        mission.workingMemory.snapshot(),
            workingMemorySummary: mission.workingMemory.summary(),

            // Evidence for this requirement with a sample of results
            previousEvidenceForThisRequirement: store.summarize({
                requirementId: requirement.id,
                sampleSize: 3,
            }),

            attemptedTools,
            attemptedStrategies,

            replanGuidance: task.replanGuidance ?? null,

            lastPlan: task.lastPlan ?? null,

            statistics: mission.statistics,

            repositoryCapabilities: repositoryMetadata
                ? {
                    availableStrategies: repositoryMetadata.availableStrategies,
                    embeddingsAvailable: repositoryMetadata.embeddings?.available ?? false,
                    embeddingServiceHealthy: repositoryMetadata.embeddings?.serviceHealthy ?? false,
                    embeddingCount:      repositoryMetadata.embeddings?.count ?? 0,
                    totalSymbols:        repositoryMetadata.symbols?.total ?? 0,
                    callGraphEdges:      repositoryMetadata.callGraphEdges ?? 0,
                    importEdges:         repositoryMetadata.importEdges ?? 0,
                }
                : mission.metadata?.repositoryCapabilities ?? null,

        };

    }

    /*
    |--------------------------------------------------------------------------
    | Verifier Context
    |--------------------------------------------------------------------------
    | Receives evidence and programmatic signals so the verifier can make
    | a deterministic pre-check before calling the LLM.
    */

    static buildVerificationContext({ mission, requirement, task }) {

        const store = new EvidenceStore(mission.evidence);
        const requirementEvidence = store.forRequirement(requirement.id);

        const programmaticSignals = {
            totalEvidenceItems:   requirementEvidence.length,
            emptyResultCount:     store.countEmptyForRequirement(requirement.id),
            distinctToolsUsed:    store.countDistinctToolsForRequirement(requirement.id),
            strategiesAttempted:  store.strategiesUsedForRequirement(requirement.id),
            hasAnyResults:        store.hasResultsForRequirement(requirement.id),
            allResultsEmpty:      requirementEvidence.length > 0 &&
                !store.hasResultsForRequirement(requirement.id),
        };

        return {

            goal: mission.goal,

            requirement: {
                id:                 requirement.id,
                title:              requirement.title,
                description:        requirement.description,
                acceptanceCriteria: requirement.acceptanceCriteria,
                strategiesTried:    requirement.strategiesTried,
                lastDiagnosis:      requirement.lastDiagnosis,
                diagnosisHistory:   (requirement.diagnosisHistory ?? []).slice(-5),
                attempts:           requirement.attempts,
            },

            currentTask: task.snapshot(),

            lastPlan: task.lastPlan ?? null,

            workingMemorySummary: mission.workingMemory.summary(),

            evidenceForThisRequirement: store.summarize({
                requirementId: requirement.id,
                sampleSize: 5,
            }),

            toolsAttempted:      store.toolsUsedForRequirement(requirement.id),
            strategiesAttempted: store.strategiesUsedForRequirement(requirement.id),

            programmaticSignals,

        };

    }

    /*
    |--------------------------------------------------------------------------
    | Replanner Context
    |--------------------------------------------------------------------------
    | Receives verification result + full history so the replanner can make
    | an informed decision about the next strategy.
    */

    static buildReplanContext({ mission, requirement, task, verification }) {

        const store = new EvidenceStore(mission.evidence);

        return {

            goal: mission.goal,

            requirement: {
                id:                 requirement.id,
                title:              requirement.title,
                description:        requirement.description,
                acceptanceCriteria: requirement.acceptanceCriteria,
                strategiesTried:    requirement.strategiesTried,
                lastDiagnosis:      requirement.lastDiagnosis,
                diagnosisHistory:   (requirement.diagnosisHistory ?? []).slice(-5),
                attempts:           requirement.attempts,
                maxAttempts:        requirement.maxAttempts,
            },

            currentTask: task.snapshot(),

            verification,

            lastPlan: task.lastPlan ?? null,

            strategiesAlreadyAttempted: store.strategiesUsedForRequirement(requirement.id),
            toolsAlreadyAttempted:      store.toolsUsedForRequirement(requirement.id),

            evidenceCollectedSoFar: store.summarize({
                requirementId: requirement.id,
                sampleSize: 3,
            }),

            workingMemorySummary: mission.workingMemory.summary(),
            workingMemory:        mission.workingMemory.snapshot(),

            repositoryCapabilities: mission.metadata?.repositoryCapabilities ?? null,

        };

    }

    /*
    |--------------------------------------------------------------------------
    | Answer Context
    |--------------------------------------------------------------------------
    | Receives requirement summaries + evidence for the final answer generation.
    | The AnswerGenerator should NEVER work from raw tool output — it receives
    | structured summaries and requirement outcomes only.
    */

    static buildAnswerContext(mission) {

        const store = new EvidenceStore(mission.evidence);

        const evidenceSummary = store.summarize({ sampleSize: 10 });

        const requirementStatus = mission.requirements.map(r => ({
            id:                 r.id,
            title:              r.title,
            status:             r.status,
            acceptanceCriteria: r.acceptanceCriteria,
            confidence:         r.confidence,
            // Richer fields for answer generation
            summary:            r.summary ?? null,
            failureReason:      r.failureReason ?? null,
            strategiesTried:    r.strategiesTried,
            lastDiagnosis:      r.lastDiagnosis,
            attempts:           r.attempts,
        }));

        return {

            goal: mission.goal,

            requirements: requirementStatus,

            workingMemory: mission.workingMemory.snapshot(),

            evidence: mission.evidence.length > 0
                ? evidenceSummary
                : "NO EVIDENCE COLLECTED",

            statistics: mission.statistics,

        };

    }

}
