import { Response } from "express";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import geminiService from "../services/geminiService";
import { AuthRequest } from "../types";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const userId = req.user?.userId;

    let conversation;
    if (userId) {
      // For authenticated users, find or create conversation with userId
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: userId,
      });

      if (!conversation) {
        conversation = new Conversation({
          userId: userId,
          title: message.substring(0, 50),
        });
        await conversation.save();
      }
    } else {
      // For guests, only allow temporary in-memory conversations
      if (!conversationId) {
        // Guest creating new conversation - just return a temporary ID
        // Don't save to database
        const tempConversationId = "temp_" + Date.now();
        const userMessage = {
          id: new Date().getTime().toString(),
          role: "user" as const,
          content: message,
          timestamp: new Date(),
        };

        const conversationHistory: any[] = [];

        let aiResponse: string;
        try {
          aiResponse = await geminiService.generateResponse(
            message,
            conversationHistory,
          );
        } catch (err) {
          console.error("Gemini API failed, using fallback:", err);
          aiResponse =
            "I'm sorry, I can't access the AI service right now. However, I can still help with general information about the University of Perpetual Help System Dalta - Molino Campus. Please try asking again in a moment.";
        }

        const assistantMessage = {
          id: (new Date().getTime() + 1).toString(),
          role: "assistant" as const,
          content: aiResponse,
          timestamp: new Date(),
        };

        return res.json({
          conversationId: tempConversationId,
          userMessage,
          assistantMessage,
        });
      } else {
        // Guest trying to access saved conversation - not allowed
        return res
          .status(403)
          .json({ message: "Please sign in to access saved conversations" });
      }
    }

    const userMessage = new Message({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });
    await userMessage.save();

    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ timestamp: 1 })
      .limit(10);

    const conversationHistory = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let aiResponse: string;
    try {
      aiResponse = await geminiService.generateResponse(
        message,
        conversationHistory,
      );
    } catch (err) {
      console.error("Gemini API failed, using fallback:", err);
      aiResponse =
        "I'm sorry, I can't access the AI service right now. However, I can still help with general information about the University of Perpetual Help System Dalta - Molino Campus. Please try asking again in a moment.";
    }

    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: aiResponse,
    });
    await assistantMessage.save();

    conversation.lastMessage = aiResponse.substring(0, 100);
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      conversationId: conversation._id,
      userMessage: {
        id: userMessage._id,
        role: "user",
        content: message,
        timestamp: userMessage.timestamp,
      },
      assistantMessage: {
        id: assistantMessage._id,
        role: "assistant",
        content: aiResponse,
        timestamp: assistantMessage.timestamp,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};
