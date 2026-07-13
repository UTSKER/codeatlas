import { generate } from "../llm/provider.js";
import { ContextBuilder } from "../memory/contextBuilder.js";
import { VerifierDiagnosis } from "../planner/retrievalStrategies.js";

export class MissionVerifier {

    async verify({ mission, requirement, task }) {

        const context = ContextBuilder.buildVerificationContext({
            mission,
            requirement,
            task,
        });

        const preDiagnosis = this.applyProgrammaticChecks(context);

        if (preDiagnosis) {
            return preDiagnosis;
        }

        const messages = [
            {
                role: "system",
                content: `You are the CodeAtlas Requirement Verifier.

Your ONLY job is to determine whether the CURRENT REQUIREMENT has been satisfied
by the evidence collected so far.

You do NOT answer the user's question.
You ONLY evaluate whether enough information has been COLLECTED.

═══════════════════════════════════════
EVALUATION FRAMEWORK
═══════════════════════════════════════

Classify into ONE diagnosis:

SUCCESS — Evidence meets ALL acceptance criteria.
  Return: completed = true, confidence > 0.75, diagnosis = "SUCCESS"

EMPTY_RESULT — Tools ran but returned empty arrays/null.
  The query or inputs were likely wrong, not the repository.
  Return: completed = false, confidence 0.1–0.3, diagnosis = "EMPTY_RESULT"

WRONG_TOOL — Wrong tool was chosen for the requirement type.
  Example: used searchSymbols for a concept question instead of semanticSearch.
  Return: completed = false, confidence 0.1–0.4, diagnosis = "WRONG_TOOL"

WRONG_STRATEGY — Right tool category but wrong approach.
  Example: graph traversal on a symbol that doesn't exist in call graph.
  Return: completed = false, confidence 0.2–0.4, diagnosis = "WRONG_STRATEGY"

INSUFFICIENT_EVIDENCE — Partial results found, more depth needed.
  Example: found auth file but didn't read source or trace callers.
  Return: completed = false, confidence 0.4–0.7, diagnosis = "INSUFFICIENT_EVIDENCE"

CONFLICTING_EVIDENCE — Evidence contradicts itself.
  Return: completed = false, confidence 0.3–0.5, diagnosis = "CONFLICTING_EVIDENCE"

REPOSITORY_LIMITATION — Multiple strategies tried, repository lacks this info.
  Return: completed = false, confidence 0.0–0.2, diagnosis = "REPOSITORY_LIMITATION"

═══════════════════════════════════════
OUTPUT FORMAT (return ONLY valid JSON)
═══════════════════════════════════════

{
  "completed": boolean,
  "confidence": 0.0–1.0,
  "diagnosis": "SUCCESS | EMPTY_RESULT | WRONG_TOOL | WRONG_STRATEGY | INSUFFICIENT_EVIDENCE | CONFLICTING_EVIDENCE | REPOSITORY_LIMITATION",
  "reason": "Specific explanation referencing actual evidence items and WHY it failed",
  "acceptanceCriteriaStatus": {
    "criterion text": "MET | PARTIAL | NOT_MET"
  },
  "missingInformation": ["what is still needed"]
}`,
            },
            {
                role: "user",
                content: JSON.stringify(context, null, 2),
            },
        ];

        const raw = await generate({
            messages,
            responseFormat: "json",
            temperature: 0,
        });

        let result;

        try {
            result = JSON.parse(raw);
        } catch {
            throw new Error("Mission Verifier returned invalid JSON.");
        }

        const diagnosis = result.diagnosis ?? VerifierDiagnosis.WRONG_STRATEGY;

        return {
            completed: result.completed ?? false,
            confidence: result.confidence ?? 0,
            diagnosis,
            reason: result.reason ?? "",
            acceptanceCriteriaStatus: result.acceptanceCriteriaStatus ?? {},
            missingInformation: result.missingInformation ?? [],
        };
    }

    applyProgrammaticChecks(context) {
        const signals = context.programmaticSignals;

        if (!signals || signals.totalEvidenceItems === 0) {
            return null;
        }

        if (signals.hasAnyResults && signals.emptyResultCount === 0) {
            return null;
        }

        if (signals.allResultsEmpty && signals.distinctToolsUsed === 1) {
            const lastPlan = context.lastPlan;
            const tool = context.toolsAttempted[0];

            const isWrongTool =
                tool === "searchSymbols" ||
                tool === "searchFunctions" ||
                tool === "searchClasses";

            return {
                completed: false,
                confidence: 0.15,
                diagnosis: isWrongTool
                    ? VerifierDiagnosis.WRONG_TOOL
                    : VerifierDiagnosis.EMPTY_RESULT,
                reason: isWrongTool
                    ? `Tool '${tool}' returned empty results. ` +
                      `For concept discovery, semanticSearch is preferred over lexical symbol search. ` +
                      `Strategy used: ${lastPlan?.strategy ?? "unknown"}.`
                    : `Tool '${tool}' returned empty results with no partial data.`,
                acceptanceCriteriaStatus: {},
                missingInformation: ["Relevant code evidence for this requirement"],
            };
        }

        if (
            signals.allResultsEmpty &&
            signals.distinctToolsUsed >= 2 &&
            signals.strategiesAttempted.length >= 2
        ) {
            return {
                completed: false,
                confidence: 0.1,
                diagnosis: VerifierDiagnosis.REPOSITORY_LIMITATION,
                reason:
                    `${signals.distinctToolsUsed} tools across ` +
                    `${signals.strategiesAttempted.length} strategies all returned empty. ` +
                    `Repository may not contain this information.`,
                acceptanceCriteriaStatus: {},
                missingInformation: [],
            };
        }

        if (signals.hasAnyResults && signals.emptyResultCount > 0) {
            return null;
        }

        if (signals.allResultsEmpty) {
            return {
                completed: false,
                confidence: 0.2,
                diagnosis: VerifierDiagnosis.EMPTY_RESULT,
                reason: "All tool calls returned empty results.",
                acceptanceCriteriaStatus: {},
                missingInformation: ["Evidence matching acceptance criteria"],
            };
        }

        return null;
    }
}
