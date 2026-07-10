class EmbeddingProvider {
    /**
     * Generate embedding for a single text.
     * @param {string} text
     * @returns {Promise<number[]>}
     */
    async embed(text) {
        throw new Error("embed() not implemented.");
    }

    /**
     * Generate embeddings for multiple texts.
     * @param {string[]} texts
     * @returns {Promise<number[][]>}
     */
    async embedBatch(texts) {
        throw new Error("embedBatch() not implemented.");
    }

    /**
     * Returns provider metadata.
     */
    getInfo() {
        throw new Error("getInfo() not implemented.");
    }
}

module.exports = EmbeddingProvider;