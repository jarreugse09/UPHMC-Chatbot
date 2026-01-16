import express from "express";
import { sendMessage } from "../controllers/chatController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.post("/message", sendMessage);

export default router;
