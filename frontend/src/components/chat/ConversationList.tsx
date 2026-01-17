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
          className="w-full bg-perps-red hover:bg-perps-darkred text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                className={`group relative mb-2 rounded-lg transition cursor-pointer ${
                  currentConversationId === conv._id
                    ? "bg-perps-cream border-l-4 border-perps-red"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onSelect(conv._id)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {conv.title}
                      </h3>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
