import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAIResponse, fetchAIResponseWithPDF } from "../services/api";
import { saveConversation, getConversationMessages } from "../services/storage";
import './ChatWindow.css';

// Icônes pour le chat
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PDFIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 15H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 18H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ScrollToTopIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12L12 5L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ScrollToBottomIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 12L12 19L5 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 9V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9Z" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 7V3.5C8 2.67157 8.67157 2 9.5 2V2C10.3284 2 11 2.67157 11 3.5V7" stroke="white" strokeWidth="2" />
    <path d="M13 7V3.5C13 2.67157 13.6716 2 14.5 2V2C15.3284 2 16 2.67157 16 3.5V7" stroke="white" strokeWidth="2" />
    <path d="M8 12H8.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 12H16.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 21C9 19.8954 10.3431 19 12 19C13.6569 19 15 19.8954 15 21" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface MessageType {
  id: string | number; // Accepte les ID sous forme de string ou number
  sender: "user" | "ai";
  text: string;
  pdfUrl?: string; // URL optionnelle pour les fichiers PDF
}

interface ChatWindowProps {
  conversationId: string | null;
  onConversationUpdated?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onConversationUpdated }) => {
  const [messages, setMessages] = useState<MessageType[]>([
    { id: 1, sender: "ai", text: "Bonjour ! Je suis Qwen, votre assistant IA. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ajuster automatiquement la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);
  
  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (!conversationId) {
        // Si aucune conversation n'est sélectionnée, afficher le message d'accueil
        setMessages([
          { id: Date.now(), sender: "ai", text: "Bonjour ! Je suis Qwen, votre assistant IA. Comment puis-je vous aider aujourd'hui ?" }
        ]);
        return;
      }
      
      setIsLoading(true);
      try {
        const loadedMessages = await getConversationMessages(conversationId);
        if (loadedMessages && loadedMessages.length > 0) {
          // S'assurer que chaque message a un ID unique
          const messagesWithUniqueIds = loadedMessages.map((msg, index) => ({
            ...msg,
            id: msg.id || Date.now() + index
          }));
          setMessages(messagesWithUniqueIds);
        } else {
          // Si la conversation existe mais n'a pas de messages, afficher le message d'accueil
          setMessages([
            { id: Date.now(), sender: "ai", text: "Bonjour ! Je suis Qwen, votre assistant IA. Comment puis-je vous aider aujourd'hui ?" }
          ]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages :", error);
        setError("Impossible de charger les messages de cette conversation.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversationMessages();
  }, [conversationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        // Afficher le nom du fichier dans le champ de texte
        setInputText(`Fichier sélectionné: ${file.name}`);
      } else {
        setError("Veuillez sélectionner un fichier PDF valide.");
        setSelectedFile(null);
      }
    }
  };

  const handlePDFUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedFile)) return;
    
    // Générer un ID unique pour le message utilisateur avec timestamp et valeur aléatoire
    const userMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-user`;
    let userMessage: MessageType;
    
    try {
      if (selectedFile) {
        // Si un fichier PDF est sélectionné
        const fileText = `J'ai envoyé un fichier PDF: ${selectedFile.name}`;
        userMessage = { id: userMessageId, sender: "user", text: fileText };
        
        // Affichage du message utilisateur et indicateur de chargement
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);
        
        // Réinitialisation du champ de saisie
        setInputText("");
        
        // Envoi du fichier PDF au backend
        console.log("📄 Envoi du PDF au modèle :", selectedFile.name);
        const response = await fetchAIResponseWithPDF(selectedFile);
        
        // Réinitialiser le fichier sélectionné
        setSelectedFile(null);
        
        // Création du message de réponse de l'IA avec un ID unique
        const aiMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-ai`;
        const aiMessage: MessageType = { id: aiMessageId, sender: "ai", text: response };
        
        // Mise à jour de l'état avec la réponse
        setMessages(prev => {
          const updatedMessages = [...prev, aiMessage];
          
          // Sauvegarde de la conversation
          if (conversationId) {
            saveConversation(conversationId, `Conversation du ${new Date().toLocaleString('fr-FR')}`, updatedMessages)
              .then(() => {
                if (onConversationUpdated) {
                  onConversationUpdated();
                }
              })
              .catch(err => {
                console.error("Erreur lors de la sauvegarde de la conversation :", err);
              });
          }
          
          return updatedMessages;
        });
      } else {
        // Message texte normal
        userMessage = { id: userMessageId, sender: "user", text: inputText.trim() };
        
        // Affichage du message utilisateur et indicateur de chargement
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);
        
        // Réinitialisation du champ de saisie
        setInputText("");
        
        // Envoi du message texte au backend
        console.log("💬 Envoi du message au modèle :", inputText.trim());
        const response = await fetchAIResponse(inputText.trim());
        
        // Création du message de réponse de l'IA avec un ID unique
        const aiMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-ai`;
        const aiMessage: MessageType = { id: aiMessageId, sender: "ai", text: response };
        
        // Mise à jour de l'état avec la réponse
        setMessages(prev => {
          const updatedMessages = [...prev, aiMessage];
          
          // Sauvegarde de la conversation
          if (conversationId) {
            saveConversation(conversationId, `Conversation du ${new Date().toLocaleString('fr-FR')}`, updatedMessages)
              .then(() => {
                if (onConversationUpdated) {
                  onConversationUpdated();
                }
              })
              .catch(err => {
                console.error("Erreur lors de la sauvegarde de la conversation :", err);
              });
          }
          
          return updatedMessages;
        });
      }
      
      // Réinitialisation de l'erreur
      setError(null);
      console.log("✅ Réponse du modèle ajoutée avec succès");
    } catch (err) {
      console.error("❌ Erreur lors de la récupération de la réponse :", err);
      setError("Impossible de communiquer avec le serveur. Veuillez vérifier que le backend est bien lancé.");
    } finally {
      // Désactivation de l'indicateur de chargement
      setIsTyping(false);
    }
  };

  // Gestion de l'appui sur Entrée pour envoyer le message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Défilement automatique vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (messagesContainerRef.current && isAtBottom) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAtBottom]);

  // Gestion du défilement et affichage des boutons de navigation
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      
      // Vérifier si nous sommes en haut ou en bas
      const atTop = scrollTop < 50;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      setIsAtTop(atTop);
      setIsAtBottom(atBottom);
      
      // Afficher les boutons de défilement si le contenu est suffisamment grand
      setShowScrollButtons(scrollHeight > clientHeight + 200);
      
      // Log pour débogage
      console.log(`Défilement: scrollTop=${scrollTop}, scrollHeight=${scrollHeight}, clientHeight=${clientHeight}, atTop=${atTop}, atBottom=${atBottom}`);
    }
  }, []);

  // Fonction pour ajuster la hauteur du conteneur de messages
  const adjustMessagesContainerHeight = useCallback(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      const windowHeight = window.innerHeight;
      const headerHeight = 48; // Hauteur de l'en-tête
      const footerHeight = 120; // Hauteur approximative du pied de page avec marge
      const messagesHeight = windowHeight - headerHeight - footerHeight;
      messagesContainer.style.height = `${messagesHeight}px`;
      console.log(`Hauteur ajustée du conteneur de messages: ${messagesHeight}px`);
    }
  }, []);

  // Ajout de l'écouteur d'événement de défilement
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      // Vérification initiale après un court délai pour s'assurer que le contenu est rendu
      setTimeout(() => {
        handleScroll();
      }, 100);
      
      // Activer le défilement naturel pour le trackpad
      messagesContainer.style.overscrollBehavior = 'auto';
      // Appliquer les styles CSS pour améliorer le défilement avec trackpad
      messagesContainer.classList.add('smooth-scroll');
      
      // Ajuster la hauteur initiale
      adjustMessagesContainerHeight();
      
      // Ajouter un écouteur pour le redimensionnement de la fenêtre
      window.addEventListener('resize', adjustMessagesContainerHeight);
    }
    
    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', adjustMessagesContainerHeight);
    };
  }, [handleScroll, adjustMessagesContainerHeight]);

  // Fonctions pour faire défiler vers le haut ou vers le bas
  const scrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      console.log("Défilement vers le haut...");
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      // Force la mise à jour de l'état après le défilement
      setTimeout(() => {
        handleScroll();
      }, 300);
    }
  }, [handleScroll]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      console.log("Défilement vers le bas...");
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      // Force la mise à jour de l'état après le défilement
      setTimeout(() => {
        handleScroll();
      }, 300);
    }
  }, [handleScroll]);

  return (
    <div className="flex flex-col h-full">
      {/* En-tête du chat */}
      <div className="chat-header">
        Qwen Chat
      </div>
      
      {/* Zone des messages */}
      <div 
        ref={messagesContainerRef} 
        className="messages-container relative smooth-scroll flex-1" 
        style={{ 
          overflowY: 'auto', 
          scrollBehavior: 'smooth',
          maxHeight: 'calc(100vh - 140px)', /* Hauteur ajustée pour éviter que les messages soient cachés */
          paddingBottom: '120px' /* Espace supplémentaire en bas pour éviter que les messages soient cachés par la zone de saisie */
        }}
      >
        {isLoading ? (
          <div key="loading-indicator" className="flex justify-center items-center h-full">
            <div className="typing-indicator">
              <div className="typing-dot" key="dot-1"></div>
              <div className="typing-dot" key="dot-2"></div>
              <div className="typing-dot" key="dot-3"></div>
            </div>
          </div>
        ) : messages.map((msg, index) => (
          <div key={`msg-${index}-${String(msg.id)}`} className={`message-row ${msg.sender === "user" ? "user" : "ai"}`}>
            <div className="message-content">
              <div className={`avatar ${msg.sender === "user" ? "user" : "ai"}`}>
                {msg.sender === "user" ? <UserIcon /> : <AIIcon />}
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div key="typing-message" className="message-row ai">
            <div className="message-content">
              <div className="avatar ai">
                <AIIcon />
              </div>
              <div className="typing-indicator">
                <div className="typing-dot" key="typing-dot-1"></div>
                <div className="typing-dot" key="typing-dot-2"></div>
                <div className="typing-dot" key="typing-dot-3"></div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div key="error-message" className="message-row ai">
            <div className="message-content">
              <div className="avatar ai">
                <AIIcon />
              </div>
              <div className="message-text error-text">
                <p className="font-bold">Erreur</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Boutons de défilement */}
        {showScrollButtons && (
          <div className="scroll-buttons">
            {!isAtTop && (
              <button 
                key="scroll-top-button"
                className="scroll-button top-button" 
                onClick={scrollToTop}
                title="Remonter au début de la conversation"
              >
                <ScrollToTopIcon />
              </button>
            )}
            {!isAtBottom && (
              <button 
                key="scroll-bottom-button"
                className="scroll-button bottom-button" 
                onClick={scrollToBottom}
                title="Descendre à la fin de la conversation"
              >
                <ScrollToBottomIcon />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Zone de saisie */}
      <div className="chat-footer">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder="Envoyez un message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="application/pdf" 
            onChange={handleFileSelect} 
          />
          <button 
            className="pdf-button" 
            onClick={handlePDFUpload}
            title="Envoyer un fichier PDF"
            disabled={isTyping}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              opacity: isTyping ? 0.5 : 1
            }}
          >
            <PDFIcon />
          </button>
          <button 
            className="send-button" 
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !selectedFile) || isTyping}
          >
            <SendIcon />
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '10px', color: '#6b7280', opacity: 0.6 }}>
          Qwen peut produire des informations incorrectes. Vérifiez les informations importantes.
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;