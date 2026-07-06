import { searchSymbols } from "../../services/repositoryQuery.service.js";

export default {
    name: "searchSymbols",
    description: "Search indexed repository symbols by name and optional kind.",
    input: {
        required: ["repositoryId"],
        optional: ["query", "kind", "limit"],
    },
    output: "Array of matching symbols with file locations.",
    async execute(args) {
        return searchSymbols(args);
    },
};
