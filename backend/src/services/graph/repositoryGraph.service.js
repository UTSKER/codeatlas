import prisma from "../../config/prisma.js";

export const buildModuleGraph = async ({
    repositoryId,
    directory,
    limit = 500,
}) => {
    const files = await prisma.file.findMany({
        where: {
            repositoryId,
            isDirectory: false,
            ...(directory ? { path: { startsWith: `${directory}/` } } : {}),
        },
        select: {
            id: true,
            path: true,
            language: true,
        },
        orderBy: {
            path: "asc",
        },
        take: limit,
    });

    const imports = await prisma.import.findMany({
        where: {
            file: {
                repositoryId,
                ...(directory ? { path: { startsWith: `${directory}/` } } : {}),
            },
            resolvedFileId: {
                not: null,
            },
        },
        include: {
            file: {
                select: {
                    id: true,
                    path: true,
                },
            },
            resolvedFile: {
                select: {
                    id: true,
                    path: true,
                },
            },
        },
        take: limit,
    });

    return {
        nodes: files,
        edges: imports
            .filter(item => item.resolvedFile)
            .map(item => ({
                type: "IMPORTS",
                source: item.file.id,
                target: item.resolvedFile.id,
                sourcePath: item.file.path,
                targetPath: item.resolvedFile.path,
                importSource: item.source,
            })),
    };
};
