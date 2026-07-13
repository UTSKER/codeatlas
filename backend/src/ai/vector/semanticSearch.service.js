import embeddingService from "../embeddings/services/embeddingService.js";
import pgVectorStore    from "./pgVectorStore.js";
import { logger }       from "../logger.js";

class SemanticSearchService {

    /**
     * Perform semantic search over a repository.
     *
     * Returns an empty array (rather than throwing) when the embedding
     * service is unavailable so the pipeline can gracefully fall back
     * to other strategies via the Verifier → Replanner loop.
     *
     * @param {Object} params
     * @param {string} params.repositoryId
     * @param {string} params.query
     * @param {number} params.limit
     * @returns {Promise<Array>}
     */
    async search({
        repositoryId,
        query,
        limit = 10,
    }) {

        if (!repositoryId) {
            throw new Error("repositoryId is required.");
        }

        if (!query?.trim()) {
            throw new Error("Query is required.");
        }

        // Generate query embedding — returns [] gracefully on service failure
        let queryEmbedding;

        try {
            [queryEmbedding] = await embeddingService.generateEmbeddings([query]);
        } catch (err) {
            const isConnectionError =
                err?.code === "ECONNREFUSED" ||
                err?.code === "ENOTFOUND"    ||
                err?.code === "ETIMEDOUT"    ||
                String(err?.message ?? "").toLowerCase().includes("connect");

            if (isConnectionError) {
                logger.warn(
                    "Embedding service unavailable — semanticSearch returning empty results",
                    {
                        url:   process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8000",
                        error: err.code ?? err.message,
                    }
                );
                return [];
            }

            // Re-throw unexpected errors
            throw err;
        }

        if (!queryEmbedding?.length) {
            logger.warn("Embedding service returned empty vector — semanticSearch returning []");
            return [];
        }

        // Perform vector similarity search
        return pgVectorStore.searchSimilar({
            repositoryId,
            embedding: queryEmbedding,
            limit,
        });

    }

}

export default new SemanticSearchService();