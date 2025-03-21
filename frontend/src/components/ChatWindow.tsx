import React, { useState, useEffect, useRef } from "react";
import Message from "./Message";
import InputBox from "./InputBox";
import TypingLoader from "./TypingLoader";
import { fetchAIResponse } from "../services/api";
import { saveConversation } from "../services/storage";

interface MessageType {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fonction pour ajouter un message
  const addMessage = (sender: "user" | "ai", text: string) => {
    setMessages((prev) => [...prev, { id: prev.length + 1, sender, text }]);
  };

  // Gestion de l'envoi des messages
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    addMessage("user", text);
    setIsTyping(true);
    const response = await fetchAIResponse(text);
    setIsTyping(false);
    addMessage("ai", response);

    saveConversation(currentConversationId, `Conversation ${conversations.length + 1}`, messages);
  };

  // Scroll automatique vers le bas
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Zone de messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        {isTyping && <TypingLoader />}
      </div>

      {/* Zone de saisie */}
      <InputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;

export {};