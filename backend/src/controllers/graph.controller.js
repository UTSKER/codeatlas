import { buildCallTreeByQuery } from "../services/graph/callGraph.service.js";

export const queryGraph = async (req, res) => {
    try {

        const { repositoryId, query, depth = 5 } = req.body;

        if (!repositoryId) {
            return res.status(400).json({
                success: false,
                message: "repositoryId is required",
            });
        }

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "query is required",
            });
        }

        const graph = await buildCallTreeByQuery(
            repositoryId,
            query,
            depth
        );

        return res.status(200).json({
            success: true,
            ...graph,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};