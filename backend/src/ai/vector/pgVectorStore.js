import { randomUUID } from "crypto";
import prisma from "../../config/prisma.js";

class PgVectorStore {

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Insert a single embedding.
     */
    async upsertEmbedding(embedding) {

        return this.upsertBatch([embedding]);

    }

    /**
     * Bulk insert embeddings.
     */
    async upsertBatch(embeddings = []) {

        if (!embeddings.length) {
            return;
        }

        const values = [];
        const parameters = [];

        let index = 1;

        for (const embedding of embeddings) {

            values.push(`(
                $${index++},
                $${index++},
                $${index++},
                $${index++},
                $${index++},
                $${index++}::"SymbolKind",
                $${index++},
                $${index++},
                $${index++},
                $${index++}::vector
            )`);

            parameters.push(

                randomUUID(),

                embedding.repositoryId,

                embedding.fileId,

                embedding.symbolId,

                embedding.symbolName,

                embedding.symbolKind,

                embedding.filePath,

                embedding.chunkIndex ?? 0,

                embedding.content,

                `[${embedding.embedding.join(",")}]`

            );

        }

        const query = `
            INSERT INTO "CodeEmbedding"
            (
                id,
                "repositoryId",
                "fileId",
                "symbolId",
                "symbolName",
                "symbolKind",
                "filePath",
                "chunkIndex",
                content,
                embedding
            )
            VALUES
            ${values.join(",")}
        `;

        await this.prisma.$executeRawUnsafe(
            query,
            ...parameters
        );

    }

    /**
     * Perform semantic similarity search.
     */
    async searchSimilar({
        repositoryId,
        embedding,
        limit = 10,
    }) {

        if (!repositoryId) {
            throw new Error("repositoryId is required.");
        }

        if (!embedding?.length) {
            throw new Error("Embedding is required.");
        }

        const vector = `[${embedding.join(",")}]`;

        const results = await this.prisma.$queryRawUnsafe(
            `
            SELECT

                ce.id,

                ce."repositoryId",

                ce."fileId",

                ce."symbolId",

                ce."symbolName",

                ce."symbolKind"::text AS "symbolKind",

                ce."filePath",

                ce."chunkIndex",

                ce.content,

                1 - (ce.embedding <=> $1::vector) AS score

            FROM "CodeEmbedding" ce

            WHERE ce."repositoryId" = $2

            ORDER BY ce.embedding <=> $1::vector

            LIMIT $3;
            `,
            vector,
            repositoryId,
            limit
        );

        return results.map(result => ({

            id: result.id,

            repositoryId: result.repositoryId,

            score: Number(result.score),

            symbol: {

                id: result.symbolId,

                name: result.symbolName,

                kind: result.symbolKind,

            },

            file: {

                id: result.fileId,

                path: result.filePath,

            },

            chunkIndex: result.chunkIndex,

            content: result.content,

        }));

    }

    /**
     * Delete every embedding belonging to a repository.
     */
    async deleteRepositoryEmbeddings(repositoryId) {

        if (!repositoryId) {
            return;
        }

        await this.prisma.codeEmbedding.deleteMany({

            where: {
                repositoryId,
            },

        });

    }

}

export default new PgVectorStore();