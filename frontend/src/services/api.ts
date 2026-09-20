import axios from "axios";
import type { AuthResponse, Conversation, Message } from "../types/index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally: clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // Only redirect to login on 401 (not authenticated)
    // Don't redirect on 403 (forbidden - guests reaching message limit)
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>("/auth/register", { email, password, name }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),
};

// Conversation API
export const conversationAPI = {
  getAll: () => api.get<{ conversations: Conversation[] }>("/conversations"),

  getById: (id: string) =>
    api.get<{ conversation: Conversation; messages: Message[] }>(
      `/conversations/${id}`,
    ),

  create: (title?: string) =>
    api.post<{ conversation: Conversation }>("/conversations", { title }),

  delete: (id: string) => api.delete(`/conversations/${id}`),

  updateTitle: (id: string, title: string) =>
    api.patch(`/conversations/${id}/title`, { title }),
};

// Chat API
export const chatAPI = {
  sendMessage: (conversationId: string | null, message: string) =>
    api.post("/chat/message", { conversationId, message }),

  streamMessage: async (
    conversationId: string | null,
    message: string,
    handlers: {
      onStart: (data: any) => void;
      onChunk: (text: string) => void;
      onDone: (data: any) => void;
      onError: (data: any) => void;
    },
    signal?: AbortSignal,
  ) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversationId, message }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error = new Error(
        errorData?.message || "Failed to start chat stream",
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    if (!response.body) {
      throw new Error("Chat stream is not available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const processEvent = (rawEvent: string) => {
      let eventName = "message";
      let data = "";

      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          data += line.slice(5).trim();
        }
      }

      if (!data) return;
      const parsedData = JSON.parse(data);

      if (eventName === "start") handlers.onStart(parsedData);
      if (eventName === "chunk") handlers.onChunk(parsedData.text || "");
      if (eventName === "done") handlers.onDone(parsedData);
      if (eventName === "error") handlers.onError(parsedData);
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      events.filter(Boolean).forEach(processEvent);

      if (done) {
        if (buffer.trim()) processEvent(buffer);
        break;
      }
    }
  },
};

export default api;
