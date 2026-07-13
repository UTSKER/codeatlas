export class ExecutionPlan {

    constructor({

        strategy = null,

        reasoning = "",

        toolCalls = [],

    }) {

        this.strategy = strategy;

        this.reasoning = reasoning;

        this.toolCalls = toolCalls;

        this.validate();

    }

    validate() {

        if (!Array.isArray(this.toolCalls)) {
            throw new Error("toolCalls must be an array.");
        }

        for (const toolCall of this.toolCalls) {

            if (!toolCall.tool?.trim()) {
                throw new Error("Each tool call must specify a tool.");
            }

            toolCall.args ??= {};

            toolCall.saveAs ??= null;

        }

    }

    isEmpty() {

        return this.toolCalls.length === 0;

    }

    snapshot() {

        return {

            strategy: this.strategy,

            reasoning: this.reasoning,

            toolCalls: this.toolCalls,

        };

    }

}
