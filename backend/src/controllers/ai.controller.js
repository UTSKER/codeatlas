import { AgentService } from "../ai/agent/agent.service.js";

export const askQuestion = async (req, res) => {
    try {
        const { question, repositoryId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "question is required",
            });
        }

        if (!repositoryId || !repositoryId.trim()) {
            return res.status(400).json({
                success: false,
                message: "repositoryId is required",
            });
        }

        const agent = new AgentService();

        const result = await agent.run(question, {
            repositoryId,
        });

        return res.status(200).json({
            success: true,
            answer: result.answer,
            mission: result.mission.snapshot(),
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to answer question",
        });
    }
};
