import express from "express";
import { sendMessage } from "../controllers/chatController";
import { optionalAuthenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(optionalAuthenticateToken);

router.post("/message", sendMessage);

export default router;
