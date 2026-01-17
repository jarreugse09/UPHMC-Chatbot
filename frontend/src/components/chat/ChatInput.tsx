import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4"
    >
      <div className="max-w-4xl mx-auto flex gap-3 items-end">
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
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-perps-red focus:border-transparent max-h-32 min-h-[3rem]"
            rows={1}
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 bg-perps-red hover:bg-perps-darkred text-white rounded-xl p-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center mt-2 max-w-4xl mx-auto">
        Perps AI can make mistakes. Verify important information.
      </p>
    </form>
  );
};

export default ChatInput;
