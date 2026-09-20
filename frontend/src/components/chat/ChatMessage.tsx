import React, { useState } from "react";
import { Bot, User, Clipboard, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
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

  const markdownForRender =
    message.isStreaming &&
    (message.content.match(/```/g) || []).length % 2 === 1
      ? `${message.content}\n\n\`\`\``
      : message.content;

  return (
    <div className={`group flex gap-3.5 my-5 ${isUser ? "justify-end" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
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
          className={`prose prose-sm max-w-none break-words rounded-lg px-4 py-3.5 ${
            isUser
              ? "bg-perps-red text-white prose-invert shadow-sm"
              : "bg-gray-50 border border-gray-200 text-gray-800"
          }`}
        >
          {message.isStreaming && !message.content ? (
            <div
              className="flex items-center gap-1 h-5"
              role="status"
              aria-label="Perps AI is typing"
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${dot * 120}ms` }}
                />
              ))}
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: (props) => (
                  <h1
                    className="mb-3 text-lg font-bold text-gray-900"
                    {...props}
                  />
                ),
                h2: (props) => (
                  <h2
                    className="mb-2 text-base font-bold text-gray-900"
                    {...props}
                  />
                ),
                h3: (props) => (
                  <h3
                    className="mb-2 text-sm font-bold text-gray-900"
                    {...props}
                  />
                ),
                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                ol: (props) => (
                  <ol className="list-decimal list-inside" {...props} />
                ),
                ul: (props) => (
                  <ul className="list-disc list-inside" {...props} />
                ),
                blockquote: (props) => (
                  <blockquote
                    className="border-l-2 border-perps-yellow pl-3 italic text-gray-600"
                    {...props}
                  />
                ),
                table: (props) => (
                  <div className="my-3 overflow-x-auto">
                    <table
                      className="min-w-full text-left text-xs"
                      {...props}
                    />
                  </div>
                ),
                th: (props) => (
                  <th
                    className="border-b border-gray-300 px-3 py-2 font-semibold"
                    {...props}
                  />
                ),
                td: (props) => (
                  <td
                    className="border-b border-gray-200 px-3 py-2 align-top"
                    {...props}
                  />
                ),
                a: (props) => (
                  <a
                    className="text-perps-red underline underline-offset-2 hover:text-perps-darkred"
                    target="_blank"
                    rel="noreferrer"
                    {...props}
                  />
                ),
                code({
                  inline,
                  className,
                  children,
                  ...props
                }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="my-3 overflow-hidden rounded-md bg-gray-800">
                      <div className="flex items-center justify-between px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-t-md">
                        <span>{match[1]}</span>
                      </div>
                      <pre className="p-3 text-sm overflow-x-auto">
                        <code className={`language-${match[1]}`}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="rounded-sm bg-gray-200 px-1 py-0.5 text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdownForRender}
            </ReactMarkdown>
          )}
        </div>

        {message.reliabilityNote && (
          <p className="mt-2 px-2 text-[11px] text-gray-400">
            {message.reliabilityNote}
          </p>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 px-2 text-[11px] text-gray-400">
            <span className="mr-2 font-medium text-gray-500">Sources:</span>
            {message.sources.map((source) => (
              <a
                key={source.uri}
                href={source.uri}
                target="_blank"
                rel="noreferrer"
                className="mr-2 inline-block text-perps-red hover:underline"
              >
                {source.title}
              </a>
            ))}
          </div>
        )}

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
              aria-label="Copy response"
              className="rounded-md p-1 text-gray-400 opacity-0 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-perps-yellow group-hover:opacity-100"
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
