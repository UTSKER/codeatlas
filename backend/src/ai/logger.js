/**
 * CodeAtlas — Pipeline Logger
 *
 * Structured, colorized output for every stage of the autonomous execution
 * pipeline. Every log line is prefixed with a stage tag so the full pipeline
 * execution can be followed at a glance.
 *
 * Usage:
 *   import { logger } from '../logger.js';
 *   logger.mission('Mission created', { goal, requirementCount });
 *   logger.planner(reqId, 'Plan generated', { strategy, toolCount });
 */

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

const CYAN   = "\x1b[36m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const BLUE   = "\x1b[34m";
const WHITE  = "\x1b[37m";

const STAGE_COLORS = {
    MISSION:     CYAN,
    REQUIREMENT: BLUE,
    TASK:        WHITE,
    PLANNER:     MAGENTA,
    EXECUTOR:    YELLOW,
    VERIFIER:    CYAN,
    REPLANNER:   YELLOW,
    ANSWER:      GREEN,
    ERROR:       RED,
    WARN:        YELLOW,
};

function pad(text, width) {
    return text.padEnd(width, " ");
}

function shortId(id) {
    return id ? id.slice(0, 8) : "--------";
}

function timestamp() {
    return new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm
}

function formatStage(stage) {
    const color = STAGE_COLORS[stage] ?? WHITE;
    return `${color}${BOLD}[${pad(stage, 11)}]${RESET}`;
}

function formatMeta(meta) {
    if (!meta || typeof meta !== "object") return "";

    const parts = Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => {
            if (typeof v === "number") {
                return `${DIM}${k}${RESET}=${BOLD}${v}${RESET}`;
            }
            if (typeof v === "boolean") {
                return `${DIM}${k}${RESET}=${v ? GREEN : RED}${v}${RESET}`;
            }
            if (Array.isArray(v)) {
                return `${DIM}${k}${RESET}=[${v.join(", ")}]`;
            }
            return `${DIM}${k}${RESET}=${v}`;
        });

    return parts.length > 0 ? `  ${parts.join("  ")}` : "";
}

function write(stage, reqId, message, meta) {
    const ts  = `${DIM}${timestamp()}${RESET}`;
    const stg = formatStage(stage);
    const id  = reqId ? `${DIM}${shortId(reqId)}${RESET} ` : "";
    const msg = `${message}`;
    const ext = formatMeta(meta);

    process.stdout.write(`${ts} ${stg} ${id}${msg}${ext}\n`);
}

/* ───────────────────────────────────────────────────────────────
   Public logger API
   ─────────────────────────────────────────────────────────────── */

export const logger = {

    // ── Mission ───────────────────────────────────────────────

    mission(message, meta) {
        write("MISSION", null, message, meta);
    },

    missionCreated(mission) {
        write("MISSION", mission.id, "Mission created", {
            goal: mission.goal.slice(0, 80),
            requirements: mission.requirements.length,
        });
    },

    missionCompleted(mission) {
        const satisfied = mission.requirements.filter(r => r.isSatisfied()).length;
        const failed    = mission.requirements.filter(r => r.isFailed()).length;
        write("MISSION", mission.id, "Mission COMPLETED", {
            satisfied,
            failed,
            total: mission.requirements.length,
            executedTasks: mission.statistics.executedTasks,
            failedTasks: mission.statistics.failedTasks,
            replans: mission.statistics.replans,
        });
    },

    // ── Requirement ───────────────────────────────────────────

    requirementStarted(requirement) {
        write("REQUIREMENT", requirement.id, `START  "${requirement.title}"`, {
            priority: requirement.priority,
            criteria: requirement.acceptanceCriteria.length,
        });
    },

    requirementCompleted(requirement) {
        write("REQUIREMENT", requirement.id, `SATISFIED "${requirement.title}"`, {
            confidence: requirement.confidence,
            attempts: requirement.attempts,
            strategies: requirement.strategiesTried.join(" → ") || "none",
        });
    },

    requirementFailed(requirement) {
        write("REQUIREMENT", requirement.id, `FAILED "${requirement.title}"`, {
            reason: (requirement.failureReason ?? "").slice(0, 80),
            attempts: requirement.attempts,
            strategies: requirement.strategiesTried.join(" → ") || "none",
        });
    },

    // ── Task ─────────────────────────────────────────────────

    taskStarted(task) {
        write("TASK", task.requirementId, `Task started: "${task.title.slice(0, 60)}"`, {
            taskId: shortId(task.id),
        });
    },

    taskCompleted(task) {
        write("TASK", task.requirementId, `Task completed: "${task.title.slice(0, 60)}"`, {
            taskId: shortId(task.id),
        });
    },

    taskFailed(task, reason) {
        write("TASK", task.requirementId, `Task failed: "${task.title.slice(0, 60)}"`, {
            taskId: shortId(task.id),
            reason: (reason ?? "").slice(0, 80),
        });
    },

    // ── Planner ───────────────────────────────────────────────

    plannerStart(requirement, iteration) {
        write("PLANNER", requirement.id, `Planning (attempt ${iteration})`, {
            strategy: requirement.currentStrategy ?? "none",
            tried: requirement.strategiesTried.join(", ") || "none",
        });
    },

    plannerResult(requirement, plan) {
        write("PLANNER", requirement.id, `Plan generated`, {
            strategy: plan.strategy,
            tools: (plan.toolCalls ?? []).map(c => c.tool).join(", "),
            toolCount: (plan.toolCalls ?? []).length,
        });
    },

    // ── Executor ─────────────────────────────────────────────

    executorToolStart(requirementId, tool, args) {
        const argSummary = Object.keys(args ?? {})
            .filter(k => k !== "repositoryId")
            .map(k => `${k}=${JSON.stringify(args[k]).slice(0, 40)}`)
            .join(", ");
        write("EXECUTOR", requirementId, `→ ${tool}`, {
            args: argSummary || "(none)",
        });
    },

    executorToolResult(requirementId, tool, result, duration) {
        const count = Array.isArray(result)
            ? result.length
            : result != null ? 1 : 0;
        const empty = count === 0;
        write("EXECUTOR", requirementId, `← ${tool}`, {
            results: count,
            empty,
            ms: duration,
        });
    },

    // ── Verifier ─────────────────────────────────────────────

    verifierResult(requirement, verification) {
        const symbol = verification.completed ? "✓" : "✗";
        write("VERIFIER", requirement.id, `${symbol} Verification`, {
            completed: verification.completed,
            confidence: verification.confidence,
            diagnosis: verification.diagnosis,
            reason: (verification.reason ?? "").slice(0, 80),
        });
    },

    // ── Replanner ────────────────────────────────────────────

    replannerDecision(requirement, decision) {
        write("REPLANNER", requirement.id, `Decision: ${decision.action}`, {
            strategy: decision.recommendedStrategy,
            shift: decision.strategyShift,
            reason: (decision.reason ?? "").slice(0, 80),
        });
    },

    // ── Answer ───────────────────────────────────────────────

    answerGenerating(mission) {
        const satisfied = mission.requirements.filter(r => r.isSatisfied()).length;
        write("ANSWER", null, "Generating final answer", {
            satisfiedRequirements: satisfied,
            total: mission.requirements.length,
            evidenceItems: mission.evidence.length,
        });
    },

    answerGenerated() {
        write("ANSWER", null, "Final answer generated");
    },

    // ── Generic ───────────────────────────────────────────────

    info(message, meta)  { write("MISSION",  null, message, meta); },
    warn(message, meta)  { write("WARN",     null, `⚠  ${message}`, meta); },
    error(message, meta) { write("ERROR",    null, `✖  ${message}`, meta); },

};

export default logger;
