import prisma from "../../config/prisma.js";

/**
 * Find a symbol inside a repository by name.
 */
export const findSymbol = async (repositoryId, query) => {
    return prisma.symbol.findFirst({
        where: {
            name: query,
            file: {
                repositoryId,
            },
        },
        include: {
            file: {
                select: {
                    id: true,
                    path: true,
                },
            },
        },
    });
};

/**
 * Get all outgoing calls from a symbol.
 */
export const getOutgoingCalls = async (symbolId) => {
    return prisma.functionCall.findMany({
        where: {
            callerSymbolId: symbolId,
            resolved: true,
        },
        include: {
            calleeSymbol: {
                include: {
                    file: {
                        select: {
                            id: true,
                            path: true,
                        },
                    },
                },
            },
        },
    });
};

/**
 * Get all incoming calls to a symbol.
 */
export const getIncomingCalls = async (symbolId) => {
    return prisma.functionCall.findMany({
        where: {
            calleeSymbolId: symbolId,
            resolved: true,
        },
        include: {
            callerSymbol: {
                include: {
                    file: {
                        select: {
                            id: true,
                            path: true,
                        },
                    },
                },
            },
        },
    });
};

export const findSymbolByIdOrName = async ({
    repositoryId,
    symbolId,
    symbolName,
}) => {
    if (symbolId) {
        return prisma.symbol.findFirst({
            where: {
                id: symbolId,
                file: {
                    repositoryId,
                },
            },
            include: {
                file: {
                    select: {
                        id: true,
                        path: true,
                    },
                },
            },
        });
    }

    return findSymbol(repositoryId, symbolName);
};

export const expandOutgoing = async ({
    repositoryId,
    symbolId,
    symbolName,
}) => {
    const symbol = await findSymbolByIdOrName({
        repositoryId,
        symbolId,
        symbolName,
    });

    if (!symbol) {
        throw new Error("Symbol not found");
    }

    return {
        symbol,
        calls: await getOutgoingCalls(symbol.id),
    };
};

export const expandIncoming = async ({
    repositoryId,
    symbolId,
    symbolName,
}) => {
    const symbol = await findSymbolByIdOrName({
        repositoryId,
        symbolId,
        symbolName,
    });

    if (!symbol) {
        throw new Error("Symbol not found");
    }

    return {
        symbol,
        calls: await getIncomingCalls(symbol.id),
    };
};

export const findCallers = expandIncoming;

export const findCallees = expandOutgoing;

export const traceCallPath = async ({
    repositoryId,
    from,
    to,
    maxDepth = 5,
}) => {
    const start = await findSymbol(repositoryId, from);
    const target = await findSymbol(repositoryId, to);

    if (!start || !target) {
        throw new Error("Start or target symbol not found");
    }

    const queue = [{
        symbol: start,
        path: [start],
    }];
    const visited = new Set([start.id]);

    while (queue.length) {
        const current = queue.shift();

        if (current.symbol.id === target.id) {
            return {
                found: true,
                path: current.path,
            };
        }

        if (current.path.length > maxDepth) {
            continue;
        }

        const calls = await getOutgoingCalls(current.symbol.id);

        for (const call of calls) {
            if (!call.calleeSymbol || visited.has(call.calleeSymbol.id)) {
                continue;
            }

            visited.add(call.calleeSymbol.id);
            queue.push({
                symbol: call.calleeSymbol,
                path: [
                    ...current.path,
                    call.calleeSymbol,
                ],
            });
        }
    }

    return {
        found: false,
        path: [],
    };
};

export const findEntryPoints = async ({
    repositoryId,
    query,
    limit = 50,
}) => {
    const symbols = await prisma.symbol.findMany({
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
                in: ["FUNCTION", "METHOD"],
            },
            file: {
                repositoryId,
            },
            incomingCalls: {
                none: {},
            },
        },
        include: {
            file: {
                select: {
                    id: true,
                    path: true,
                },
            },
        },
        take: limit,
    });

    return symbols;
};

export const traceRequestLifecycle = async ({
    repositoryId,
    query,
    depth = 5,
}) => {
    const symbol = await findSymbol(repositoryId, query);

    if (!symbol) {
        const entryPoints = await findEntryPoints({
            repositoryId,
            query,
        });

        return {
            symbol: null,
            entryPoints,
            tree: [],
        };
    }

    return buildCallTreeByQuery(
        repositoryId,
        symbol.name,
        depth
    );
};

/**
 * Recursively build a call tree.
 */
export const buildCallTree = async (
    symbolId,
    depth = 5,
    visited = new Set()
) => {
    if (!symbolId) {
        return [];
    }

    if (depth <= 0) {
        return [];
    }

    if (visited.has(symbolId)) {
        return [];
    }

    visited.add(symbolId);

    const calls = await getOutgoingCalls(symbolId);

    const tree = [];

    for (const call of calls) {
        if (!call.calleeSymbol) continue;

        tree.push({
            id: call.calleeSymbol.id,
            name: call.calleeSymbol.name,
            kind: call.calleeSymbol.kind,
            file: call.calleeSymbol.file.path,
            children: await buildCallTree(
                call.calleeSymbol.id,
                depth - 1,
                visited
            ),
        });
    }

    return tree;
};

/**
 * Main API for graph queries.
 */
export const buildCallTreeByQuery = async (
    repositoryId,
    query,
    depth = 5
) => {
    const symbol = await findSymbol(repositoryId, query);

    if (!symbol) {
        throw new Error(`Symbol '${query}' not found`);
    }

    const outgoing = await getOutgoingCalls(symbol.id);

    const incoming = await getIncomingCalls(symbol.id);

    const tree = await buildCallTree(symbol.id, depth);

    return {
        symbol: {
            id: symbol.id,
            name: symbol.name,
            kind: symbol.kind,
            file: symbol.file.path,
        },
        outgoingCount: outgoing.length,
        incomingCount: incoming.length,
        tree,
    };
};
