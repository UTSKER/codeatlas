import { traceRequestLifecycle } from "../../services/graph/callGraph.service.js";

export default {
    name: "traceRequestLifecycle",
    description: "Trace a request or feature lifecycle from an indexed symbol query.",
    input: {
        required: ["repositoryId", "query"],
        optional: ["depth"],
    },
    output: "Call tree and related lifecycle entry point evidence.",
    async execute(args) {
        return traceRequestLifecycle(args);
    },
};
