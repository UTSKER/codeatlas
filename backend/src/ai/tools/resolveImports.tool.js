import { resolveImports } from "../../services/importResolver.service.js";

export default {
    name: "resolveImports",
    description: "Resolve internal imports for a repository using the existing import resolver.",
    input: {
        required: ["repositoryId"],
        optional: [],
    },
    output: "Number of imports resolved.",
    async execute({ repositoryId }) {
        return {
            resolved: await resolveImports(repositoryId),
        };
    },
};
