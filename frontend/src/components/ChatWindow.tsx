import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAIResponse, fetchAIResponseWithPDF, fetchAIResponseWithImage } from "../services/api";
import { saveConversation, getConversationMessages } from "../services/storage";
import './ChatWindow.css';

// Icônes pour le chat
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59718 21.9983 8.005 21.9983C6.41282 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42925 14.0991 2.00015 15.16 2.00015C16.2209 2.00015 17.2394 2.42925 17.99 3.18C18.7408 3.93063 19.1699 4.94915 19.1699 6.01C19.1699 7.07085 18.7408 8.08937 17.99 8.84L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  imageUrl?: string; // URL optionnelle pour les images
}

interface ChatWindowProps {
  conversationId: string | null;
  onConversationUpdated?: () => void;
  conversationTitle?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onConversationUpdated, conversationTitle }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'file' | null>(null);
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
        // Si aucune conversation n'est sélectionnée, afficher une conversation vide
        setMessages([]);
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
          // Si la conversation existe mais n'a pas de messages, afficher une conversation vide
          setMessages([]);
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

  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileType = file.type;
      
      if (fileType === 'application/pdf' || fileType.startsWith('image/')) {
        setSelectedFile(file);
        setFileName(file.name);
        // Ne pas modifier le champ de texte pour permettre à l'utilisateur de saisir sa question
        setInputText("");
      } else {
        setError("Veuillez sélectionner un fichier PDF ou une image (PNG, JPG, JPEG, WEBP).");
        setSelectedFile(null);
        setFileName(null);
      }
    }
  };

  const handleFileUpload = () => {
    // Réinitialiser l'input file avant de l'ouvrir pour éviter les problèmes
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileType('file');
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
        // Si un fichier est sélectionné (PDF ou image)
        let fileText = "";
        let response = "";
        
        if (selectedFile.type === 'application/pdf') {
          // Cas d'un fichier PDF
          const question = inputText.trim() ? inputText : '';
          fileText = question ? 
            `J'ai envoyé un fichier PDF: ${selectedFile.name}\n\nMa question: ${question}` : 
            `J'ai envoyé un fichier PDF: ${selectedFile.name}`;
          
          userMessage = { id: userMessageId, sender: "user", text: fileText };
          
          // Affichage du message utilisateur et indicateur de chargement
          setMessages(prev => [...prev, userMessage]);
          setIsTyping(true);
          
          // Réinitialisation du champ de saisie
          setInputText("");
          
          // Envoi du fichier PDF au backend avec l'historique des messages
          console.log("📄 Envoi du PDF au modèle avec historique et ID de conversation:", { fileName: selectedFile.name, conversationId });
          // Envoyer l'historique des messages précédents (jusqu'à 10 derniers messages)
          const messageHistory = messages.slice(-10);
          // S'assurer que conversationId est une chaîne de caractères valide
          const safeConversationId = conversationId || Date.now().toString();
          response = await fetchAIResponseWithPDF(selectedFile, safeConversationId, question, messageHistory);
        } else if (selectedFile.type.startsWith('image/')) {
          // Cas d'une image
          const question = inputText.trim() ? inputText : '';
          fileText = question ? 
            `J'ai envoyé une image: ${selectedFile.name}\n\nMa question: ${question}` : 
            `J'ai envoyé une image: ${selectedFile.name}`;
          
          userMessage = { id: userMessageId, sender: "user", text: fileText };
          
          // Affichage du message utilisateur et indicateur de chargement
          setMessages(prev => [...prev, userMessage]);
          setIsTyping(true);
          
          // Réinitialisation du champ de saisie
          setInputText("");
          
          // Envoi de l'image au backend avec l'historique des messages
          console.log("🖼️ Envoi de l'image au modèle avec historique et ID de conversation:", { fileName: selectedFile.name, conversationId });
          // Envoyer l'historique des messages précédents (jusqu'à 10 derniers messages)
          const messageHistory = messages.slice(-10);
          // S'assurer que conversationId est une chaîne de caractères valide
          const safeConversationId = conversationId || Date.now().toString();
          response = await fetchAIResponseWithImage(selectedFile, safeConversationId, question, messageHistory);
        }
        
        // Réinitialiser le fichier sélectionné, le type et le nom
        setSelectedFile(null);
        setFileType(null);
        setFileName(null);
        
        // Création du message de réponse de l'IA avec un ID unique
        const aiMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-ai`;
        const aiMessage: MessageType = { id: aiMessageId, sender: "ai", text: response };
        
        // Mise à jour de l'état avec la réponse
        setMessages(prev => {
          const updatedMessages = [...prev, aiMessage];
          
          // Sauvegarde de la conversation
          if (conversationId) {
            // Utiliser le titre existant de la conversation (fourni via les props)
            saveConversation(conversationId, conversationTitle || `Conversation ${conversationId}`, updatedMessages)
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
        
        // Envoi du message texte au backend avec l'historique des messages et ID de conversation
        console.log("💬 Envoi du message au modèle avec historique et ID de conversation:", { message: inputText.trim(), conversationId });
        // Envoyer l'historique des messages précédents (jusqu'à 10 derniers messages)
        const messageHistory = messages.slice(-10);
        // S'assurer que conversationId est une chaîne de caractères valide
        const safeConversationId = conversationId || Date.now().toString();
        const response = await fetchAIResponse(inputText.trim(), safeConversationId, messageHistory);
        
        // Création du message de réponse de l'IA avec un ID unique
        const aiMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-ai`;
        const aiMessage: MessageType = { id: aiMessageId, sender: "ai", text: response };
        
        // Mise à jour de l'état avec la réponse
        setMessages(prev => {
          const updatedMessages = [...prev, aiMessage];
          
          // Sauvegarde de la conversation
          if (conversationId) {
            // Utiliser le titre existant de la conversation (fourni via les props)
            saveConversation(conversationId, conversationTitle || `Conversation ${conversationId}`, updatedMessages)
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
        {conversationTitle || "Nouvelle conversation"}
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
        {fileName && (
          <div style={{ 
            padding: '4px 8px', 
            fontSize: '12px', 
            color: '#ffffff', 
            backgroundColor: '#4a5568', 
            borderRadius: '4px', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>Fichier sélectionné: {fileName}</span>
            <button 
              onClick={() => {
                setSelectedFile(null);
                setFileName(null);
                setFileType(null);
                // Réinitialiser l'input file pour permettre la sélection du même fichier
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0 4px'
              }}
              title="Désélectionner le fichier"
            >
              ✕
            </button>
          </div>
        )}
        <div className="input-container" style={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="application/pdf,.jpg,.jpeg,.png,.webp" 
            onChange={handleFileSelect} 
          />
          <button 
            className="file-button" 
            onClick={handleFileUpload}
            title="Joindre un fichier (PDF, PNG, JPG, JPEG, WEBP)"
            disabled={isTyping}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              opacity: isTyping ? 0.5 : 1,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <PaperclipIcon />
          </button>
          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder="Envoyez un message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ flex: 1 }}
          />
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