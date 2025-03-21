import React from "react";

interface SidebarProps {
  conversations: { id: string; title: string }[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, onSelectConversation, onNewConversation }) => {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col p-4 shadow-lg">
      {/* Bouton Nouvelle Conversation */}
      <button
        onClick={onNewConversation}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
      >
        + Nouvelle conversation
      </button>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune conversation</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className="p-2 cursor-pointer hover:bg-gray-700 rounded transition"
            >
              {conv.title}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;