import { buildModuleGraph } from "../../services/graph/repositoryGraph.service.js";

export default {
    name: "moduleGraph",
    description: "Build a repository module graph from resolved imports.",
    input: {
        required: ["repositoryId"],
        optional: ["directory", "limit"],
    },
    output: "Graph nodes and module import edges.",
    async execute(args) {
        return buildModuleGraph(args);
    },
};
