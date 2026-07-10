const VectorStore = require("./vectorStore");
const { cosineSimilarity } = require("../utils/similarity");

class MemoryVectorStore extends VectorStore {
    constructor() {
        super();

        /**
         * Map<repositoryId, EmbeddingRecord[]>
         */
        this.store = new Map();
    }

    async upsert(records) {
        if (!Array.isArray(records)) {
            records = [records];
        }

        for (const record of records) {
            const repositoryRecords =
                this.store.get(record.repositoryId) || [];

            const existingIndex = repositoryRecords.findIndex(
                r => r.chunkId === record.chunkId &&
                     r.provider === record.provider &&
                     r.model === record.model
            );

            if (existingIndex >= 0) {
                repositoryRecords[existingIndex] = record;
            } else {
                repositoryRecords.push(record);
            }

            this.store.set(record.repositoryId, repositoryRecords);
        }
    }

    async search(vector, options = {}) {

        const {
            repositoryId,
            topK = 10,
            minScore = -1
        } = options;

        const repositoryRecords =
            this.store.get(repositoryId) || [];

        const scored = repositoryRecords
            .map(record => ({
                record,
                score: cosineSimilarity(vector, record.vector)
            }))
            .filter(item => item.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        return scored;
    }

    async deleteByRepository(repositoryId) {
        this.store.delete(repositoryId);
    }

    async clear() {
        this.store.clear();
    }

    size(repositoryId) {
        if (!repositoryId) {
            let total = 0;

            for (const records of this.store.values()) {
                total += records.length;
            }

            return total;
        }

        return (this.store.get(repositoryId) || []).length;
    }
}

module.exports = MemoryVectorStore;