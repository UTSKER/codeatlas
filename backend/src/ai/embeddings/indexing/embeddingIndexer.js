import prisma from "../../../config/prisma.js";

import embeddingService from "../services/embeddingService.js";
import sourceCodeService from "../services/sourceCode.service.js";
import embeddingTextBuilder from "../services/embeddingTextBuilder.service.js";

import embeddingDocumentBuilder from "../services/embeddingDocument.builder.js";
import pgVectorStore from "../../../ai/vector/pgVectorStore.js";

class EmbeddingIndexerService {

    BATCH_SIZE = 8;

    async indexRepository(repositoryId) {

        const repository = await prisma.repository.findUnique({
            where: {
                id: repositoryId,
            },
        });

        if (!repository) {
            throw new Error("Repository not found.");
        }

        const symbols = await prisma.symbol.findMany({
            where: {
                file: {
                    repositoryId,
                },
                kind: {
                    in: [
                        "FUNCTION",
                        "METHOD",
                        "CLASS",
                    ],
                },
            },
            include: {
                file: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        console.log(`Found ${symbols.length} symbols.`);

        let processed = 0;

        for (
            let start = 0;
            start < symbols.length;
            start += this.BATCH_SIZE
        ) {

            const batch = symbols.slice(
                start,
                start + this.BATCH_SIZE
            );

            const texts = [];

            for (const symbol of batch) {

                const code =
                    await sourceCodeService.getSymbolCode(
                        repository,
                        symbol
                    );

                const text =
                    embeddingTextBuilder.build(
                        symbol,
                        code
                    );

                texts.push(text);

            }

            console.log(
                `Embedding batch ${Math.floor(start / this.BATCH_SIZE) + 1
                } (${batch.length} symbols)...`
            );

            const vectors =
                await embeddingService.generateEmbeddings(
                    texts
                );

            const documents = [];

            for (let i = 0; i < batch.length; i++) {

                documents.push(

                    embeddingDocumentBuilder.build({

                        repository,

                        symbol: batch[i],

                        content: texts[i],

                        embedding: vectors[i],

                    })

                );

            }

            await pgVectorStore.upsertBatch(documents);

            processed += batch.length;

            console.log(
                `Progress: ${processed}/${symbols.length}`
            );

        }

        console.log(
            `Finished embedding ${processed} symbols.`
        );

        return {
            repositoryId,
            indexed: processed,
        };

    }

}

export default new EmbeddingIndexerService();