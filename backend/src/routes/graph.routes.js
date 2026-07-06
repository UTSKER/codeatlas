import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import { queryGraph } from "../controllers/graph.controller.js";

const router = express.Router();

/*
POST /api/graph/query

Body:
{
    "repositoryId": "...",
    "query": "login",
    "depth": 5
}
*/

router.post(
    "/query",
    authMiddleware,
    queryGraph
);

export default router;