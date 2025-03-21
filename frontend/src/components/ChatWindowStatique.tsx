import React, { useState } from 'react';
import MessageStatique from './MessageStatique';
import InputBoxStatique from './InputBoxStatique';
import TypingLoaderStatique from './TypingLoaderStatique';
import './ChatWindow.css';

interface MessageType {
  text: string;
  sender: 'user' | 'bot';
}

const ChatWindowStatique: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([
    { text: 'Salut, comment puis-je t’aider ?', sender: 'bot' },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text: string) => {
    setMessages([...messages, { text, sender: 'user' }]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: 'Réponse mockée du bot ✨', sender: 'bot' },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg, index) => (
          <MessageStatique key={index} text={msg.text} sender={msg.sender} />
        ))}
        {isTyping && <TypingLoaderStatique />}
      </div>
      <InputBoxStatique onSend={handleSend} />
    </div>
  );
};

export default ChatWindowStatique;