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

const getConversationGroup = (date: Date) => {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const conversationDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysAgo = Math.floor(
    (startOfToday.getTime() - conversationDate.getTime()) / 86400000,
  );

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "Previous 7 days";
  return "Older";
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  onNew,
}) => {
  const groupedConversations = conversations.reduce<Record<string, Conversation[]>>(
    (groups, conversation) => {
      const group = getConversationGroup(new Date(conversation.updatedAt));
      groups[group] = groups[group] || [];
      groups[group].push(conversation);
      return groups;
    },
    {},
  );
  const groupOrder = ["Today", "Yesterday", "Previous 7 days", "Older"];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="border-b border-gray-200 px-4 py-3">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-perps-yellow focus:ring-offset-1"
        >
          <Plus className="h-4 w-4 text-gray-500" />
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
          <div className="space-y-5 px-3 py-4">
            {groupOrder.map((group) => {
              const groupConversations = groupedConversations[group];
              if (!groupConversations?.length) return null;

              return (
                <section key={group}>
                  <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {group}
                  </h2>
                  <div className="space-y-0.5">
                    {groupConversations.map((conv) => (
                      <div
                        key={conv._id}
                        className={`group relative cursor-pointer rounded-md transition-colors duration-150 ${
                          currentConversationId === conv._id
                            ? "bg-perps-cream text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => onSelect(conv._id)}
                      >
                        <div className="flex min-h-10 items-center gap-2 px-3 py-2">
                          <h3 className="min-w-0 flex-1 truncate text-sm leading-5">
                            {conv.title || "New Conversation"}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(conv._id);
                            }}
                            aria-label={`Delete ${conv.title || "conversation"}`}
                            title="Delete conversation"
                            className="rounded-md p-1 text-gray-400 opacity-0 transition-all duration-150 hover:bg-white hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {currentConversationId === conv._id && (
                          <div className="absolute left-0 top-2 h-6 w-0.5 rounded-r-full bg-perps-red" />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
