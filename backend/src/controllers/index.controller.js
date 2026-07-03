import { indexRepositoryService } from "../services/index.service.js";

export const indexRepository = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        const result = await indexRepositoryService(repositoryId);

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};