import { Response } from "express";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import geminiService from "../services/geminiService";
import { AuthRequest } from "../types";

const FALLBACK_MESSAGE =
  "I'm sorry, I can't access the AI service right now. However, I can still help with general information about the University of Perpetual Help System Dalta - Molino Campus. Please try asking again in a moment.";

interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const writeEvent = (res: Response, event: string, data: unknown) => {
  if (!res.writableEnded) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
};

const streamAssistantResponse = async (
  req: AuthRequest,
  res: Response,
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  conversationId: string,
  userMessageData: StreamMessage,
  assistantMessageData: StreamMessage,
  saveAssistantMessage: (content: string) => Promise<void>,
) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let clientDisconnected = false;
  let responseText = "";

  const handleDisconnect = () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
    }
  };

  res.on("close", handleDisconnect);
  req.on("aborted", handleDisconnect);

  writeEvent(res, "start", {
    conversationId,
    userMessage: userMessageData,
    assistantMessage: assistantMessageData,
  });

  try {
    for await (const chunk of geminiService.generateResponseStream(
      userMessage,
      conversationHistory,
    )) {
      if (clientDisconnected) break;

      responseText += chunk;
      writeEvent(res, "chunk", { text: chunk });
    }

    if (!responseText) {
      throw new Error("Empty response from AI model");
    }

    await saveAssistantMessage(responseText);

    if (!clientDisconnected) {
      writeEvent(res, "done", {
        assistantMessage: {
          ...assistantMessageData,
          content: responseText,
        },
      });
      res.end();
    }
  } catch (error) {
    console.error("Streaming chat error:", error);

    if (responseText) {
      await saveAssistantMessage(responseText);
    }

    if (!clientDisconnected) {
      writeEvent(res, "error", {
        message: responseText ? "Stream interrupted" : FALLBACK_MESSAGE,
        partial: responseText,
      });
      res.end();
    }
  } finally {
    res.removeListener("close", handleDisconnect);
    req.removeListener("aborted", handleDisconnect);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const userId = req.user?.userId;

    if (!userId && conversationId) {
      return res
        .status(403)
        .json({ message: "Please sign in to access saved conversations" });
    }

    if (!userId) {
      const tempConversationId = "temp_" + Date.now();
      const userMessageData: StreamMessage = {
        id: new Date().getTime().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      const assistantMessageData: StreamMessage = {
        id: (new Date().getTime() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      return streamAssistantResponse(
        req,
        res,
        message,
        [],
        tempConversationId,
        userMessageData,
        assistantMessageData,
        async () => undefined,
      );
    }

    let conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      conversation = new Conversation({
        userId,
        title: message.substring(0, 50),
      });
      await conversation.save();
    }

    const userMessageDocument = new Message({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });
    await userMessageDocument.save();

    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ timestamp: 1 })
      .limit(10);

    const conversationHistory = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const assistantMessageDocument = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: "",
    });

    const userMessageData: StreamMessage = {
      id: userMessageDocument._id.toString(),
      role: "user",
      content: message,
      timestamp: userMessageDocument.timestamp,
    };
    const assistantMessageData: StreamMessage = {
      id: assistantMessageDocument._id.toString(),
      role: "assistant",
      content: "",
      timestamp: assistantMessageDocument.timestamp,
    };

    return streamAssistantResponse(
      req,
      res,
      message,
      conversationHistory,
      conversation._id.toString(),
      userMessageData,
      assistantMessageData,
      async (content) => {
        assistantMessageDocument.content = content;
        await assistantMessageDocument.save();
        conversation.lastMessage = content.substring(0, 100);
        conversation.updatedAt = new Date();
        await conversation.save();
      },
    );
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};
