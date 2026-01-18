import React, { useState } from "react";
import { Bot, User, Clipboard, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/index";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`group flex gap-3 my-4 ${isUser ? "justify-end" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? "bg-perps-darkred" : "bg-perps-yellow"
        }`}
      >
        {isUser ? (
          <User className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-perps-red" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={`relative max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`prose prose-sm max-w-none break-words rounded-xl px-4 py-3 ${
            isUser
              ? "bg-perps-red text-white prose-invert"
              : "bg-white border border-gray-200 text-gray-800"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="mb-2 last:mb-0" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside" {...props} />
              ),
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <div className="my-2 bg-gray-800 rounded-md">
                    <div className="flex items-center justify-between px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-t-md">
                      <span>{match[1]}</span>
                    </div>
                    <pre className="p-3 text-sm overflow-x-auto">
                      <code className={`language-${match[1]}`}>{children}</code>
                    </pre>
                  </div>
                ) : (
                  <code
                    className="px-1 py-0.5 bg-gray-200 rounded-sm text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp and Copy Button */}
        <div className="flex items-center justify-between mt-1.5 px-2">
          <span className="text-xs text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Clipboard className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
