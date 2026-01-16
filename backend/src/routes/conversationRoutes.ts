import express from "express";
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  updateConversationTitle,
} from "../controllers/conversationController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getConversations);
router.get("/:id", getConversation);
router.post("/", createConversation);
router.delete("/:id", deleteConversation);
router.patch("/:id/title", updateConversationTitle);

export default router;
