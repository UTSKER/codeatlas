import prisma from "../config/prisma.js";
import path from "path";

export const resolveImports = async (repositoryId) => {

    // Load all files
    const files = await prisma.file.findMany({
        where: {
            repositoryId,
            isDirectory: false,
        },
    });

    // Fast lookup
    const fileMap = new Map();

    for (const file of files) {
        fileMap.set(file.path, file);
    }

    // Load only unresolved internal imports
    const imports = await prisma.import.findMany({
        where: {
            file: {
                repositoryId,
            },
            type: "INTERNAL",
        },
        include: {
            file: true,
        },
    });

    let resolved = 0;

    for (const imp of imports) {

        let resolvedPath = path.normalize(
            path.join(
                path.dirname(imp.file.path),
                imp.source
            )
        );

        // Remove Windows slashes
        resolvedPath = resolvedPath.replace(/\\/g, "/");

        // Try extensions
        const candidates = [
            resolvedPath,
            `${resolvedPath}.js`,
            `${resolvedPath}.jsx`,
            `${resolvedPath}.ts`,
            `${resolvedPath}.tsx`,
            `${resolvedPath}/index.js`,
            `${resolvedPath}/index.ts`,
        ];

        let target = null;

        for (const candidate of candidates) {

            if (fileMap.has(candidate)) {
                target = fileMap.get(candidate);
                break;
            }
        }

        if (!target) {
            continue;
        }

        await prisma.import.update({
            where: {
                id: imp.id,
            },
            data: {
                resolved: true,
                resolvedFileId: target.id,
            },
        });

        resolved++;
    }

    return resolved;
};
