import { AgentService } from "../agent/agent.service.js";

async function main() {
    const agent = new AgentService();

    const result = await agent.run("Explain the complete request lifecycle of the forecast API.");

    console.log("\n=============================");
    console.log("FINAL ANSWER");
    console.log("=============================\n");

    console.log(result.answer);

    console.log("\n=============================");
    console.log("MISSION");
    console.log("=============================\n");

    console.dir(result.mission.snapshot(), {
        depth: null,
        colors: true,
    });

    console.log("\n=============================");
    console.log("WORKING MEMORY");
    console.log("=============================\n");

    console.dir(
        result.mission.workingMemory.snapshot(),
        {
            depth: null,
            colors: true,
        }
    );

    console.log("\n=============================");
    console.log("EVIDENCE");
    console.log("=============================\n");

    console.dir(
        result.mission.evidence,
        {
            depth: null,
            colors: true,
        }
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});