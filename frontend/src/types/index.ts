export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  _id: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface SendMessageRequest {
  conversationId: string | null;
  message: string;
}

export interface SendMessageResponse {
  conversationId: string;
  userMessage: {
    id: string;
    role: "user";
    content: string;
    timestamp: Date;
  };
  assistantMessage: {
    id: string;
    role: "assistant";
    content: string;
    timestamp: Date;
  };
}
