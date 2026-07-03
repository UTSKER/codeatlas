import prisma from "../config/prisma.js";
import path from "path";

import { cloneRepository } from "./clone.service.js";
import { walkRepository } from "./fileWalker.service.js";
import { saveFileTree } from "./file.service.js";

import { parseFile } from "../parsers/parserTest.service.js";

import { saveSymbols } from "./symbol.service.js";
import { saveImports } from "./import.service.js";
import { saveFunctionCalls } from "./functionCall.service.js";
import { resolveFunctionCalls } from "./resolveFunctionCalls.service.js";

import { resolveImports } from "./importResolver.service.js";

import { saveExports } from "./export.service.js";
import { resolveExports } from "./resolveExport.service.js";

let extractedExports = 0;

export const indexRepositoryService = async (repositoryId) => {

    const repository = await prisma.repository.findUnique({
        where: {
            id: repositoryId,
        },
    });

    if (!repository) {
        throw new Error("Repository not found");
    }

    await prisma.repository.update({
        where: {
            id: repository.id,
        },
        data: {
            status: "CLONING",
        },
    });

    const localPath = await cloneRepository(repository);

    await prisma.repository.update({
        where: {
            id: repository.id,
        },
        data: {
            localPath,
            status: "PARSING",
        },
    });

    const tree = await walkRepository(localPath);

    const filesIndexed = await saveFileTree(
        repository.id,
        tree
    );

    // Clean previous index

    await prisma.symbol.deleteMany({
        where: {
            file: {
                repositoryId: repository.id,
            },
        },
    });

    await prisma.import.deleteMany({
        where: {
            file: {
                repositoryId: repository.id,
            },
        },
    });

    await prisma.export.deleteMany({
        where: {
            file: {
                repositoryId: repository.id,
            },
        },
    });

    await prisma.functionCall.deleteMany({
        where: {
            file: {
                repositoryId: repository.id,
            },
        },
    });

    const jsFiles = await prisma.file.findMany({
        where: {
            repositoryId: repository.id,
            language: "javascript",
            isDirectory: false,
        },
    });

    let parsedFiles = 0;
    let extractedSymbols = 0;
    let extractedImports = 0;
    let extractedFunctionCalls = 0;
    let failedFiles = 0;

    for (const file of jsFiles) {

        try {

            const absolutePath = path.join(
                localPath,
                file.path
            );

            const result = await parseFile(
                absolutePath
            );

            extractedSymbols += await saveSymbols(
                file.id,
                result.symbols
            );

            extractedImports += await saveImports(
                file.id,
                result.imports
            );

            extractedExports += await saveExports(
                file.id,
                result.exports
            );

            extractedFunctionCalls +=
                await saveFunctionCalls(
                    file.id,
                    result.functionCalls
                );

            parsedFiles++;

        } catch (err) {

            failedFiles++;

            console.error(
                `Failed: ${file.path}`
            );

            console.error(err.message);

        }

    }

    const resolvedImports =
        await resolveImports(repository.id);

    const resolvedExports =
        await resolveExports(repository.id);

    const resolvedFunctionCalls =
        await resolveFunctionCalls(repository.id);

    await prisma.repository.update({
        where: {
            id: repository.id,
        },
        data: {
            status: "READY",
            lastIndexedAt: new Date(),
        },
    });

    return {

        repositoryId: repository.id,

        repository: repository.name,

        filesIndexed,

        parsedFiles,

        extractedSymbols,

        extractedImports,

        extractedFunctionCalls,

        failedFiles,

        resolvedImports,

        resolvedFunctionCalls,

        resolvedExports,

        extractedExports,

        status: "READY",

    };

};