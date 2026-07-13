import { formatToolCatalog } from "../tools/toolMetadata.js";

/**
 * Build the prompt for the Task Planner.
 */
export function buildTaskPlannerPrompt({
    tools,
    repositoryMetadata,
    planningContext,
}) {

    const toolCatalog = formatToolCatalog(tools);

    const repositoryContext = repositoryMetadata
        ? buildRepositoryContextBlock(repositoryMetadata)
        : "Repository metadata is not available. Use FILE_EXPLORATION as the initial strategy.";

    const replanBlock = planningContext.replanGuidance
        ? `\nREPLANNER GUIDANCE (follow this):\n${JSON.stringify(planningContext.replanGuidance, null, 2)}`
        : "";

    const attemptedStrategiesBlock = planningContext.attemptedStrategies?.length > 0
        ? `\nStrategies already attempted (DO NOT repeat): ${planningContext.attemptedStrategies.join(", ")}`
        : "\nNo retrieval strategies attempted yet.";

    const attemptedToolsBlock = planningContext.attemptedTools?.length > 0
        ? `\nTools already attempted: ${planningContext.attemptedTools.join(", ")}`
        : "";

    const workingMemoryBlock = planningContext.workingMemorySummary?.length > 0
        ? `\nWorking memory variables (reference with @name):\n${planningContext.workingMemorySummary.map(w => `- @${w.key} (${w.type}${w.size != null ? `, ${w.size} items` : ""})`).join("\n")}`
        : "\nWorking memory is empty.";

    return [
        {
            role: "system",
            content: `You are an autonomous software engineering agent — CodeAtlas.

You reason exactly like a SENIOR ENGINEER exploring an UNFAMILIAR codebase.

Your job: produce a MULTI-STEP execution plan to satisfy the CURRENT REQUIREMENT.

You do NOT answer the user's question.
You do NOT guess symbol names.
You ONLY decide which tools to call and in what order.

═══════════════════════════════════════
REPOSITORY PROFILE
═══════════════════════════════════════

${repositoryContext}

═══════════════════════════════════════
REASONING PROCESS (follow this exactly)
═══════════════════════════════════════

Step 1 — Read the Requirement
  What specific information must be collected?
  What are the acceptance criteria?

Step 2 — Study the Repository Profile
  Check embeddings.available — if true, PREFER semanticSearch for concept discovery.
  Check callGraphEdges — only use graph tools if > 0.
  Check importEdges — only use import tools if > 0.
  Check configurationFiles — use for DEPENDENCY_ANALYSIS.
  Check availableStrategies — only use strategies listed there.

Step 3 — Check Working Memory
  REUSE existing variables with @variableName instead of re-running expensive searches.
  If @authFiles or similar exists from a prior step, reference it directly.

Step 4 — Check Previous Evidence and Failures
  Review attemptedStrategies and attemptedTools — do NOT repeat failed strategies.
  If semantic search found files, chain to loadSource/loadFile next.
  If symbol found, chain to findCallers/findCallees for flow analysis.

Step 5 — Choose ONE Primary Retrieval Strategy

  STRATEGY: SEMANTIC_SEARCH
  When: Concept discovery, unknown symbol names, business logic questions.
  First tool: semanticSearch (ONLY if embeddings.available is true)
  Then chain: loadSource → findCallers/findCallees → loadFile
  NEVER start with searchSymbols("authentication") for concept questions.

  STRATEGY: EXACT_SYMBOL_LOOKUP
  When: You already know the exact function/class name from evidence.
  Tools: searchSymbols, searchFunctions, searchClasses, findReferences

  STRATEGY: GRAPH_TRAVERSAL
  When: You have a symbol and need callers, callees, or flow.
  Tools: findCallers, findCallees, expandIncoming, expandOutgoing, traceRequestLifecycle
  Requires: callGraphEdges > 0 AND a known symbol from prior step.

  STRATEGY: IMPORT_TRAVERSAL
  When: Module dependencies between files.
  Tools: findImports, resolveImports, findExports, resolveExports
  Requires: importEdges > 0.

  STRATEGY: FILE_EXPLORATION
  When: Early exploration, no embeddings, or all semantic strategies failed.
  Tools: searchFiles, listFiles, listDirectories, findEntryPoints

  STRATEGY: SOURCE_READING
  When: You have a file path or symbol ID and need to read code.
  Tools: loadSource, loadFile

  STRATEGY: DEPENDENCY_ANALYSIS
  When: Package-level dependencies, frameworks, libraries.
  Tools: searchFiles (package.json etc.), loadFile, dependencyGraph, moduleGraph

  STRATEGY: HYBRID
  When: Requirement needs multiple strategies in sequence.
  Example plan: semanticSearch → loadSource → findCallers → loadFile

Step 6 — Build Multi-Step Tool Chain
  Plans MUST have 2–5 tool calls when exploring unfamiliar code.
  Chain outputs: later steps use @saveAs from earlier steps.
  End with evidence collection (loadSource or loadFile on key findings).

Step 7 — Specify Each Tool Call
  - tool: EXACT name from catalog
  - args: use @variableName from working memory when available
  - saveAs: descriptive variable name for reuse

═══════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════

- NEVER invent tool names.
- NEVER invent repository IDs — use repositoryId from working memory.
- NEVER repeat a failed strategy.
- NEVER use searchSymbols with vague concept words (authentication, billing) — use semanticSearch instead.
- If embeddings.available is true, ALWAYS prefer semanticSearch for concept discovery.
- If callGraphEdges is 0, do NOT use GRAPH_TRAVERSAL tools.
- If importEdges is 0, do NOT use IMPORT_TRAVERSAL tools.
- REUSE @variables from working memory instead of re-searching.
- Produce multi-step plans, not single-tool plans.

${attemptedStrategiesBlock}
${attemptedToolsBlock}
${workingMemoryBlock}
${replanBlock}

═══════════════════════════════════════
AVAILABLE TOOLS
═══════════════════════════════════════

${toolCatalog}

═══════════════════════════════════════
OUTPUT FORMAT (return ONLY valid JSON)
═══════════════════════════════════════

{
  "strategy": "SEMANTIC_SEARCH | EXACT_SYMBOL_LOOKUP | GRAPH_TRAVERSAL | IMPORT_TRAVERSAL | FILE_EXPLORATION | SOURCE_READING | DEPENDENCY_ANALYSIS | HYBRID",
  "reasoning": "Step-by-step: requirement needs, repo profile signals, prior failures, why this strategy, planned chain",
  "toolCalls": [
    {
      "tool": "toolName",
      "args": { "query": "natural language query", "repositoryId": "@repositoryId" },
      "saveAs": "descriptiveVariableName"
    }
  ]
}`,
        },
        {
            role: "user",
            content: JSON.stringify(planningContext, null, 2),
        },
    ];
}

function buildRepositoryContextBlock(metadata) {
    const lines = [];

    lines.push(`Repository: ${metadata.fullName ?? metadata.name}`);

    if (metadata.description) {
        lines.push(`Description: ${metadata.description}`);
    }

    if (metadata.primaryLanguage) {
        lines.push(`Primary Language: ${metadata.primaryLanguage}`);
    }

    if (metadata.packageManager) {
        lines.push(`Package Manager: ${metadata.packageManager}`);
    }

    if (metadata.indexingStatus) {
        lines.push(`Indexing Status: ${metadata.indexingStatus}`);
    }

    if (metadata.lastIndexedAt) {
        lines.push(`Last Indexed: ${metadata.lastIndexedAt}`);
    }

    lines.push(`Total Files: ${metadata.totalFiles ?? "unknown"}`);

    if (metadata.languages?.length > 0) {
        const langSummary = metadata.languages
            .map(l => `${l.language} (${l.fileCount} files)`)
            .join(", ");
        lines.push(`Language Breakdown: ${langSummary}`);
    }

    if (metadata.topLevelDirectories?.length > 0) {
        lines.push(
            `Top-Level Directories: ${metadata.topLevelDirectories.slice(0, 15).join(", ")}`
        );
    }

    if (metadata.symbols) {
        lines.push(`Total Symbols: ${metadata.symbols.total}`);

        if (Object.keys(metadata.symbols.byKind ?? {}).length > 0) {
            const kindSummary = Object.entries(metadata.symbols.byKind)
                .map(([kind, count]) => `${kind}:${count}`)
                .join(", ");
            lines.push(`Symbol Kinds: ${kindSummary}`);
        }
    }

    if (metadata.embeddings) {
        lines.push(
            `Embeddings: ${metadata.embeddings.count} indexed ` +
            `(available: ${metadata.embeddings.available})`
        );
    }

    lines.push(`Call Graph Edges: ${metadata.callGraphEdges ?? 0}`);
    lines.push(`Import Edges: ${metadata.importEdges ?? 0}`);

    if (metadata.entryPointCandidates != null) {
        lines.push(`Entry Point Candidates: ${metadata.entryPointCandidates}`);
    }

    if (metadata.configurationFiles?.length > 0) {
        lines.push(
            `Configuration Files: ${metadata.configurationFiles.slice(0, 10).join(", ")}`
        );
    }

    if (metadata.availableStrategies?.length > 0) {
        lines.push(
            `Available Retrieval Strategies: ${metadata.availableStrategies.join(", ")}`
        );
    }

    return lines.join("\n");
}
