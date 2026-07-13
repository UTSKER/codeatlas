import { missionPlanner }   from "../mission/missionPlanner.js";
import "../tools/index.js";
import { TaskGenerator }    from "../tasks/taskGenerator.js";
import { TaskPlanner }      from "../planner/taskPlanner.js";
import { TaskExecutor }     from "../tasks/taskExecutor.js";
import { MissionVerifier }  from "../mission/missionVerifier.js";
import { MissionReplanner } from "../mission/missionReplanner.js";
import { AnswerGenerator }  from "../llm/answer.js";
import { Task }             from "../tasks/task.model.js";
import { logger }           from "../logger.js";

const DEFAULT_MAX_TASK_ITERATIONS = 8;
const DEFAULT_MAX_MISSION_TASKS   = 12;

/**
 * AgentService — the autonomous execution scheduler.
 *
 * This is the ONLY orchestration loop. It owns the full lifecycle:
 *
 *   Mission Created
 *      → Requirements Generated (by missionPlanner)
 *      → Tasks Generated (by TaskGenerator)
 *      → For each Task:
 *          → Planner chooses strategy + tool calls
 *          → Executor runs tool calls
 *          → Verifier checks if requirement is satisfied
 *          → If NOT satisfied:
 *              → Replanner decides: CONTINUE | NEW_TASK | FAIL
 *          → If CONTINUE: loop with guidance
 *          → If NEW_TASK: add new task, break inner loop, outer loop picks it up
 *          → If FAIL: mark requirement failed, move to next
 *      → All requirements done → Answer Generator
 *      → Final answer returned
 *
 * Design invariants:
 *   - The scheduler NEVER answers questions.
 *   - The scheduler is the only place that manages Mission state transitions.
 *   - All business logic lives in the sub-components; the scheduler only wires them.
 */
export class AgentService {

    constructor() {

        this.taskGenerator   = new TaskGenerator();
        this.planner         = new TaskPlanner();
        this.executor        = new TaskExecutor();
        this.verifier        = new MissionVerifier();
        this.replanner       = new MissionReplanner();
        this.answerGenerator = new AnswerGenerator();

    }

    /**
     * Run the full autonomous pipeline for a user question.
     *
     * @param {string} question
     * @param {{ repositoryId?: string, maxMissionTasks?: number, maxTaskIterations?: number }} options
     * @returns {Promise<{ answer: string, mission: Mission }>}
     */
    async run(question, options = {}) {

        // ──────────────────────────────────────────────────────────
        // Phase 1 — Mission Planning
        // ──────────────────────────────────────────────────────────

        const mission = await missionPlanner(question);

        const repositoryId =
            options.repositoryId ??
            process.env.CODEATLAS_REPOSITORY_ID;

        if (repositoryId) {
            mission.metadata.repositoryId = repositoryId;
            mission.remember("repositoryId", repositoryId);
        }

        const maxMissionTasks = Number(
            options.maxMissionTasks ??
            process.env.CODEATLAS_MAX_MISSION_TASKS ??
            DEFAULT_MAX_MISSION_TASKS
        );

        const maxTaskIterations = Number(
            options.maxTaskIterations ??
            process.env.CODEATLAS_MAX_TASK_ITERATIONS ??
            DEFAULT_MAX_TASK_ITERATIONS
        );

        // ──────────────────────────────────────────────────────────
        // Phase 2 — Task Generation
        // ──────────────────────────────────────────────────────────

        this.taskGenerator.populateQueue(mission);

        mission.setState("EXECUTING");

        logger.info("Task queue populated", {
            tasks: mission.tasks.size(),
        });

        // ──────────────────────────────────────────────────────────
        // Phase 3 — Execution Loop (Scheduler)
        // ──────────────────────────────────────────────────────────

        while (

            mission.tasks.hasPending() &&

            (
                mission.statistics.executedTasks +
                mission.statistics.failedTasks
            ) < maxMissionTasks

        ) {

            const task = mission.nextTask();

            if (!task) break;

            const requirement = mission.getRequirement(task.requirementId);

            if (!requirement) {
                logger.error(
                    `Requirement '${task.requirementId}' not found for task '${task.title}' — skipping.`
                );
                task.fail("Requirement not found.");
                mission.incrementFailedTasks();
                continue;
            }

            // Skip requirements that are already done (can happen if a
            // NEW_TASK was queued for a requirement that got failed by
            // a concurrent cycle).
            if (requirement.isSatisfied() || requirement.isFailed()) {
                task.complete({ reason: "Requirement already done — skipping task." });
                continue;
            }

            mission.startRequirement(requirement.id);

            task.start();

            logger.taskStarted(task);
            logger.requirementStarted(requirement);

            // ── Inner loop — planning + execution + verification ──

            let taskIterations = 0;

            while (true) {

                taskIterations++;

                // Increment requirement attempts BEFORE the limit check
                mission.incrementRequirementAttempts(requirement.id);

                // Hard ceiling: task iterations or requirement max-attempts
                if (
                    taskIterations > maxTaskIterations ||
                    !requirement.canRetry()
                ) {

                    const reason = taskIterations > maxTaskIterations
                        ? `Maximum task iterations (${maxTaskIterations}) exceeded.`
                        : `Maximum requirement attempts (${requirement.maxAttempts}) exceeded.`;

                    logger.warn(reason, { requirementId: requirement.id });

                    task.fail(reason);

                    mission.setRequirementSummary(
                        requirement.id,
                        `Failed after ${requirement.attempts} attempts. ` +
                        `Strategies tried: ${requirement.strategiesTried.join(", ") || "none"}. ` +
                        `Last diagnosis: ${requirement.lastDiagnosis ?? "none"}.`
                    );

                    mission.failRequirement(requirement.id, reason);
                    mission.incrementFailedTasks();

                    logger.requirementFailed(requirement);

                    break;

                }

                try {

                    // ── Planning ─────────────────────────────────

                    mission.setState("EXECUTING");

                    logger.plannerStart(requirement, taskIterations);

                    const plan = await this.planner.plan({
                        mission,
                        requirement,
                        task,
                    });

                    mission.incrementPlannerIteration();

                    // Record the chosen strategy on the requirement
                    if (plan.strategy) {
                        mission.updateRequirementStrategy(requirement.id, plan.strategy);
                    }

                    logger.plannerResult(requirement, plan);

                    // ── Execution ────────────────────────────────

                    if (plan.isEmpty()) {
                        logger.warn(
                            "Planner returned empty tool call list — skipping execution",
                            { requirementId: requirement.id, strategy: plan.strategy }
                        );
                    } else {

                        await this.executor.execute({
                            mission,
                            task,
                            plan,
                        });

                    }

                    // ── Verification ─────────────────────────────

                    mission.setState("VERIFYING");

                    const verification = await this.verifier.verify({
                        mission,
                        requirement,
                        task,
                    });

                    logger.verifierResult(requirement, verification);

                    // Update confidence + diagnosis on requirement
                    mission.updateRequirementConfidence(requirement.id, verification.confidence);

                    if (verification.diagnosis) {
                        mission.updateRequirementDiagnosis(requirement.id, verification.diagnosis);
                    }

                    // ── Satisfied? ───────────────────────────────

                    if (verification.completed) {

                        task.complete({
                            confidence: verification.confidence,
                            reason:     verification.reason,
                        });

                        // Generate a human-readable summary of what was found
                        const summary = this._buildRequirementSummary(
                            requirement,
                            verification
                        );

                        mission.setRequirementSummary(requirement.id, summary);
                        mission.completeRequirement(requirement.id, verification.confidence);
                        mission.incrementExecutedTasks();

                        logger.requirementCompleted(requirement);
                        logger.taskCompleted(task);

                        break;

                    }

                    // ── Replanning ───────────────────────────────

                    mission.setState("REPLANNING");

                    const decision = await this.replanner.replan({
                        mission,
                        requirement,
                        task,
                        verification,
                    });

                    mission.incrementReplans();

                    logger.replannerDecision(requirement, decision);

                    // ── Apply replan decision ────────────────────

                    if (decision.action === "CONTINUE") {

                        // Store guidance on the task — the planner will
                        // read it on the next iteration to pick a better strategy
                        task.replanGuidance = {
                            action:              "CONTINUE",
                            recommendedStrategy: decision.recommendedStrategy,
                            strategyShift:       decision.strategyShift,
                            reason:              decision.reason,
                            reuseVariables:      decision.reuseVariables ?? [],
                        };

                        // Reset lastPlan so the planner doesn't blindly repeat it
                        task.lastPlan = null;

                        continue;

                    }

                    if (decision.action === "NEW_TASK") {

                        // Mark current task as superseded (not truly completed)
                        task.complete({
                            reason: "Superseded by replanned task.",
                        });

                        const newTask = new Task({
                            ...decision.task,
                            requirementId: requirement.id,
                            replanGuidance: {
                                recommendedStrategy: decision.recommendedStrategy,
                                strategyShift:       decision.strategyShift,
                                reason:              decision.reason,
                            },
                        });

                        mission.addTask(newTask);

                        logger.info("New task queued by replanner", {
                            requirementId: requirement.id,
                            taskTitle:     newTask.title.slice(0, 60),
                            strategy:      decision.recommendedStrategy,
                        });

                        break;

                    }

                    // ── FAIL decision or unknown action ──────────

                    const failReason =
                        decision.reason ?? "All strategies exhausted.";

                    task.fail(failReason);

                    mission.setRequirementSummary(
                        requirement.id,
                        `Failed: ${failReason}. ` +
                        `Strategies tried: ${requirement.strategiesTried.join(", ") || "none"}. ` +
                        `Last diagnosis: ${requirement.lastDiagnosis ?? "none"}.`
                    );

                    mission.failRequirement(requirement.id, failReason);
                    mission.incrementFailedTasks();

                    logger.requirementFailed(requirement);
                    logger.taskFailed(task, failReason);

                    break;

                } catch (error) {

                    // Graceful recovery — log the error but don't crash the mission
                    const errorDetail =
                        error?.stack ??
                        error?.message ??
                        String(error);

                    logger.error(
                        `Unexpected error in execution loop — failing requirement`,
                        {
                            requirementId: requirement.id,
                            error:         (error?.message || String(error) || "(no message)"),
                            code:          error?.code ?? undefined,
                        }
                    );

                    // Print the full stack to stderr so it's always visible
                    if (error?.stack) {
                        process.stderr.write(`\n[STACK] ${error.stack}\n\n`);
                    }

                    task.fail(error);

                    const failMsg = error?.message || error?.code || String(error) || "unknown error";

                    mission.setRequirementSummary(
                        requirement.id,
                        `Failed due to unexpected error: ${failMsg}.`
                    );

                    mission.failRequirement(requirement.id, failMsg);
                    mission.incrementFailedTasks();

                    logger.requirementFailed(requirement);

                    break;

                }

            } // ── end inner loop

        } // ── end outer loop

        // ──────────────────────────────────────────────────────────
        // Phase 4 — Answer Generation
        // ──────────────────────────────────────────────────────────

        mission.setState("ANSWERING");

        logger.answerGenerating(mission);

        const answer = await this.answerGenerator.generate({ mission });

        mission.finish(answer);

        logger.answerGenerated();
        logger.missionCompleted(mission);

        return {
            answer,
            mission,
        };

    }

    // ─────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────

    /**
     * Build a concise human-readable summary of what was found for a
     * satisfied requirement. This feeds into the AnswerGenerator context
     * so the LLM has structured per-requirement findings, not just raw
     * tool outputs.
     *
     * @param {Requirement} requirement
     * @param {object}      verification
     * @returns {string}
     */
    _buildRequirementSummary(requirement, verification) {

        const parts = [];

        parts.push(
            `Satisfied after ${requirement.attempts} attempt(s) ` +
            `using strategy: ${requirement.currentStrategy ?? "unknown"}.`
        );

        if (requirement.strategiesTried.length > 1) {
            parts.push(
                `Strategies tried: ${requirement.strategiesTried.join(" → ")}.`
            );
        }

        if (verification.reason) {
            parts.push(`Verification: ${verification.reason}`);
        }

        const criteriaSummary = Object.entries(
            verification.acceptanceCriteriaStatus ?? {}
        )
            .map(([criterion, status]) => `[${status}] ${criterion}`)
            .join("; ");

        if (criteriaSummary) {
            parts.push(`Criteria: ${criteriaSummary}`);
        }

        parts.push(`Confidence: ${(verification.confidence * 100).toFixed(0)}%`);

        return parts.join(" ");

    }

}