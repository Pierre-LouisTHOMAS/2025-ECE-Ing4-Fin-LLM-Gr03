import React, { useState } from "react";

const PlusIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M12 4V20" /><path d="M4 12H20" />
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M21 11.5C21 13.9853 20.0536 16.3745 18.364 18.364L21 21L18.364 18.364C16.3745 20.0536 13.9853 21 11.5 21C9.01472 21 6.62552 20.0536 4.63604 18.364C2.94649 16.3745 2 13.9853 2 11.5C2 9.01472 2.94649 6.62552 4.63604 4.63604C6.62552 2.94649 9.01472 2 11.5 2C13.9853 2 16.3745 2.94649 18.364 4.63604C20.0536 6.62552 21 9.01472 21 11.5Z" />
  </svg>
);

interface SidebarProps {
  conversations: { id: string; title: string }[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentConversationId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, 
  onSelectConversation, 
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  currentConversationId 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setInputValue(currentTitle);
  };

  const handleRenameSubmit = () => {
    if (editingId) {
      onRenameConversation(editingId, inputValue.trim() || "Conversation");
      setEditingId(null);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <button onClick={onNewConversation} className="new-chat-button">
          <PlusIcon /> Nouvelle conversation
        </button>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <p className="text-gray-400 text-sm p-3">Aucune conversation</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <ChatIcon />
                {editingId === conv.id ? (
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                    autoFocus
                    style={{ background: "transparent", color: "#ececf1", border: "none", width: "100%" }}
                  />
                ) : (
                  <span onDoubleClick={() => startRename(conv.id, conv.title)}>
                    {conv.title}
                  </span>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }} 
                  style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#8e8ea0", cursor: "pointer" }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <p>EXAONE Chat v1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;