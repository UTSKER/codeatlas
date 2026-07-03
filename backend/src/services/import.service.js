import prisma from "../config/prisma.js";

export const saveImports = async (fileId, imports) => {
    if (!imports.length) {
        return 0;
    }

    const now = new Date();

    await prisma.import.createMany({
        data: imports.map((item) => ({
            fileId,
            source: item.source,
            type: item.type,
            resolved: false,
            createdAt: now,
            updatedAt: now,
        })),
    });

    return imports.length;
};