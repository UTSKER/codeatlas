import { AgentService } from "../agent/agent.service.js";

const QUESTION = "Explain the authentication workflow in this repository.";
const REPOSITORY_ID = "cmr7ikwrb000430r7nara8jdp"; // replace with a real repository id

async function main() {
    const agent = new AgentService();

    const result = await agent.run(QUESTION, {
        repositoryId: REPOSITORY_ID,
    });

    console.log("\n=============================");
    console.log("QUESTION");
    console.log("=============================\n");
    console.log(QUESTION);

    console.log("\n=============================");
    console.log("FINAL ANSWER");
    console.log("=============================\n");
    console.log(result.answer);

    console.log("\n=============================");
    console.log("MISSION SNAPSHOT");
    console.log("=============================\n");
    console.dir(result.mission.snapshot(), {
        depth: null,
        colors: true,
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
