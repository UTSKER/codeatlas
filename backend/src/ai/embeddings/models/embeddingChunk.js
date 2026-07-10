class EmbeddingChunk {
    constructor({
        id,
        repositoryId,
        type,
        path,
        content,
        symbolName = null,
        language = null,
        startLine = null,
        endLine = null,
        startOffset = null,
        endOffset = null,
        hash = null,
        metadata = {},
    }) {
        this.id = id;

        this.repositoryId = repositoryId;

        this.type = type;

        this.path = path;

        this.content = content;

        this.symbolName = symbolName;

        this.language = language;

        this.startLine = startLine;

        this.endLine = endLine;

        this.startOffset = startOffset;

        this.endOffset = endOffset;

        this.hash = hash;

        this.metadata = metadata;
    }
}

module.exports = EmbeddingChunk;