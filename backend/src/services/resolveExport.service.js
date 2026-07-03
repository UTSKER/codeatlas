import prisma from "../config/prisma.js";

export const resolveExports = async (repositoryId) => {

    const exports = await prisma.export.findMany({
        where: {
            file: {
                repositoryId,
            },
        },
    });

    let resolved = 0;

    for (const exp of exports) {

        const symbol = await prisma.symbol.findFirst({
            where: {
                fileId: exp.fileId,
                name: exp.name,
            },
        });

        if (!symbol) {
            continue;
        }

        await prisma.export.update({
            where: {
                id: exp.id,
            },
            data: {
                symbolId: symbol.id,
            },
        });

        resolved++;
    }

    return resolved;
};