class EmbeddingRecord {

    constructor({
        chunkId,
        repositoryId,
        vector,
        provider,
        model,
        dimensions,
        metadata = {},
    }) {

        this.chunkId = chunkId;

        this.repositoryId = repositoryId;

        this.vector = vector;

        this.provider = provider;

        this.model = model;

        this.dimensions = dimensions;

        this.metadata = metadata;
    }

}

module.exports = EmbeddingRecord;