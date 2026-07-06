import { toolRegistry } from "./toolRegistry.js";

import searchSymbolsTool from "./searchSymbols.tool.js";
import searchFilesTool from "./searchFiles.tool.js";
import searchClassesTool from "./searchClasses.tool.js";
import searchFunctionsTool from "./searchFunctions.tool.js";
import expandOutgoingTool from "./expandOutgoing.tool.js";
import expandIncomingTool from "./expandIncoming.tool.js";
import traceCallPathTool from "./traceCallPath.tool.js";
import traceRequestLifecycleTool from "./traceRequestLifecycle.tool.js";
import findEntryPointsTool from "./findEntryPoints.tool.js";
import findImplementationsTool from "./findImplementations.tool.js";
import loadSourceTool from "./loadSource.tool.js";
import loadFileTool from "./loadFile.tool.js";
import loadDirectoryTool from "./loadDirectory.tool.js";
import findImportsTool from "./findImports.tool.js";
import resolveImportsTool from "./resolveImports.tool.js";
import findExportsTool from "./findExports.tool.js";
import resolveExportsTool from "./resolveExports.tool.js";
import listFilesTool from "./listFiles.tool.js";
import listDirectoriesTool from "./listDirectories.tool.js";
import dependencyGraphTool from "./dependencyGraph.tool.js";
import inheritanceGraphTool from "./inheritanceGraph.tool.js";
import moduleGraphTool from "./moduleGraph.tool.js";
import findReferencesTool from "./findReferences.tool.js";
import findCallersTool from "./findCallers.tool.js";
import findCalleesTool from "./findCallees.tool.js";

const tools = [
    searchSymbolsTool,
    searchFilesTool,
    searchClassesTool,
    searchFunctionsTool,
    expandOutgoingTool,
    expandIncomingTool,
    traceCallPathTool,
    traceRequestLifecycleTool,
    findEntryPointsTool,
    findImplementationsTool,
    loadSourceTool,
    loadFileTool,
    loadDirectoryTool,
    findImportsTool,
    resolveImportsTool,
    findExportsTool,
    resolveExportsTool,
    listFilesTool,
    listDirectoriesTool,
    dependencyGraphTool,
    inheritanceGraphTool,
    moduleGraphTool,
    findReferencesTool,
    findCallersTool,
    findCalleesTool,
];

for (const tool of tools) {
    if (!toolRegistry.has(tool.name)) {
        toolRegistry.register(tool);
    }
}

export { toolRegistry };
