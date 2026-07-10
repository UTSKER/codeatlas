const prisma = require('../../config/prisma');

class PgVectorStore {
    async insertEmbedding() {
        throw new Error('Not implemented');
    }

    async insertBatch() {
        throw new Error('Not implemented');
    }

    async search() {
        throw new Error('Not implemented');
    }

    async deleteRepositoryEmbeddings() {
        throw new Error('Not implemented');
    }
}

module.exports = PgVectorStore;
