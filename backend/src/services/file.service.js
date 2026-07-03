import prisma from "../config/prisma.js";
import path from "path";
import { detectLanguage } from "../services/language.service.js";

export const saveFileTree = async (repositoryId, node) => {
    const files = [];

    const flatten = (current) => {
        files.push({
            repositoryId,
            name: current.name,
            path: current.path,
            extension: current.type === "file" ? path.extname(current.name) : null,
            language: current.type === "file" ? detectLanguage(path.extname(current.name)) : null,
            size: current.size ?? 0,
            isDirectory: current.type === "directory",
            parentPath:
                current.path === "."
                    ? null
                    : path.dirname(current.path) === "."
                        ? null
                        : path.dirname(current.path),
        });

        if (current.children) {
            current.children.forEach(flatten);
        }
    };

    flatten(node);

    await prisma.file.deleteMany({
        where: {
            repositoryId,
        },
    });

    await prisma.file.createMany({
        data: files,
    });
    await prisma.file.createMany({
        data: files,
        skipDuplicates: true,
    });

    return files.length;
};