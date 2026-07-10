import embeddingClient from "../clients/embeddingClient.js";

class EmbeddingService {

    async generateEmbedding(text) {

        const result =
            await embeddingClient.embed([text]);

        return result.embeddings[0];

    }

    async generateEmbeddings(texts) {

        const result =
            await embeddingClient.embed(texts);

        return result.embeddings;

    }

}

export default new EmbeddingService();