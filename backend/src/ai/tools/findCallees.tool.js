import { findCallees } from "../../services/graph/callGraph.service.js";

export default {
    name: "findCallees",
    description: "Find resolved callees used by a symbol.",
    input: {
        required: ["repositoryId"],
        optional: ["symbolId", "symbolName"],
    },
    output: "Symbol plus outgoing call references.",
    async execute(args) {
        return findCallees(args);
    },
};
