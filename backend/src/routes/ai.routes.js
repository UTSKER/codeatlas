import express from "express";
import { askQuestion } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/ask", askQuestion);

export default router;
