import { searchSymbols } from "../../services/repositoryQuery.service.js";

export default {
    name: "searchClasses",
    description: "Search indexed class symbols.",
    input: {
        required: ["repositoryId"],
        optional: ["query", "limit"],
    },
    output: "Array of matching class symbols.",
    async execute(args) {
        return searchSymbols({
            ...args,
            kind: "CLASS",
        });
    },
};
