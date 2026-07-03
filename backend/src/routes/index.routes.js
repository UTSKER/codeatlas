import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { indexRepository } from "../controllers/index.controller.js";

const router = express.Router();

router.post("/:repositoryId/index", authMiddleware, indexRepository);

export default router;