export const RetrievalStrategy = Object.freeze({
    SEMANTIC_SEARCH: "SEMANTIC_SEARCH",
    EXACT_SYMBOL_LOOKUP: "EXACT_SYMBOL_LOOKUP",
    GRAPH_TRAVERSAL: "GRAPH_TRAVERSAL",
    IMPORT_TRAVERSAL: "IMPORT_TRAVERSAL",
    FILE_EXPLORATION: "FILE_EXPLORATION",
    SOURCE_READING: "SOURCE_READING",
    DEPENDENCY_ANALYSIS: "DEPENDENCY_ANALYSIS",
    HYBRID: "HYBRID",
});

export const VerifierDiagnosis = Object.freeze({
    SUCCESS: "SUCCESS",
    EMPTY_RESULT: "EMPTY_RESULT",
    WRONG_TOOL: "WRONG_TOOL",
    WRONG_STRATEGY: "WRONG_STRATEGY",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
    CONFLICTING_EVIDENCE: "CONFLICTING_EVIDENCE",
    REPOSITORY_LIMITATION: "REPOSITORY_LIMITATION",
});

export const STRATEGY_TOOL_MAP = {
    [RetrievalStrategy.SEMANTIC_SEARCH]: [
        "semanticSearch",
        "searchFiles",
    ],
    [RetrievalStrategy.EXACT_SYMBOL_LOOKUP]: [
        "searchSymbols",
        "searchFunctions",
        "searchClasses",
        "findReferences",
    ],
    [RetrievalStrategy.GRAPH_TRAVERSAL]: [
        "findCallers",
        "findCallees",
        "expandIncoming",
        "expandOutgoing",
        "traceCallPath",
        "traceRequestLifecycle",
        "findEntryPoints",
        "findImplementations",
        "dependencyGraph",
        "moduleGraph",
        "inheritanceGraph",
    ],
    [RetrievalStrategy.IMPORT_TRAVERSAL]: [
        "findImports",
        "resolveImports",
        "findExports",
        "resolveExports",
    ],
    [RetrievalStrategy.FILE_EXPLORATION]: [
        "searchFiles",
        "listFiles",
        "listDirectories",
        "loadDirectory",
        "loadFile",
    ],
    [RetrievalStrategy.SOURCE_READING]: [
        "loadSource",
        "loadFile",
    ],
    [RetrievalStrategy.DEPENDENCY_ANALYSIS]: [
        "searchFiles",
        "loadFile",
        "findImports",
        "dependencyGraph",
        "moduleGraph",
    ],
};
