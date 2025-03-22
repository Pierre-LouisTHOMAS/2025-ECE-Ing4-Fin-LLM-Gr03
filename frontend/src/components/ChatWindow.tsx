import React, { useState, useEffect, useRef } from "react";
import { fetchAIResponse } from "../services/api";
import { saveConversation } from "../services/storage";
import './ChatWindow.css';

// Icônes pour le chat
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  id: number;
  sender: "user" | "ai";
  text: string;
}

interface ChatWindowProps {
  conversationId: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<MessageType[]>([
    { id: 1, sender: "ai", text: "Bonjour ! Je suis EXAONE, votre assistant IA. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajuster automatiquement la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Ajout du message de l'utilisateur
    const userMessage: MessageType = { id: Date.now(), sender: "user", text: inputText };
    setMessages(prev => [...prev, userMessage]);
    
    // Réinitialisation du champ de saisie
    setInputText("");
    
    // Réinitialisation de l'erreur
    setError(null);
    
    // Affichage de l'indicateur de chargement
    setIsTyping(true);
    
    try {
      console.log("\ud83d\udcac Envoi du message au modèle :", inputText);
      
      // Appel à l'API
      const response = await fetchAIResponse(inputText);
      
      // Création du message de réponse de l'IA
      const aiMessage: MessageType = { id: Date.now() + 1, sender: "ai", text: response };
      
      // Mise à jour de l'état avec la réponse
      setMessages(prev => {
        const updatedMessages = [...prev, aiMessage];
        
        // Sauvegarde de la conversation APRÈS avoir ajouté la réponse de l'IA
        if (conversationId) {
          saveConversation(conversationId, `Conversation ${new Date().toLocaleString('fr-FR')}`, updatedMessages);
        } else {
          saveConversation("chat1", "Nouvelle conversation", updatedMessages);
        }
        
        return updatedMessages;
      });
      
      console.log("\u2705 Réponse du modèle ajoutée avec succès");
    } catch (err) {
      console.error("\u274c Erreur lors de la récupération de la réponse :", err);
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
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* En-tête du chat */}
      <div className="chat-header">
        EXAONE Chat
      </div>
      
      {/* Zone des messages */}
      <div ref={messagesContainerRef} className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender === "user" ? "user" : "ai"}`}>
            <div className="message-content">
              <div className={`avatar ${msg.sender === "user" ? "user" : "ai"}`}>
                {msg.sender === "user" ? <UserIcon /> : <AIIcon />}
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message-row ai">
            <div className="message-content">
              <div className="avatar ai">
                <AIIcon />
              </div>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="message-row ai">
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
          <button 
            className="send-button" 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <SendIcon />
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '10px', color: '#6b7280', opacity: 0.6 }}>
          EXAONE peut produire des informations incorrectes. Vérifiez les informations importantes.
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;