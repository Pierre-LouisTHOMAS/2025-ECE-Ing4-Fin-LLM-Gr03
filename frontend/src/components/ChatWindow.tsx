import React, { useEffect, useRef, useState } from "react";
import { fetchAIResponse } from "../services/api";
import InputBox from "./InputBox";
import { motion, AnimatePresence } from "framer-motion";
import "../App.css";

const UserIcon = () => (
  <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
  </svg>
);

const AIIcon = () => (
  <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M20 9V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9Z" />
    <path d="M8 7V3.5C8 2.67157 8.67157 2 9.5 2V2C10.3284 2 11 2.67157 11 3.5V7" />
    <path d="M13 7V3.5C13 2.67157 13.6716 2 14.5 2V2C15.3284 2 16 2.67157 16 3.5V7" />
    <path d="M8 12H8.01" />
    <path d="M16 12H16.01" />
    <path d="M9 21C9 19.8954 10.3431 19 12 19C13.6569 19 15 19.8954 15 21" />
  </svg>
);

interface MessageType {
  id: number;
  sender: "user" | "ai";
  text: string;
  file?: File | null;
}

interface ChatWindowProps {
  conversationId: string | null;
  messages: MessageType[];
  onSendMessage: (message: MessageType) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, messages, onSendMessage }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async (text: string, file?: File | null) => {
    const userMessage: MessageType = { id: Date.now(), sender: "user", text, file };
    onSendMessage(userMessage);
    setError(null);
    setIsTyping(true);

    try {
      const response = await fetchAIResponse(text);
      const aiMessage: MessageType = { id: Date.now() + 1, sender: "ai", text: response };
      onSendMessage(aiMessage);
    } catch (err) {
      setError("Erreur serveur. Vérifiez le backend.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">EXAONE Chat</div>

      <div ref={messagesContainerRef} className="messages-container">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`message-row ${msg.sender}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-content">
                <div className={`avatar ${msg.sender}`}>
                  {msg.sender === "user" ? <UserIcon /> : <AIIcon />}
                </div>
                <div className="message-text">
                  {msg.text}
                  {msg.file && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#ccc' }}>
                      📎 Fichier: {msg.file.name}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="chat-footer">
        <InputBox onSendMessage={handleSendMessage} />
        <div className="chat-credit">
          EXAONE peut produire des informations incorrectes. Vérifiez les informations importantes.
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;