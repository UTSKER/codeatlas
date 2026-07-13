import prisma from "../../config/prisma.js";
import axios  from "axios";

const CONFIG_FILE_PATTERNS = [
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "requirements.txt",
    "pyproject.toml",
    "Pipfile",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "composer.json",
    "docker-compose.yml",
    "Dockerfile",
    ".env",
    "tsconfig.json",
    "vite.config",
    "webpack.config",
    "next.config",
    "nuxt.config",
];

/**
 * Probe the embedding service to check if it is reachable.
 * Returns false (not throws) on any failure — the pipeline should
 * simply avoid SEMANTIC_SEARCH rather than crash.
 */
async function checkEmbeddingServiceHealth() {
    const url = process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8000";
    try {
        await axios.get(`${url}/health`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
}

/**
 * Fetch a compact metadata snapshot about a repository.
 *
 * Passed to the Task Planner so the LLM can reason like a senior
 * engineer who already understands the repository's structure and
 * technology stack before choosing a retrieval strategy.
 *
 * @param {string} repositoryId
 * @returns {Promise<object|null>}
 */
export async function getRepositoryMetadata(repositoryId) {
    try {
        const [
            embeddingServiceHealthy,
            repository,
            fileLangGroups,
            topDirs,
            symbolKindGroups,
            callGraphCount,
            importCount,
            totalFiles,
            embeddingCount,
            configFiles,
            entryPointCount,
        ] = await Promise.all([

            // 0 — Is the embedding service reachable right now?
            checkEmbeddingServiceHealth(),

            // 1 — Repository base record
            prisma.repository.findUnique({
                where: { id: repositoryId },
                select: {
                    id: true,
                    name: true,
                    fullName: true,
                    description: true,
                    language: true,
                    defaultBranch: true,
                    status: true,
                    lastIndexedAt: true,
                },
            }),

            // 2 — Language breakdown
            prisma.file.groupBy({
                by: ["language"],
                where: {
                    repositoryId,
                    isDirectory: false,
                    language: { not: null },
                },
                _count: { id: true },
                orderBy: { _count: { id: "desc" } },
                take: 10,
            }),

            // 3 — Top-level directories (scoped to this repo)
            prisma.file.findMany({
                where: {
                    repositoryId,
                    isDirectory: false,
                    OR: [
                        { parentPath: "" },
                        { parentPath: "." },
                        { parentPath: null },
                    ],
                },
                select: { path: true, name: true },
                orderBy: { path: "asc" },
                take: 30,
            }),

            // 4 — Symbol kind counts
            prisma.symbol.groupBy({
                by: ["kind"],
                where: {
                    file: { repositoryId },
                },
                _count: { id: true },
                orderBy: { _count: { id: "desc" } },
            }),

            // 5 — Call graph edge count
            prisma.functionCall.count({
                where: {
                    file: { repositoryId },
                },
            }),

            // 6 — Import edge count
            prisma.import.count({
                where: {
                    file: { repositoryId },
                },
            }),

            // 7 — Total file count
            prisma.file.count({
                where: {
                    repositoryId,
                    isDirectory: false,
                },
            }),

            // 8 — Embedding count
            prisma.codeEmbedding.count({
                where: { repositoryId },
            }),

            // 9 — Configuration files
            prisma.file.findMany({
                where: {
                    repositoryId,
                    isDirectory: false,
                    OR: CONFIG_FILE_PATTERNS.map(name => ({
                        name: { contains: name, mode: "insensitive" },
                    })),
                },
                select: { path: true, name: true },
                take: 20,
            }),

            // 10 — Entry point candidates
            prisma.symbol.count({
                where: {
                    file: { repositoryId },
                    kind: { in: ["FUNCTION", "METHOD"] },
                    incomingCalls: { none: {} },
                },
            }),

        ]);

        if (!repository) {
            return null;
        }

        const languages = fileLangGroups.map(g => ({
            language: g.language,
            fileCount: g._count.id,
        }));

        const symbolKinds = Object.fromEntries(
            symbolKindGroups.map(g => [g.kind, g._count.id])
        );

        const totalSymbols = symbolKindGroups.reduce(
            (sum, g) => sum + g._count.id,
            0
        );

        const primaryLanguage =
            repository.language ??
            languages[0]?.language ??
            null;

        const capabilities = [];

        // Only advertise SEMANTIC_SEARCH when the embedding service is reachable.
        // This prevents the Planner from picking a strategy that will always fail.
        if (embeddingCount > 0 && embeddingServiceHealthy) {
            capabilities.push("SEMANTIC_SEARCH");
        }

        if (totalSymbols > 0) {
            capabilities.push("EXACT_SYMBOL_LOOKUP");
            capabilities.push("SOURCE_READING");
        }

        if (callGraphCount > 0) {
            capabilities.push("GRAPH_TRAVERSAL");
        }

        if (importCount > 0) {
            capabilities.push("IMPORT_TRAVERSAL");
        }

        if (topDirs.length > 0 || totalFiles > 0) {
            capabilities.push("FILE_EXPLORATION");
        }

        if (configFiles.length > 0) {
            capabilities.push("DEPENDENCY_ANALYSIS");
        }

        const packageManager = inferPackageManager(
            configFiles.map(f => f.name),
            primaryLanguage
        );

        return {
            id: repository.id,
            name: repository.name,
            fullName: repository.fullName,
            description: repository.description,
            primaryLanguage,
            defaultBranch: repository.defaultBranch,
            indexingStatus: repository.status,
            lastIndexedAt: repository.lastIndexedAt,
            languages,
            topLevelDirectories: topDirs.map(d => d.path || d.name),
            totalFiles,
            symbols: {
                total: totalSymbols,
                byKind: symbolKinds,
            },
            embeddings: {
                count: embeddingCount,
                available: embeddingCount > 0,
                serviceHealthy: embeddingServiceHealthy,
            },
            callGraphEdges: callGraphCount,
            importEdges: importCount,
            entryPointCandidates: entryPointCount,
            configurationFiles: configFiles.map(f => f.path),
            packageManager,
            availableStrategies: capabilities,
        };

    } catch (error) {
        console.warn(
            `[TaskPlanner] Failed to fetch repository metadata for ${repositoryId}: ${error.message}`
        );
        return null;
    }
}

function inferPackageManager(configFileNames, primaryLanguage) {
    const names = configFileNames.map(n => n.toLowerCase());

    if (names.some(n => n.includes("pnpm-lock"))) return "pnpm";
    if (names.some(n => n.includes("yarn.lock"))) return "yarn";
    if (names.some(n => n.includes("package-lock") || n === "package.json")) {
        return "npm";
    }
    if (names.some(n => n.includes("requirements.txt") || n.includes("pipfile"))) {
        return "pip";
    }
    if (names.some(n => n.includes("pyproject.toml"))) return "poetry";
    if (names.some(n => n.includes("cargo.toml"))) return "cargo";
    if (names.some(n => n.includes("go.mod"))) return "go";
    if (names.some(n => n.includes("pom.xml") || n.includes("build.gradle"))) {
        return "maven/gradle";
    }
    if (names.some(n => n.includes("gemfile"))) return "bundler";

    if (primaryLanguage === "JavaScript" || primaryLanguage === "TypeScript") {
        return "npm (inferred)";
    }

    return null;
}
