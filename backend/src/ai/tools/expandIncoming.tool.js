import { expandIncoming } from "../../services/graph/callGraph.service.js";

export default {
    name: "expandIncoming",
    description: "Expand resolved incoming calls to a symbol.",
    input: {
        required: ["repositoryId"],
        optional: ["symbolId", "symbolName"],
    },
    output: "Symbol plus resolved incoming function calls.",
    async execute(args) {
        return expandIncoming(args);
    },
};
