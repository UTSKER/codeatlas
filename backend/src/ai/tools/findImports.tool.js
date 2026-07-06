import { findImports } from "../../services/repositoryQuery.service.js";

export default {
    name: "findImports",
    description: "Find imports by file or source string.",
    input: {
        required: ["repositoryId"],
        optional: ["filePath", "source", "limit"],
    },
    output: "Array of imports with resolved target files when available.",
    async execute(args) {
        return findImports(args);
    },
};
