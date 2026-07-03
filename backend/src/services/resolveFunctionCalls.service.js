import prisma from "../config/prisma.js";

export const resolveFunctionCalls = async (repositoryId) => {

    const calls = await prisma.functionCall.findMany({
        where: {
            file: {
                repositoryId,
            },
        },
    });

    let resolved = 0;

    for (const call of calls) {

        // Find caller symbol in the same file
        const caller = await prisma.symbol.findFirst({
            where: {
                fileId: call.fileId,
                name: call.callerName,
            },
        });

        // Find callee symbol anywhere in the repository
        const callee = await prisma.symbol.findFirst({
            where: {
                file: {
                    repositoryId,
                },
                name: call.calleeName.split(".").pop(), // jwt.sign -> sign
            },
        });

        await prisma.functionCall.update({
            where: {
                id: call.id,
            },
            data: {
                callerSymbolId: caller?.id,
                calleeSymbolId: callee?.id,
                resolved: !!caller && !!callee,
            },
        });

        if (caller && callee) {
            resolved++;
        }
    }

    return resolved;
};