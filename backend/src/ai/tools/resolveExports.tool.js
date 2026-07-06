import { resolveExports } from "../../services/resolveExport.service.js";

export default {
    name: "resolveExports",
    description: "Resolve exports to indexed symbols using the existing export resolver.",
    input: {
        required: ["repositoryId"],
        optional: [],
    },
    output: "Number of exports resolved.",
    async execute({ repositoryId }) {
        return {
            resolved: await resolveExports(repositoryId),
        };
    },
};
