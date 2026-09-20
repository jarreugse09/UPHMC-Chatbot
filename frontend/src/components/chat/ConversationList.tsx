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
      <div className="p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onNew}
          className="w-full bg-perps-red hover:bg-perps-darkred text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-perps-yellow focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="mx-4 mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-7 text-center text-gray-500">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-perps-cream">
              <MessageSquare className="w-6 h-6 text-perps-red" />
            </div>
            <h3 className="font-semibold text-base text-gray-700">
              No conversations yet
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              Start a new chat to build your history.
            </p>
          </div>
        ) : (
          <div className="p-3">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                className={`group relative mb-1.5 cursor-pointer rounded-lg transition-all duration-200 ${
                  currentConversationId === conv._id
                    ? "bg-perps-cream shadow-sm ring-1 ring-perps-yellow/60"
                    : "hover:bg-gray-50 hover:shadow-sm"
                }`}
                onClick={() => onSelect(conv._id)}
              >
                <div className="p-3.5 pl-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate pr-1 font-semibold text-sm text-gray-800">
                        {conv.title || "New Conversation"}
                      </h3>
                      <p className="mt-1 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv._id);
                      }}
                      aria-label={`Delete ${conv.title || "conversation"}`}
                      title="Delete conversation"
                      className="rounded-md p-1.5 text-gray-400 opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {currentConversationId === conv._id && (
                  <div className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-perps-red"></div>
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
