import { findExports } from "../../services/repositoryQuery.service.js";

export default {
    name: "findExports",
    description: "Find exports by file or export name.",
    input: {
        required: ["repositoryId"],
        optional: ["filePath", "name", "limit"],
    },
    output: "Array of exports with resolved symbols when available.",
    async execute(args) {
        return findExports(args);
    },
};
