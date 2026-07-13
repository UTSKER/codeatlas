class EmbeddingDocumentBuilder {

    build({
        repository,
        symbol,
        content,
        embedding,
        chunkIndex = 0,
    }) {

        return {

            repositoryId: repository.id,

            fileId: symbol.fileId,

            symbolId: symbol.id,

            symbolName: symbol.name,

            symbolKind: symbol.kind,

            filePath: symbol.file.path,

            chunkIndex,

            content,

            embedding,

        };

    }

}

export default new EmbeddingDocumentBuilder();