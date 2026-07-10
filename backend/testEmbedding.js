import embeddingIndexerService from "../backend/src/ai/embeddings/indexing/embeddingIndexer.js";

const repositoryId = "cmr7ikwrb000430r7nara8jdp";

const result =
    await embeddingIndexerService.indexRepository(
        repositoryId
    );

console.log(result.total);