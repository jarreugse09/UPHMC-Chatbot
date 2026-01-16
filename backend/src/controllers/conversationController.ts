import { Response } from "express";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { AuthRequest } from "../types";

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await Conversation.find({ userId: req.user?.userId })
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      userId: req.user?.userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId: id }).sort({
      timestamp: 1,
    });

    res.json({ conversation, messages });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;

    const conversation = new Conversation({
      userId: req.user?.userId,
      title: title || "New Conversation",
    });

    await conversation.save();

    res.status(201).json({ conversation });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId: req.user?.userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.deleteMany({ conversationId: id });

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};

export const updateConversationTitle = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      { title },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (error) {
    console.error("Update conversation error:", error);
    res.status(500).json({ message: "Failed to update conversation" });
  }
};
