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
};

export default api;
