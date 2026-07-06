import { expandOutgoing } from "../../services/graph/callGraph.service.js";

export default {
    name: "expandOutgoing",
    description: "Expand resolved outgoing calls from a symbol.",
    input: {
        required: ["repositoryId"],
        optional: ["symbolId", "symbolName"],
    },
    output: "Symbol plus resolved outgoing function calls.",
    async execute(args) {
        return expandOutgoing(args);
    },
};
