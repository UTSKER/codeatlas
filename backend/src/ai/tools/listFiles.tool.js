import { listFiles } from "../../services/repositoryQuery.service.js";

export default {
    name: "listFiles",
    description: "List indexed files in a repository or directory.",
    input: {
        required: ["repositoryId"],
        optional: ["directory", "recursive", "limit"],
    },
    output: "Array of files.",
    async execute(args) {
        return listFiles(args);
    },
};
