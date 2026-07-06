import { searchSymbols } from "../../services/repositoryQuery.service.js";

export default {
    name: "searchFunctions",
    description: "Search indexed function and method symbols.",
    input: {
        required: ["repositoryId"],
        optional: ["query", "limit"],
    },
    output: "Array of matching function and method symbols.",
    async execute(args) {
        const [functions, methods] = await Promise.all([
            searchSymbols({
                ...args,
                kind: "FUNCTION",
            }),
            searchSymbols({
                ...args,
                kind: "METHOD",
            }),
        ]);

        return [...functions, ...methods];
    },
};
