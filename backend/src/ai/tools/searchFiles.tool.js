import { searchFiles } from "../../services/repositoryQuery.service.js";

export default {
    name: "searchFiles",
    description: "Search indexed repository files by path, name, extension, or language.",
    input: {
        required: ["repositoryId"],
        optional: ["query", "extension", "language", "limit"],
    },
    output: "Array of matching files.",
    async execute(args) {
        return searchFiles(args);
    },
};
