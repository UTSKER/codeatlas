import { loadFile } from "../../services/repositoryQuery.service.js";

export default {
    name: "loadFile",
    description: "Load an indexed repository file or line range from disk.",
    input: {
        required: ["repositoryId", "path"],
        optional: ["startLine", "endLine"],
    },
    output: "File metadata and source content.",
    async execute(args) {
        return loadFile(args);
    },
};
