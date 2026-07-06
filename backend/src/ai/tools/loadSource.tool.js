import { loadSource } from "../../services/repositoryQuery.service.js";

export default {
    name: "loadSource",
    description: "Load source code around an indexed symbol.",
    input: {
        required: ["repositoryId"],
        optional: ["symbolId", "symbolName", "contextLines"],
    },
    output: "Symbol metadata and source code excerpt.",
    async execute(args) {
        return loadSource(args);
    },
};
