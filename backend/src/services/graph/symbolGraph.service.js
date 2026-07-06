import prisma from "../../config/prisma.js";

const symbolSelect = {
    id: true,
    name: true,
    kind: true,
    startLine: true,
    endLine: true,
    parentSymbolId: true,
    file: {
        select: {
            id: true,
            path: true,
        },
    },
};

export const findImplementations = async ({
    repositoryId,
    query,
    limit = 50,
}) => {
    return prisma.symbol.findMany({
        where: {
            name: {
                contains: query,
                mode: "insensitive",
            },
            kind: {
                in: ["CLASS", "METHOD", "FUNCTION"],
            },
            file: {
                repositoryId,
            },
        },
        select: symbolSelect,
        orderBy: {
            name: "asc",
        },
        take: limit,
    });
};

export const buildInheritanceGraph = async ({
    repositoryId,
    query,
}) => {
    const roots = await prisma.symbol.findMany({
        where: {
            ...(query
                ? {
                    name: {
                        contains: query,
                        mode: "insensitive",
                    },
                }
                : {}),
            kind: {
                in: ["CLASS", "INTERFACE", "TYPE"],
            },
            file: {
                repositoryId,
            },
        },
        select: symbolSelect,
        take: 100,
    });

    const rootIds = roots.map(symbol => symbol.id);

    const children = rootIds.length
        ? await prisma.symbol.findMany({
            where: {
                parentSymbolId: {
                    in: rootIds,
                },
                file: {
                    repositoryId,
                },
            },
            select: symbolSelect,
        })
        : [];

    return {
        nodes: [...roots, ...children],
        edges: children.map(symbol => ({
            type: "INHERITS",
            source: symbol.id,
            target: symbol.parentSymbolId,
        })),
    };
};
