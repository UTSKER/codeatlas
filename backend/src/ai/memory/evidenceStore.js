/**
 * EvidenceStore — helpers for querying the flat evidence array on a Mission.
 */
export class EvidenceStore {

    constructor(evidence) {
        this._evidence = evidence;
    }

    all() {
        return this._evidence;
    }

    forRequirement(requirementId) {
        return this._evidence.filter(
            e => e.requirementId === requirementId
        );
    }

    forTask(taskId) {
        return this._evidence.filter(
            e => e.taskId === taskId
        );
    }

    toolsUsed() {
        return [...new Set(this._evidence.map(e => e.tool))];
    }

    toolsUsedForRequirement(requirementId) {
        return [
            ...new Set(
                this.forRequirement(requirementId).map(e => e.tool)
            ),
        ];
    }

    strategiesUsedForRequirement(requirementId) {
        return [
            ...new Set(
                this.forRequirement(requirementId)
                    .map(e => e.strategy)
                    .filter(Boolean)
            ),
        ];
    }

    hasEvidenceForRequirement(requirementId) {
        return this._evidence.some(
            e => e.requirementId === requirementId
        );
    }

    isEmptyOutput(output) {
        if (output == null) return true;
        if (Array.isArray(output)) return output.length === 0;
        if (typeof output === "object") {
            return Object.keys(output).length === 0;
        }
        return false;
    }

    hasResults() {
        return this._evidence.some(e => !this.isEmptyOutput(e.output));
    }

    hasResultsForRequirement(requirementId) {
        return this.forRequirement(requirementId)
            .some(e => !this.isEmptyOutput(e.output));
    }

    countEmptyForRequirement(requirementId) {
        return this.forRequirement(requirementId)
            .filter(e => this.isEmptyOutput(e.output))
            .length;
    }

    countDistinctToolsForRequirement(requirementId) {
        return this.toolsUsedForRequirement(requirementId).length;
    }

    summarize({ requirementId, sampleSize = 5 } = {}) {
        const items = requirementId
            ? this.forRequirement(requirementId)
            : this._evidence;

        return items.map(e => ({
            requirementId: e.requirementId,
            taskId: e.taskId,
            tool: e.tool,
            strategy: e.strategy ?? null,
            stepIndex: e.stepIndex ?? null,
            input: e.input,
            resultCount: Array.isArray(e.output)
                ? e.output.length
                : (e.output != null ? 1 : 0),
            wasEmpty: this.isEmptyOutput(e.output),
            sample: Array.isArray(e.output)
                ? e.output.slice(0, sampleSize)
                : e.output,
            duration: e.duration,
        }));
    }

}
