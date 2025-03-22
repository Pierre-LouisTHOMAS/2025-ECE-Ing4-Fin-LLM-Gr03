import React, { useState, useEffect, useRef } from "react";
import Message from "./Message";
import InputBox from "./InputBox";
import TypingLoader from "./TypingLoader";
import { fetchAIResponse } from "../services/api";
import { saveConversation } from "../services/storage";
import './ChatWindow.css';

interface MessageType {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([
    { id: 1, sender: "ai", text: "Salut, comment puis-je t'aider ?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Ajout du message de l'utilisateur
    const userMessage: MessageType = { id: Date.now(), sender: "user", text };
    setMessages(prev => [...prev, userMessage]);
    
    // Réinitialisation de l'erreur
    setError(null);
    
    // Affichage de l'indicateur de chargement
    setIsTyping(true);
    
    try {
      console.log("\ud83d\udcac Envoi du message au modèle :", text);
      
      // Appel à l'API
      const response = await fetchAIResponse(text);
      
      // Création du message de réponse de l'IA
      const aiMessage: MessageType = { id: Date.now() + 1, sender: "ai", text: response };
      
      // Mise à jour de l'état avec la réponse
      setMessages(prev => {
        const updatedMessages = [...prev, aiMessage];
        
        // Sauvegarde de la conversation APRÈS avoir ajouté la réponse de l'IA
        saveConversation("chat1", "Conversation 1", updatedMessages);
        
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

  // Défilement automatique vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="chat-window">
      <div ref={chatContainerRef} className="messages">
        {messages.map((msg) => (
          <Message key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        
        {isTyping && <TypingLoader />}
        
        {error && (
          <div className="message error">
            <p className="font-bold">Erreur</p>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <InputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;