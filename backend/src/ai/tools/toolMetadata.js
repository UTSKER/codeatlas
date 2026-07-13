/**
 * Enriched metadata for planner-facing tool descriptions.
 * Merged with toolRegistry.describe() at planning time.
 */
export const TOOL_METADATA = {
    semanticSearch: {
        bestFor: [
            "natural language questions about code behavior",
            "finding concepts when exact symbol names are unknown",
            "locating business logic (auth, billing, routing)",
        ],
        limitations: [
            "requires indexed embeddings — not available if embeddingCount is 0",
            "not for exact symbol name lookup",
            "returns ranked chunks, not full files",
        ],
        strategies: ["SEMANTIC_SEARCH", "HYBRID"],
    },
    searchSymbols: {
        bestFor: [
            "exact or partial symbol name lookup",
            "when you know the function/class name",
        ],
        limitations: [
            "lexical match only — misses synonyms and concepts",
            "returns empty if symbol name differs from query",
        ],
        strategies: ["EXACT_SYMBOL_LOOKUP", "SEMANTIC_SEARCH"],
    },
    searchFunctions: {
        bestFor: ["finding functions by name pattern"],
        limitations: ["name-based only, not semantic"],
        strategies: ["EXACT_SYMBOL_LOOKUP"],
    },
    searchClasses: {
        bestFor: ["finding classes by name pattern"],
        limitations: ["name-based only, not semantic"],
        strategies: ["EXACT_SYMBOL_LOOKUP"],
    },
    searchFiles: {
        bestFor: [
            "finding files by path or name pattern",
            "locating config files (package.json, .env, docker-compose)",
        ],
        limitations: ["does not search file contents semantically"],
        strategies: ["FILE_EXPLORATION", "DEPENDENCY_ANALYSIS", "SEMANTIC_SEARCH"],
    },
    listFiles: {
        bestFor: ["browsing files in a directory"],
        limitations: ["no content search, directory-scoped only"],
        strategies: ["FILE_EXPLORATION"],
    },
    listDirectories: {
        bestFor: ["understanding repository structure"],
        limitations: ["top-level or parent-scoped listing only"],
        strategies: ["FILE_EXPLORATION"],
    },
    loadFile: {
        bestFor: ["reading full file contents when path is known"],
        limitations: ["requires known file path"],
        strategies: ["SOURCE_READING", "FILE_EXPLORATION", "DEPENDENCY_ANALYSIS"],
    },
    loadDirectory: {
        bestFor: ["reading multiple files in a directory"],
        limitations: ["can be large — use with specific directory"],
        strategies: ["FILE_EXPLORATION"],
    },
    loadSource: {
        bestFor: [
            "reading implementation of a known symbol",
            "understanding function/class body",
        ],
        limitations: ["requires symbolId or symbolName from prior search"],
        strategies: ["SOURCE_READING", "HYBRID"],
    },
    findCallers: {
        bestFor: ["who calls this function?", "upstream call chain"],
        limitations: ["requires call graph data and a known symbol"],
        strategies: ["GRAPH_TRAVERSAL", "HYBRID"],
    },
    findCallees: {
        bestFor: ["what does this function call?", "downstream dependencies"],
        limitations: ["requires call graph data and a known symbol"],
        strategies: ["GRAPH_TRAVERSAL", "HYBRID"],
    },
    expandIncoming: {
        bestFor: ["expanding caller graph around a symbol"],
        limitations: ["requires call graph edges > 0"],
        strategies: ["GRAPH_TRAVERSAL"],
    },
    expandOutgoing: {
        bestFor: ["expanding callee graph around a symbol"],
        limitations: ["requires call graph edges > 0"],
        strategies: ["GRAPH_TRAVERSAL"],
    },
    traceCallPath: {
        bestFor: ["tracing execution path between two symbols"],
        limitations: ["requires both symbols exist in call graph"],
        strategies: ["GRAPH_TRAVERSAL"],
    },
    traceRequestLifecycle: {
        bestFor: ["HTTP request flow from entry point to handlers"],
        limitations: ["works best with web frameworks and indexed routes"],
        strategies: ["GRAPH_TRAVERSAL", "HYBRID"],
    },
    findEntryPoints: {
        bestFor: [
            "finding application entry points",
            "locating route handlers and main functions",
        ],
        limitations: ["heuristic — symbols with no incoming calls"],
        strategies: ["GRAPH_TRAVERSAL", "FILE_EXPLORATION"],
    },
    findImplementations: {
        bestFor: ["finding concrete implementations of an interface/abstract class"],
        limitations: ["requires inheritance graph data"],
        strategies: ["GRAPH_TRAVERSAL"],
    },
    findReferences: {
        bestFor: ["all usages of a symbol across the codebase"],
        limitations: ["requires indexed symbol references"],
        strategies: ["EXACT_SYMBOL_LOOKUP", "GRAPH_TRAVERSAL"],
    },
    findImports: {
        bestFor: ["what does this file import?", "module dependencies"],
        limitations: ["requires import index data"],
        strategies: ["IMPORT_TRAVERSAL", "DEPENDENCY_ANALYSIS"],
    },
    resolveImports: {
        bestFor: ["resolving import paths to actual files"],
        limitations: ["requires import index data"],
        strategies: ["IMPORT_TRAVERSAL"],
    },
    findExports: {
        bestFor: ["what does this file export?"],
        limitations: ["requires export index data"],
        strategies: ["IMPORT_TRAVERSAL"],
    },
    resolveExports: {
        bestFor: ["tracing where exported symbols are defined"],
        limitations: ["requires export index data"],
        strategies: ["IMPORT_TRAVERSAL"],
    },
    dependencyGraph: {
        bestFor: [
            "module-level dependency structure",
            "understanding how files connect",
        ],
        limitations: ["graph snapshot — can be large"],
        strategies: ["GRAPH_TRAVERSAL", "DEPENDENCY_ANALYSIS"],
    },
    moduleGraph: {
        bestFor: ["import/export relationships between modules"],
        limitations: ["requires import/export data"],
        strategies: ["GRAPH_TRAVERSAL", "IMPORT_TRAVERSAL"],
    },
    inheritanceGraph: {
        bestFor: ["class hierarchy and inheritance chains"],
        limitations: ["requires OOP language with indexed classes"],
        strategies: ["GRAPH_TRAVERSAL"],
    },
};

export function enrichToolDescription(tool) {
    const meta = TOOL_METADATA[tool.name] ?? {};

    return {
        name: tool.name,
        description: tool.description,
        input: tool.input,
        output: tool.output,
        bestFor: meta.bestFor ?? [],
        limitations: meta.limitations ?? [],
        strategies: meta.strategies ?? [],
    };
}

export function describeToolsForPlanner(tools) {
    return tools.map(enrichToolDescription);
}

export function formatToolCatalog(tools) {
    return tools.map(t => {
        const lines = [
            `- ${t.name}: ${t.description}`,
            `  Output: ${t.output ?? "unknown"}`,
            `  Required inputs: ${JSON.stringify(t.input?.required ?? [])}`,
            `  Optional inputs: ${JSON.stringify(t.input?.optional ?? [])}`,
        ];

        if (t.bestFor?.length) {
            lines.push(`  Best for: ${t.bestFor.join("; ")}`);
        }

        if (t.limitations?.length) {
            lines.push(`  Avoid when: ${t.limitations.join("; ")}`);
        }

        if (t.strategies?.length) {
            lines.push(`  Strategies: ${t.strategies.join(", ")}`);
        }

        return lines.join("\n");
    }).join("\n\n");
}
