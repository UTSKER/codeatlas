import { traceCallPath } from "../../services/graph/callGraph.service.js";

export default {
    name: "traceCallPath",
    description: "Find a resolved call path between two symbol names.",
    input: {
        required: ["repositoryId", "from", "to"],
        optional: ["maxDepth"],
    },
    output: "Found flag and symbol path when reachable.",
    async execute(args) {
        return traceCallPath(args);
    },
};
