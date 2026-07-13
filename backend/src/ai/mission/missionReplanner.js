import { generate } from "../llm/provider.js";
import { ContextBuilder } from "../memory/contextBuilder.js";
import { RetrievalStrategy } from "../planner/retrievalStrategies.js";

const STRATEGY_ESCALATION = {
    [RetrievalStrategy.SEMANTIC_SEARCH]: [
        RetrievalStrategy.FILE_EXPLORATION,
        RetrievalStrategy.GRAPH_TRAVERSAL,
        RetrievalStrategy.DEPENDENCY_ANALYSIS,
    ],
    [RetrievalStrategy.EXACT_SYMBOL_LOOKUP]: [
        RetrievalStrategy.SEMANTIC_SEARCH,
        RetrievalStrategy.FILE_EXPLORATION,
    ],
    [RetrievalStrategy.GRAPH_TRAVERSAL]: [
        RetrievalStrategy.SEMANTIC_SEARCH,
        RetrievalStrategy.SOURCE_READING,
        RetrievalStrategy.IMPORT_TRAVERSAL,
    ],
    [RetrievalStrategy.IMPORT_TRAVERSAL]: [
        RetrievalStrategy.FILE_EXPLORATION,
        RetrievalStrategy.SEMANTIC_SEARCH,
    ],
    [RetrievalStrategy.FILE_EXPLORATION]: [
        RetrievalStrategy.SEMANTIC_SEARCH,
        RetrievalStrategy.DEPENDENCY_ANALYSIS,
        RetrievalStrategy.GRAPH_TRAVERSAL,
    ],
    [RetrievalStrategy.SOURCE_READING]: [
        RetrievalStrategy.GRAPH_TRAVERSAL,
        RetrievalStrategy.IMPORT_TRAVERSAL,
    ],
    [RetrievalStrategy.DEPENDENCY_ANALYSIS]: [
        RetrievalStrategy.FILE_EXPLORATION,
        RetrievalStrategy.SEMANTIC_SEARCH,
    ],
};

export class MissionReplanner {

    async replan({ mission, requirement, task, verification }) {

        const context = ContextBuilder.buildReplanContext({
            mission,
            requirement,
            task,
            verification,
        });

        const suggestedStrategy = this.suggestNextStrategy(context, verification);

        const messages = [
            {
                role: "system",
                content: `You are the CodeAtlas Mission Replanner.

The current task did NOT satisfy the requirement.

Your job is to decide what retrieval strategy to try NEXT.

You MUST choose a DIFFERENT strategy than those already attempted.
Changing keywords alone is NOT enough — switch the retrieval approach.

Suggested next strategy: ${suggestedStrategy ?? "determine from diagnosis"}

═══════════════════════════════════════
DIAGNOSIS-DRIVEN ADAPTATION
═══════════════════════════════════════

EMPTY_RESULT / WRONG_TOOL — Previous tool returned nothing or wrong tool type.
→ Switch strategy completely:
   - searchSymbols failed → semanticSearch or FILE_EXPLORATION
   - semanticSearch failed → GRAPH_TRAVERSAL (if graph exists) or DEPENDENCY_ANALYSIS
   - graph tools failed → SEMANTIC_SEARCH or IMPORT_TRAVERSAL

WRONG_STRATEGY — Tool category was wrong for the requirement.
→ Pick the strategy that matches the requirement type:
   - flow questions → GRAPH_TRAVERSAL after finding entry symbol
   - concept discovery → SEMANTIC_SEARCH
   - config/framework → DEPENDENCY_ANALYSIS

INSUFFICIENT_EVIDENCE — Partial data found, go deeper.
→ action: CONTINUE with deeper chain on existing working memory variables
   - loadSource on symbols already found
   - findCallers/findCallees on known symbols
   - DO NOT re-run semanticSearch if results already in working memory

REPOSITORY_LIMITATION — Multiple strategies exhausted.
→ Check DEPENDENCY_ANALYSIS (package.json) or FAIL

CONFLICTING_EVIDENCE — Results contradict.
→ action: NEW_TASK focused on resolving the conflict via SOURCE_READING

═══════════════════════════════════════
DECISION OPTIONS
═══════════════════════════════════════

{
  "action": "CONTINUE",
  "recommendedStrategy": "GRAPH_TRAVERSAL",
  "strategyShift": "from SEMANTIC_SEARCH to GRAPH_TRAVERSAL",
  "reason": "Semantic search found auth middleware symbol. Continue with caller analysis.",
  "reuseVariables": ["authResults"]
}

{
  "action": "NEW_TASK",
  "recommendedStrategy": "FILE_EXPLORATION",
  "strategyShift": "from EXACT_SYMBOL_LOOKUP to FILE_EXPLORATION",
  "reason": "Symbol search returned empty. Explore route/config directories.",
  "task": { "title": "...", "description": "...", "priority": 1 }
}

{
  "action": "FAIL",
  "reason": "All strategies exhausted."
}

Return ONLY valid JSON.`,
            },
            {
                role: "user",
                content: JSON.stringify({
                    ...context,
                    suggestedNextStrategy: suggestedStrategy,
                }, null, 2),
            },
        ];

        const raw = await generate({
            messages,
            responseFormat: "json",
            temperature: 0,
        });

        let decision;

        try {
            decision = JSON.parse(raw);
        } catch {
            decision = { action: "FAIL", reason: "Replanner returned invalid JSON." };
        }

        decision.action ??= "FAIL";
        decision.reason ??= "";
        decision.recommendedStrategy ??= suggestedStrategy;

        return decision;
    }

    suggestNextStrategy(context, verification) {
        const attempted = context.strategiesAlreadyAttempted ?? [];
        const lastStrategy = context.lastPlan?.strategy;
        const capabilities = context.repositoryCapabilities?.availableStrategies ?? [];

        const diagnosis = verification.diagnosis;

        if (diagnosis === "INSUFFICIENT_EVIDENCE") {
            if (!attempted.includes(RetrievalStrategy.SOURCE_READING)) {
                return RetrievalStrategy.SOURCE_READING;
            }
            if (
                capabilities.includes("GRAPH_TRAVERSAL") &&
                !attempted.includes(RetrievalStrategy.GRAPH_TRAVERSAL)
            ) {
                return RetrievalStrategy.GRAPH_TRAVERSAL;
            }
        }

        if (
            diagnosis === "WRONG_TOOL" ||
            diagnosis === "EMPTY_RESULT"
        ) {
            if (
                capabilities.includes("SEMANTIC_SEARCH") &&
                !attempted.includes(RetrievalStrategy.SEMANTIC_SEARCH)
            ) {
                return RetrievalStrategy.SEMANTIC_SEARCH;
            }
        }

        const escalation = STRATEGY_ESCALATION[lastStrategy] ?? [
            RetrievalStrategy.SEMANTIC_SEARCH,
            RetrievalStrategy.FILE_EXPLORATION,
            RetrievalStrategy.DEPENDENCY_ANALYSIS,
            RetrievalStrategy.GRAPH_TRAVERSAL,
            RetrievalStrategy.IMPORT_TRAVERSAL,
        ];

        for (const strategy of escalation) {
            if (!attempted.includes(strategy) && capabilities.includes(strategy)) {
                return strategy;
            }
        }

        for (const strategy of capabilities) {
            if (!attempted.includes(strategy)) {
                return strategy;
            }
        }

        return RetrievalStrategy.FILE_EXPLORATION;
    }
}
