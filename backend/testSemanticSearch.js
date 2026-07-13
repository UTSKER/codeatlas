import semanticSearchService from "./src/ai/vector/semanticSearch.service.js";

const repositoryId = "cmr7ikwrb000430r7nara8jdp";

const result = await semanticSearchService.search({
    repositoryId,
    query: "JWT authentication",
    limit: 5,
});

console.dir(result, {
    depth: null,
});