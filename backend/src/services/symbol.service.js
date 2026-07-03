import prisma from "../config/prisma.js";

export const saveSymbols = async (fileId, symbols) => {

    if (!symbols.length) {
        return 0;
    }

    await prisma.symbol.createMany({
        data: symbols.map(symbol => ({
            fileId,
            ...symbol,
        })),
    });

    return symbols.length;
};