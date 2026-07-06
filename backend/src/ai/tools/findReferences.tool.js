import { findReferences } from "../../services/repositoryQuery.service.js";

export default {
    name: "findReferences",
    description: "Find call and export references for a symbol.",
    input: {
        required: ["repositoryId"],
        optional: ["symbolId", "symbolName", "limit"],
    },
    output: "Symbol plus incoming calls, outgoing calls, and exports.",
    async execute(args) {
        return findReferences(args);
    },
};
