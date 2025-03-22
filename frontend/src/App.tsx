import React, { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import "./App.css";

// Icône pour le bouton de menu (responsive)
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const App: React.FC = () => {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Vérifier si l'écran est en mode mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    setConversations([...conversations, { id: newId, title: `Conversation ${conversations.length + 1}` }]);
    setCurrentConversationId(newId);
    
    // Fermer la sidebar en mode mobile après avoir sélectionné une conversation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    
    // Fermer la sidebar en mode mobile après avoir sélectionné une conversation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      {/* Barre latérale */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          currentConversationId={currentConversationId}
        />
      </div>

      {/* Zone principale */}
      <div className="chat-container">
        {/* Bouton de menu pour mobile */}
        {isMobile && (
          <button 
            onClick={toggleSidebar} 
            className="absolute top-3 left-3 z-20 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <MenuIcon />
          </button>
        )}
        
        {/* Fenêtre de chat */}
        <ChatWindow conversationId={currentConversationId} />
      </div>
    </div>
  );
};

export default App;