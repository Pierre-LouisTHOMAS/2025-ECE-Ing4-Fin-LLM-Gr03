import React, { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";

const App: React.FC = () => {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    setConversations([...conversations, { id: newId, title: `Conversation ${conversations.length + 1}` }]);
    setCurrentConversationId(newId);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  return (
    <div className="flex">
      <Sidebar 
        conversations={conversations} 
        onSelectConversation={handleSelectConversation} 
        onNewConversation={handleNewConversation} 
      />
      <ChatWindow />
    </div>
  );
};

export default App;