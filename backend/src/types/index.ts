import { Request } from "express";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IConversation {
  _id: string;
  userId: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface IConversationMessage {
  role: "user" | "assistant";
  content: string;
}
