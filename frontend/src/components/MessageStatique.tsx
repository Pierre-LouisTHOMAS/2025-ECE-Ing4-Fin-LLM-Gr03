import React from 'react';
import './Message.css';

interface MessageStatiqueProps {
  text: string;
  sender: 'user' | 'bot';
}

const MessageStatique: React.FC<MessageStatiqueProps> = ({ text, sender }) => {
  return (
    <div className={`message ${sender}`}>
      <p>{text}</p>
    </div>
  );
};

export default MessageStatique;