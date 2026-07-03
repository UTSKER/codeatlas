import prisma from "../config/prisma.js";

export const saveExports = async (fileId, exportsList) => {

    if (!exportsList.length) {
        return 0;
    }

    await prisma.export.createMany({
        data: exportsList.map((exp) => ({
            fileId,
            name: exp.name,
            kind: exp.kind,
            isDefault: exp.isDefault,
        })),
    });

    return exportsList.length;
};