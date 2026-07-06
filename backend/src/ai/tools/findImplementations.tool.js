import { findImplementations } from "../../services/graph/symbolGraph.service.js";

export default {
    name: "findImplementations",
    description: "Find class, method, or function implementations matching a query.",
    input: {
        required: ["repositoryId", "query"],
        optional: ["limit"],
    },
    output: "Array of implementation symbols.",
    async execute(args) {
        return findImplementations(args);
    },
};
