import prisma from "../config/prisma.js";

export const saveFunctionCalls = async (fileId, functionCalls) => {

    if (!functionCalls.length) {
        return 0;
    }

    await prisma.functionCall.createMany({
        data: functionCalls.map((call) => ({
            fileId,
            callerName: call.callerName,
            calleeName: call.calleeName,
            line: call.line,
            column: call.column,
        })),
    });

    return functionCalls.length;
};