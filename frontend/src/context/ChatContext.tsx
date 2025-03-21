import React, { createContext, useState, ReactNode } from "react";

interface MessageType {
  id: number;
  sender: "user" | "ai";
  text: string;
}

interface ChatContextType {
  messages: MessageType[];
  addMessage: (sender: "user" | "ai", text: string) => void;
  clearMessages: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);

  const addMessage = (sender: "user" | "ai", text: string) => {
    setMessages((prev) => [...prev, { id: prev.length + 1, sender, text }]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;

export {};