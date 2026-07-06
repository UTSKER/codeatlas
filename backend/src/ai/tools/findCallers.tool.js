import { findCallers } from "../../services/graph/callGraph.service.js";

export default {
    name: "findCallers",
    description: "Find resolved callers of a symbol.",
    input: {
        required: ["repositoryId"],
        optional: ["symbolId", "symbolName"],
    },
    output: "Symbol plus incoming call references.",
    async execute(args) {
        return findCallers(args);
    },
};
