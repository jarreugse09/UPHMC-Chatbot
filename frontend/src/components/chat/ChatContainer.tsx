import React, { useState, useEffect, useRef } from "react";
import { LogOut, Menu, X, User } from "lucide-react";
import { Link } from "react-router-dom";
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
    } else {
      setConversations([]);
      setCurrentConversation(null);
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
    if (!user) return;
    try {
      const response = await conversationAPI.getById(id);
      setCurrentConversation(response.data.conversation);
      const mappedMessages = response.data.messages.map((msg: any) => ({
        id: msg._id || msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(mappedMessages);
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
    if (!user || !confirm("Delete this conversation?")) return;

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
        content,
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

      if (user) {
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
      } else {
        // For guests, just update the local state
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
          return [...filtered, ...newMessages];
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 z-30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex lg:flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/uphmc-logo.png"
              alt="UPHMC Logo"
              className="w-6 h-auto"
            />
            <h1 className="font-bold text-xl text-gray-800">Perps AI</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {user ? (
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?._id || null}
            onSelect={loadConversation}
            onDelete={handleDeleteConversation}
            onNew={handleNewConversation}
          />
        ) : (
          <div className="p-4 flex-1 flex flex-col justify-center items-center text-center">
            <User className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="font-semibold text-lg text-gray-800">
              Sign In for More
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Log in to save your conversations and access your chat history.
            </p>
            <Link
              to="/login"
              className="w-full bg-perps-red hover:bg-perps-darkred text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="mt-2 text-sm text-perps-red hover:underline"
            >
              Don't have an account?
            </Link>
          </div>
        )}

        {user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-perps-darkred flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-perps-red transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-xl text-gray-800">Perps AI</h1>
          {user ? (
            <button
              onClick={logout}
              className="text-gray-500 hover:text-perps-red transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-perps-red">
              Login
            </Link>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <img
                  src="/uphmc-logo.png"
                  alt="UPHMC Logo"
                  className="w-24 h-auto mx-auto mb-6"
                />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-gray-500 mb-8">
                  Ask me anything about UPHSD Molino Campus.
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
                      className="text-left p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-perps-red hover:bg-perps-cream transition-all duration-200"
                    >
                      <p className="font-medium text-sm text-gray-700">
                        {question}
                      </p>
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
        <div className="bg-white border-t border-gray-200 p-4">
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
