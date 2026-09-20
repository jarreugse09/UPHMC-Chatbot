import React, { useState } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  disabled,
  isStreaming,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isStreaming) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white">
      <div className="max-w-4xl mx-auto flex gap-2.5 items-stretch">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me anything about UPHSD Molino..."
            className="block w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm leading-5 transition-colors duration-150 placeholder:text-gray-400 focus:border-perps-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-perps-red/20 max-h-32 min-h-[3.25rem]"
            rows={1}
            disabled={disabled}
          />
        </div>
        <button
          type={isStreaming ? "button" : "submit"}
          onClick={isStreaming ? onStop : undefined}
          disabled={!isStreaming && (disabled || !input.trim())}
          aria-label={isStreaming ? "Stop generating" : "Send message"}
          title={isStreaming ? "Stop generating" : "Send message"}
          className="flex-shrink-0 bg-perps-red hover:bg-perps-darkred text-white rounded-lg p-3 h-[52px] flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-perps-yellow focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStreaming ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 text-center mt-2 max-w-4xl mx-auto">
        Perps AI can make mistakes. Please Verify important information. Thanks
      </p>
    </form>
  );
};

export default ChatInput;
