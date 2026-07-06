import prisma from "../../config/prisma.js";

export const buildDependencyGraph = async ({
    repositoryId,
    filePath,
    direction = "outgoing",
    depth = 2,
}) => {
    const startFiles = await prisma.file.findMany({
        where: {
            repositoryId,
            isDirectory: false,
            ...(filePath ? { path: filePath } : {}),
        },
        select: {
            id: true,
            path: true,
        },
        take: filePath ? 1 : 200,
    });

    const nodes = new Map();
    const edges = [];
    const visited = new Set();

    const addNode = (file) => {
        if (file) nodes.set(file.id, file);
    };

    const walk = async (file, remainingDepth) => {
        const key = `${file.id}:${remainingDepth}:${direction}`;

        if (visited.has(key) || remainingDepth < 0) return;

        visited.add(key);
        addNode(file);

        const imports = await prisma.import.findMany({
            where: direction === "incoming"
                ? {
                    resolvedFileId: file.id,
                }
                : {
                    fileId: file.id,
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
        });

        for (const item of imports) {
            const from = item.file;
            const to = item.resolvedFile;

            if (!from || !to) continue;

            addNode(from);
            addNode(to);

            edges.push({
                type: "IMPORTS",
                source: from.id,
                target: to.id,
                sourcePath: from.path,
                targetPath: to.path,
                importSource: item.source,
            });

            const next = direction === "incoming" ? from : to;
            await walk(next, remainingDepth - 1);
        }
    };

    for (const file of startFiles) {
        await walk(file, depth);
    }

    return {
        nodes: [...nodes.values()],
        edges,
    };
};
