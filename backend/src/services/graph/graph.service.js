import { buildCallTreeByQuery } from "./callGraph.service.js";
import { buildDependencyGraph } from "./dependencyGraph.service.js";
import { buildModuleGraph } from "./repositoryGraph.service.js";
import { buildInheritanceGraph } from "./symbolGraph.service.js";

export const buildGraph = async ({
    repositoryId,
    type,
    query,
    filePath,
    depth,
}) => {
    if (type === "call") {
        return buildCallTreeByQuery(repositoryId, query, depth);
    }

    if (type === "dependency") {
        return buildDependencyGraph({
            repositoryId,
            filePath,
            depth,
        });
    }

    if (type === "module") {
        return buildModuleGraph({
            repositoryId,
            directory: filePath,
        });
    }

    if (type === "inheritance") {
        return buildInheritanceGraph({
            repositoryId,
            query,
        });
    }

    throw new Error(`Unknown graph type '${type}'`);
};
