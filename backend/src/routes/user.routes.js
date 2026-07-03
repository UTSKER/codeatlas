import { getUser,addUser } from "../controllers/user.controller.js";
import express from "express";

const router = express.Router();

router.get("/",getUser);
router.post("/",addUser);

export default router;