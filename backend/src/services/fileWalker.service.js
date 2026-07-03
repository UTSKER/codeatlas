import fs from "fs/promises";
import path from "path";

const IGNORE_DIRECTORIES = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".cache",
    "coverage",
    "out",
    ".turbo",
    ".vscode",
]);

const IGNORE_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".mp4",
    ".mp3",
    ".exe",
    ".dll",
    ".class",
    ".jar",
    ".log",
    ".lock",
]);

const IGNORE_FILES = new Set([
    ".DS_Store",
    ".env",
    ".env.local",
]);

export const walkRepository = async (rootPath) => {
    async function walk(currentPath) {
        const stats = await fs.stat(currentPath);

        const node = {
            name: path.basename(currentPath),
            path: path.relative(rootPath, currentPath) || ".",
            type: stats.isDirectory() ? "directory" : "file",
        };

        if (!stats.isDirectory()) {
            node.extension = path.extname(currentPath);
            node.size = stats.size;
            return node;
        }

        const entries = await fs.readdir(currentPath);

        node.children = [];

        for (const entry of entries) {
            if (IGNORE_DIRECTORIES.has(entry)) continue;
            if (IGNORE_FILES.has(entry)) continue;

            const fullPath = path.join(currentPath, entry);

            const childStats = await fs.stat(fullPath);

            if (
                childStats.isFile() &&
                IGNORE_EXTENSIONS.has(path.extname(entry))
            ) {
                continue;
            }

            node.children.push(await walk(fullPath));
        }

        return node;
    }

    return walk(rootPath);
};