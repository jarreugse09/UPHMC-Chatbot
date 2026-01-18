import React from "react";
import { MessageSquare, Trash2, Plus } from "lucide-react";
import type { Conversation } from "../../types";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  onNew,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNew}
          className="w-full bg-perps-red hover:bg-perps-darkred text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-lg">Start a conversation</h3>
            <p className="text-sm">Your new chats will appear here.</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                className={`group relative mb-1 rounded-md transition-all duration-200 cursor-pointer ${
                  currentConversationId === conv._id
                    ? "bg-perps-cream shadow-sm"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => onSelect(conv._id)}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-800 truncate">
                        {conv.title || "New Conversation"}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all duration-200 transform group-hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {currentConversationId === conv._id && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-perps-red rounded-l-md"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
