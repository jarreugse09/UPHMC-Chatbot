import React, { useState, useEffect, useRef } from "react";
import { Bot, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { conversationAPI, chatAPI } from "../../services/api";
import type { Conversation, Message } from "../../types/index";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ConversationList from "./ConversationList";

const ChatContainer: React.FC = () => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const response = await conversationAPI.getAll();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await conversationAPI.getById(id);
      setCurrentConversation(response.data.conversation);
      setMessages(response.data.messages);
      setSidebarOpen(false);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      await conversationAPI.delete(id);
      setConversations(conversations.filter((c) => c._id !== id));
      if (currentConversation?._id === id) {
        handleNewConversation();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    setLoading(true);

    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chatAPI.sendMessage(
        currentConversation?._id || null,
        content
      );

      const newMessages: Message[] = [
        {
          id: response.data.userMessage.id,
          role: "user",
          content: response.data.userMessage.content,
          timestamp: new Date(response.data.userMessage.timestamp),
        },
        {
          id: response.data.assistantMessage.id,
          role: "assistant",
          content: response.data.assistantMessage.content,
          timestamp: new Date(response.data.assistantMessage.timestamp),
        },
      ];

      if (!currentConversation) {
        await loadConversations();
        await loadConversation(response.data.conversationId);
      } else {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
          return [...filtered, ...newMessages];
        });
        await loadConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-perps-cream">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-80 transform transition-transform duration-300 z-30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?._id || null}
          onSelect={loadConversation}
          onDelete={handleDeleteConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-perps-yellow rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-perps-red" />
              </div>
              <div>
                <h1 className="font-bold text-perps-darkred">Perps AI</h1>
                <p className="text-xs text-gray-500">UPHSD Molino Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-perps-red transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-perps-yellow rounded-full mb-4">
                  <Bot className="w-10 h-10 text-perps-red" />
                </div>
                <h2 className="text-2xl font-bold text-perps-darkred mb-2">
                  Welcome to Perps AI
                </h2>
                <p className="text-gray-600 mb-6">
                  Your University of Perpetual Help System Dalta - Molino Campus
                  assistant
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {[
                    "What programs do you offer?",
                    "How do I apply for admission?",
                    "Tell me about campus facilities",
                    "What are the tuition fees?",
                  ].map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(question)}
                      className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-perps-red hover:shadow-md transition"
                    >
                      <p className="text-sm text-gray-700">{question}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
};

export default ChatContainer;
