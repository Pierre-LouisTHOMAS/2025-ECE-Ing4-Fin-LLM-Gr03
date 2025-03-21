import React, { useState, useEffect, useRef } from "react";
import Message from "./Message";
import InputBox from "./InputBox";
import TypingLoader from "./TypingLoader";
import { fetchAIResponse } from "../services/api";
import { saveConversation } from "../services/storage";

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<{ id: number; sender: "user" | "ai"; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages((prev) => [...prev, { id: prev.length + 1, sender: "user", text }]);
    setIsTyping(true);
    const response = await fetchAIResponse(text);
    setIsTyping(false);
    setMessages((prev) => [...prev, { id: prev.length + 1, sender: "ai", text: response }]);

    saveConversation("chat1", "Conversation 1", messages);
  };

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        {isTyping && <TypingLoader />}
      </div>
      <InputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;