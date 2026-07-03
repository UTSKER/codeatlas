import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { fetchRepositories } from "../controllers/github.controller.js";
import { syncGitHubRepositories } from "../controllers/github.controller.js";

const router = express.Router();

router.get(
    "/repositories",
    authMiddleware,
    fetchRepositories
);

router.post(
    "/sync",
    authMiddleware,
    syncGitHubRepositories
);

export default router;