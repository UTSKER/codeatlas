import { loadDirectory } from "../../services/repositoryQuery.service.js";

export default {
    name: "loadDirectory",
    description: "Load immediate indexed directory contents.",
    input: {
        required: ["repositoryId"],
        optional: ["path"],
    },
    output: "Directory metadata, child directories, and child files.",
    async execute(args) {
        return loadDirectory(args);
    },
};
