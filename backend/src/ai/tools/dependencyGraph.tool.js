import { buildDependencyGraph } from "../../services/graph/dependencyGraph.service.js";

export default {
    name: "dependencyGraph",
    description: "Build an import dependency graph for a repository or file.",
    input: {
        required: ["repositoryId"],
        optional: ["filePath", "direction", "depth"],
    },
    output: "Graph nodes and import edges.",
    async execute(args) {
        return buildDependencyGraph(args);
    },
};
