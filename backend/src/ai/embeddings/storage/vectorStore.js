class VectorStore {

    async upsert(chunks) {
        throw new Error("upsert() not implemented.");
    }

    async search(vector, options = {}) {
        throw new Error("search() not implemented.");
    }

    async deleteByRepository(repositoryId) {
        throw new Error("deleteByRepository() not implemented.");
    }

    async clear() {
        throw new Error("clear() not implemented.");
    }
}

module.exports = VectorStore;