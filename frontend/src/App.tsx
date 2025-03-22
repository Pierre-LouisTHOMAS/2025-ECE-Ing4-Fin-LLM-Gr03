import React, { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import "./App.css";

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface MessageType {
  id: number;
  sender: "user" | "ai";
  text: string;
  file?: File | null;
}

const App: React.FC = () => {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [messagesMap, setMessagesMap] = useState<{ [id: string]: MessageType[] }>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSidebarOpen(window.innerWidth > 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    setConversations(prev => [...prev, { id: newId, title: `Conversation ${prev.length + 1}` }]);
    setMessagesMap(prev => ({
      ...prev,
      [newId]: [
        { id: 1, sender: "ai", text: "Bonjour ! Je suis EXAONE, votre assistant IA. Comment puis-je vous aider aujourd'hui ?" }
      ]
    }));
    setCurrentConversationId(newId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleSendMessage = (message: MessageType) => {
    if (!currentConversationId) return;
    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: [...(prev[currentConversationId] || []), message]
    }));
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(conv => conv.id === id ? { ...conv, title: newTitle } : conv)
    );
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    setMessagesMap(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (id === currentConversationId) {
      setCurrentConversationId(null);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-container">
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          currentConversationId={currentConversationId}
        />
      </div>

      <div className="chat-container">
        {isMobile && (
          <button 
            onClick={toggleSidebar} 
            className="absolute top-3 left-3 z-20 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <MenuIcon />
          </button>
        )}
        <ChatWindow
          conversationId={currentConversationId}
          messages={currentConversationId ? messagesMap[currentConversationId] || [] : []}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default App;