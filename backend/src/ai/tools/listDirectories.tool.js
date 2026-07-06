import { listDirectories } from "../../services/repositoryQuery.service.js";

export default {
    name: "listDirectories",
    description: "List indexed directories in a repository or directory.",
    input: {
        required: ["repositoryId"],
        optional: ["directory", "recursive", "limit"],
    },
    output: "Array of directories.",
    async execute(args) {
        return listDirectories(args);
    },
};
