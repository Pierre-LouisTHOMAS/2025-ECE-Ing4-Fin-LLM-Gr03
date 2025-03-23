import React, { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider } from "./contexts/ThemeContext";
import { getConversations, createNewConversation, deleteConversation, renameConversation } from "./services/storage";
import "./App.css";
import "./themes.css";

// Icône pour le bouton de menu (responsive)
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AppContent: React.FC = () => {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les conversations depuis l'API/localStorage au démarrage
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const loadedConversations = await getConversations();
        setConversations(loadedConversations);
        
        // Vérifier s'il y a un ID de conversation enregistré dans le localStorage
        const savedConversationId = localStorage.getItem('currentConversationId');
        
        if (savedConversationId && loadedConversations.some(conv => conv.id === savedConversationId)) {
          // Si l'ID sauvegardé existe dans les conversations chargées, l'utiliser
          setCurrentConversationId(savedConversationId);
        } else if (loadedConversations.length > 0) {
          // Sinon, sélectionner la conversation la plus récente
          const latestConversationId = loadedConversations[loadedConversations.length - 1].id;
          setCurrentConversationId(latestConversationId);
          localStorage.setItem('currentConversationId', latestConversationId);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des conversations :", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, []);

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

  const handleNewConversation = async () => {
    try {
      const newTitle = `Conversation ${conversations.length + 1}`;
      const newConversation = await createNewConversation(newTitle);
      
      if (newConversation) {
        setConversations(prev => [...prev, { id: newConversation.id, title: newConversation.title }]);
        setCurrentConversationId(newConversation.id);
        
        // Sauvegarder l'ID de la nouvelle conversation dans le localStorage
        localStorage.setItem('currentConversationId', newConversation.id);
        
        // Fermer la sidebar en mode mobile après avoir sélectionné une conversation
        if (isMobile) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création d'une nouvelle conversation :", error);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    
    // Sauvegarder l'ID de la conversation sélectionnée dans le localStorage
    localStorage.setItem('currentConversationId', id);
    
    // Fermer la sidebar en mode mobile après avoir sélectionné une conversation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      // Si la conversation supprimée était la conversation actuelle
      if (currentConversationId === id) {
        // Sélectionner une autre conversation s'il en reste
        if (conversations.length > 1) {
          const remainingConversations = conversations.filter(conv => conv.id !== id);
          setCurrentConversationId(remainingConversations[0].id);
        } else {
          setCurrentConversationId(null);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de la conversation ${id} :`, error);
    }
  };
  
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updatedConversation = await renameConversation(id, newTitle);
      
      if (updatedConversation) {
        // Mettre à jour la liste des conversations avec le nouveau titre
        setConversations(prev => prev.map(conv => {
          if (conv.id === id) {
            return { ...conv, title: newTitle };
          }
          return conv;
        }));
        
        console.log(`Conversation ${id} renommée en "${newTitle}"`);
      }
    } catch (error) {
      console.error(`Erreur lors du renommage de la conversation ${id} :`, error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      {/* Bouton de basculement de thème */}
      <ThemeToggle />
      
      {/* Barre latérale */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          currentConversationId={currentConversationId}
          isLoading={isLoading}
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
        <ChatWindow 
          conversationId={currentConversationId}
          conversationTitle={currentConversationId ? conversations.find(conv => conv.id === currentConversationId)?.title : "Nouvelle conversation"}
          onConversationUpdated={() => {
            // Rafraîchir la liste des conversations après une mise à jour
            getConversations().then(setConversations);
          }}
        />
      </div>
    </div>
  );
};

// Composant racine avec le ThemeProvider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;