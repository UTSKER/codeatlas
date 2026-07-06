import { findEntryPoints } from "../../services/graph/callGraph.service.js";

export default {
    name: "findEntryPoints",
    description: "Find likely function or method entry points with no resolved incoming calls.",
    input: {
        required: ["repositoryId"],
        optional: ["query", "limit"],
    },
    output: "Array of likely entry point symbols.",
    async execute(args) {
        return findEntryPoints(args);
    },
};
