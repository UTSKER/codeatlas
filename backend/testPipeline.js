/**
 * testPipeline.js
 *
 * End-to-end test harness for the CodeAtlas autonomous pipeline.
 *
 * Previously this file duplicated the AgentService scheduling loop —
 * a simplified, single-iteration version that would break after the first
 * replan, making it an unreliable test. It now delegates entirely to
 * AgentService.run() which IS the authoritative scheduler.
 *
 * Usage:
 *   node testPipeline.js
 *   CODEATLAS_REPOSITORY_ID=<id> node testPipeline.js
 *
 * Output:
 *   - Colorized pipeline logs to stdout (via logger.js)
 *   - Full mission snapshot written to output.txt
 */

import fs from "fs/promises";

import { AgentService } from "./src/ai/agent/agent.service.js";

// ────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────

const QUESTION =
    process.env.CODEATLAS_QUESTION ??
    "Explain the authentication flow of this repository.";

const REPOSITORY_ID =
    process.env.CODEATLAS_REPOSITORY_ID;

const MAX_MISSION_TASKS =
    process.env.CODEATLAS_MAX_MISSION_TASKS
        ? Number(process.env.CODEATLAS_MAX_MISSION_TASKS)
        : 12;

const MAX_TASK_ITERATIONS =
    process.env.CODEATLAS_MAX_TASK_ITERATIONS
        ? Number(process.env.CODEATLAS_MAX_TASK_ITERATIONS)
        : 8;

// ────────────────────────────────────────────────────────────────
// Output helpers
// ────────────────────────────────────────────────────────────────

const output = [];

function section(title, data) {
    output.push("\n");
    output.push("================================================");
    output.push(title);
    output.push("================================================");

    if (typeof data === "string") {
        output.push(data);
    } else {
        output.push(JSON.stringify(data, null, 2));
    }
}

// ────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────

async function main() {

    const agent = new AgentService();

    console.log(`\n🚀 CodeAtlas Pipeline Test`);
    console.log(`   Question    : ${QUESTION}`);
    console.log(`   Repository  : ${REPOSITORY_ID ?? "(not set)"}`);
    console.log(`   Max tasks   : ${MAX_MISSION_TASKS}`);
    console.log(`   Max iters   : ${MAX_TASK_ITERATIONS}`);
    console.log("");

    const { answer, mission } = await agent.run(QUESTION, {
        repositoryId:      REPOSITORY_ID,
        maxMissionTasks:   MAX_MISSION_TASKS,
        maxTaskIterations: MAX_TASK_ITERATIONS,
    });

    // ── Write output file ─────────────────────────────────────

    section("QUESTION", QUESTION);

    section("MISSION SNAPSHOT", mission.snapshot());

    section(
        "REQUIREMENTS",
        mission.requirements.map(r => ({
            id:              r.id,
            title:           r.title,
            status:          r.status,
            confidence:      r.confidence,
            attempts:        r.attempts,
            strategies:      r.strategiesTried,
            lastDiagnosis:   r.lastDiagnosis,
            diagnosisHistory: r.diagnosisHistory,
            summary:         r.summary,
            failureReason:   r.failureReason,
            evidenceCount:   r.evidence.length,
        }))
    );

    section(
        "EVIDENCE",
        mission.evidence.map(e => ({
            requirementId: e.requirementId,
            tool:          e.tool,
            strategy:      e.strategy,
            wasEmpty:      e.wasEmpty,
            duration:      e.duration,
            resultCount:   Array.isArray(e.output)
                ? e.output.length
                : (e.output != null ? 1 : 0),
        }))
    );

    section("STATISTICS", mission.statistics);

    section("FINAL ANSWER", answer);

    await fs.writeFile(
        "output.txt",
        output.join("\n"),
        "utf8"
    );

    console.log("");
    console.log("✅  Pipeline completed.");
    console.log(`   Requirements: ${mission.requirements.filter(r => r.isSatisfied()).length} satisfied / ${mission.requirements.filter(r => r.isFailed()).length} failed / ${mission.requirements.length} total`);
    console.log(`   Evidence    : ${mission.evidence.length} items`);
    console.log(`   Replans     : ${mission.statistics.replans}`);
    console.log("📄  output.txt written.");

}

// ────────────────────────────────────────────────────────────────

main().catch(async error => {

    output.push("\n\nFATAL ERROR\n");
    output.push(error.stack ?? error.message);

    await fs.writeFile(
        "output.txt",
        output.join("\n"),
        "utf8"
    );

    console.error("\n❌  Pipeline failed:", error.message);
    console.error(error.stack);

    process.exit(1);

});