import semanticSearchService from "../vector/semanticSearch.service.js";

export default {
    name: "semanticSearch",
    description:
        "Search indexed code embeddings using natural language. " +
        "Finds semantically similar functions, classes, and code chunks " +
        "even when exact symbol names are unknown.",
    input: {
        required: ["repositoryId", "query"],
        optional: ["limit"],
    },
    output:
        "Array of { score, symbol: { id, name, kind }, filePath, content } " +
        "ranked by semantic similarity.",
    async execute(args) {
        return semanticSearchService.search(args);
    },
};
