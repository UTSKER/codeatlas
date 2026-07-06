import test from "node:test";
import assert from "node:assert/strict";

import { AgentService } from "../agent/agent.service.js";
import { toolRegistry } from "../tools/index.js";

test("registers the repository analysis tool suite", () => {
    const names = toolRegistry.list().map(tool => tool.name);

    assert.deepEqual(
        names.sort(),
        [
            "dependencyGraph",
            "expandIncoming",
            "expandOutgoing",
            "findCallees",
            "findCallers",
            "findEntryPoints",
            "findExports",
            "findImplementations",
            "findImports",
            "findReferences",
            "inheritanceGraph",
            "listDirectories",
            "listFiles",
            "loadDirectory",
            "loadFile",
            "loadSource",
            "moduleGraph",
            "resolveExports",
            "resolveImports",
            "searchClasses",
            "searchFiles",
            "searchFunctions",
            "searchSymbols",
            "traceCallPath",
            "traceRequestLifecycle",
        ].sort()
    );
});

test("runs the full repository analysis agent when integration env is configured", {
    skip: !process.env.CODEATLAS_INTEGRATION_REPOSITORY_ID,
}, async () => {
    const agent = new AgentService();

    const result = await agent.run(
        "Explain the complete request lifecycle of the forecast API.",
        {
            repositoryId: process.env.CODEATLAS_INTEGRATION_REPOSITORY_ID,
        }
    );

    assert.ok(result.answer);
    assert.ok(result.mission.hasEvidence());
    assert.equal(
        result.mission.metadata.repositoryId,
        process.env.CODEATLAS_INTEGRATION_REPOSITORY_ID
    );
});
