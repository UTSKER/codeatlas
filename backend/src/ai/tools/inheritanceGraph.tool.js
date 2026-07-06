import { buildInheritanceGraph } from "../../services/graph/symbolGraph.service.js";

export default {
    name: "inheritanceGraph",
    description: "Build a symbol hierarchy graph from indexed parent/child symbols.",
    input: {
        required: ["repositoryId"],
        optional: ["query"],
    },
    output: "Graph nodes and hierarchy edges.",
    async execute(args) {
        return buildInheritanceGraph(args);
    },
};
