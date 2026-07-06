import fs from "fs/promises";
import path from "path";

import prisma from "../config/prisma.js";

const fileSelect = {
    id: true,
    path: true,
    name: true,
    extension: true,
    language: true,
    size: true,
    isDirectory: true,
    parentPath: true,
};

const symbolSelect = {
    id: true,
    name: true,
    kind: true,
    startLine: true,
    startColumn: true,
    endLine: true,
    endColumn: true,
    exported: true,
    signature: true,
    parentSymbolId: true,
    file: {
        select: {
            id: true,
            path: true,
        },
    },
};

const SYMBOL_KINDS = new Set([
    "FUNCTION",
    "METHOD",
    "CLASS",
    "VARIABLE",
    "CONSTANT",
    "INTERFACE",
    "TYPE",
    "ENUM",
]);

const SYMBOL_KIND_ALIASES = {
    FUNCTIONS: "FUNCTION",
    METHODS: "METHOD",
    CLASSES: "CLASS",
    VARIABLES: "VARIABLE",
    CONSTANTS: "CONSTANT",
    INTERFACES: "INTERFACE",
    TYPES: "TYPE",
    ENUMS: "ENUM",
};

const getRepository = async (repositoryId) => {
    const repository = await prisma.repository.findUnique({
        where: {
            id: repositoryId,
        },
    });

    if (!repository) {
        throw new Error("Repository not found");
    }

    return repository;
};

const contains = (value) => ({
    contains: value,
    mode: "insensitive",
});

const normalizeSymbolKind = (kind) => {
    if (!kind) {
        return null;
    }

    const normalized =
        SYMBOL_KIND_ALIASES[String(kind).trim().toUpperCase()] ??
        String(kind).trim().toUpperCase();

    if (!SYMBOL_KINDS.has(normalized)) {
        throw new Error(
            `Invalid symbol kind '${kind}'. Expected one of: ${[...SYMBOL_KINDS].join(", ")}.`
        );
    }

    return normalized;
};

export const searchSymbols = async ({
    repositoryId,
    query,
    kind,
    limit = 25,
}) => {
    const normalizedKind = normalizeSymbolKind(kind);

    return prisma.symbol.findMany({
        where: {
            ...(query ? { name: contains(query) } : {}),
            ...(normalizedKind ? { kind: normalizedKind } : {}),
            file: {
                repositoryId,
            },
        },
        select: symbolSelect,
        orderBy: [
            {
                name: "asc",
            },
        ],
        take: limit,
    });
};

export const searchFiles = async ({
    repositoryId,
    query,
    extension,
    language,
    limit = 50,
}) => {
    return prisma.file.findMany({
        where: {
            repositoryId,
            isDirectory: false,
            ...(query
                ? {
                    OR: [
                        { path: contains(query) },
                        { name: contains(query) },
                    ],
                }
                : {}),
            ...(extension ? { extension } : {}),
            ...(language ? { language } : {}),
        },
        select: fileSelect,
        orderBy: {
            path: "asc",
        },
        take: limit,
    });
};

export const listFiles = async ({
    repositoryId,
    directory,
    recursive = true,
    limit = 200,
}) => {
    return prisma.file.findMany({
        where: {
            repositoryId,
            isDirectory: false,
            ...(directory
                ? recursive
                    ? { path: { startsWith: `${directory}/` } }
                    : { parentPath: directory }
                : {}),
        },
        select: fileSelect,
        orderBy: {
            path: "asc",
        },
        take: limit,
    });
};

export const listDirectories = async ({
    repositoryId,
    directory,
    recursive = false,
    limit = 200,
}) => {
    return prisma.file.findMany({
        where: {
            repositoryId,
            isDirectory: true,
            ...(directory
                ? recursive
                    ? { path: { startsWith: `${directory}/` } }
                    : { parentPath: directory }
                : {}),
        },
        select: fileSelect,
        orderBy: {
            path: "asc",
        },
        take: limit,
    });
};

export const loadFile = async ({
    repositoryId,
    path: filePath,
    startLine,
    endLine,
}) => {
    const repository = await getRepository(repositoryId);

    if (!repository.localPath) {
        throw new Error("Repository has no localPath. Index the repository first.");
    }

    const file = await prisma.file.findUnique({
        where: {
            repositoryId_path: {
                repositoryId,
                path: filePath,
            },
        },
        select: fileSelect,
    });

    if (!file || file.isDirectory) {
        throw new Error(`File '${filePath}' not found`);
    }

    const absolutePath = path.resolve(repository.localPath, file.path);
    const repositoryRoot = path.resolve(repository.localPath);

    if (
        absolutePath !== repositoryRoot &&
        !absolutePath.startsWith(`${repositoryRoot}${path.sep}`)
    ) {
        throw new Error("Resolved file path escapes repository root.");
    }

    const content = await fs.readFile(absolutePath, "utf8");
    const lines = content.split("\n");
    const from = Math.max((startLine ?? 1) - 1, 0);
    const to = Math.min(endLine ?? lines.length, lines.length);

    return {
        file,
        startLine: from + 1,
        endLine: to,
        content: lines.slice(from, to).join("\n"),
    };
};

export const loadSource = async ({
    repositoryId,
    symbolId,
    symbolName,
    contextLines = 3,
}) => {
    const symbol = symbolId
        ? await prisma.symbol.findFirst({
            where: {
                id: symbolId,
                file: {
                    repositoryId,
                },
            },
            select: symbolSelect,
        })
        : await prisma.symbol.findFirst({
            where: {
                name: symbolName,
                file: {
                    repositoryId,
                },
            },
            select: symbolSelect,
        });

    if (!symbol) {
        throw new Error("Symbol not found");
    }

    const source = await loadFile({
        repositoryId,
        path: symbol.file.path,
        startLine: Math.max(symbol.startLine - contextLines, 1),
        endLine: symbol.endLine + contextLines,
    });

    return {
        symbol,
        ...source,
    };
};

export const loadDirectory = async ({
    repositoryId,
    path: directory,
}) => {
    const [directoryEntry, directories, files] = await Promise.all([
        prisma.file.findFirst({
            where: {
                repositoryId,
                path: directory,
                isDirectory: true,
            },
            select: fileSelect,
        }),
        listDirectories({
            repositoryId,
            directory,
            recursive: false,
        }),
        listFiles({
            repositoryId,
            directory,
            recursive: false,
        }),
    ]);

    return {
        directory: directoryEntry ?? {
            path: directory ?? null,
        },
        directories,
        files,
    };
};

export const findImports = async ({
    repositoryId,
    filePath,
    source,
    limit = 100,
}) => {
    return prisma.import.findMany({
        where: {
            file: {
                repositoryId,
                ...(filePath ? { path: filePath } : {}),
            },
            ...(source ? { source: contains(source) } : {}),
        },
        include: {
            file: {
                select: fileSelect,
            },
            resolvedFile: {
                select: fileSelect,
            },
        },
        take: limit,
    });
};

export const findExports = async ({
    repositoryId,
    filePath,
    name,
    limit = 100,
}) => {
    return prisma.export.findMany({
        where: {
            file: {
                repositoryId,
                ...(filePath ? { path: filePath } : {}),
            },
            ...(name ? { name: contains(name) } : {}),
        },
        include: {
            file: {
                select: fileSelect,
            },
            symbol: {
                select: {
                    id: true,
                    name: true,
                    kind: true,
                    startLine: true,
                    endLine: true,
                },
            },
        },
        take: limit,
    });
};

export const findReferences = async ({
    repositoryId,
    symbolId,
    symbolName,
    limit = 100,
}) => {
    const symbol = symbolId
        ? await prisma.symbol.findFirst({
            where: {
                id: symbolId,
                file: {
                    repositoryId,
                },
            },
            select: symbolSelect,
        })
        : await prisma.symbol.findFirst({
            where: {
                name: symbolName,
                file: {
                    repositoryId,
                },
            },
            select: symbolSelect,
        });

    if (!symbol) {
        throw new Error("Symbol not found");
    }

    const [incomingCalls, outgoingCalls, exports] = await Promise.all([
        prisma.functionCall.findMany({
            where: {
                calleeSymbolId: symbol.id,
            },
            include: {
                file: {
                    select: fileSelect,
                },
                callerSymbol: {
                    select: {
                        id: true,
                        name: true,
                        kind: true,
                    },
                },
            },
            take: limit,
        }),
        prisma.functionCall.findMany({
            where: {
                callerSymbolId: symbol.id,
            },
            include: {
                file: {
                    select: fileSelect,
                },
                calleeSymbol: {
                    select: {
                        id: true,
                        name: true,
                        kind: true,
                    },
                },
            },
            take: limit,
        }),
        prisma.export.findMany({
            where: {
                symbolId: symbol.id,
            },
            include: {
                file: {
                    select: fileSelect,
                },
            },
            take: limit,
        }),
    ]);

    return {
        symbol,
        incomingCalls,
        outgoingCalls,
        exports,
    };
};
