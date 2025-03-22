import React from "react";

interface MessageProps {
  sender: "user" | "ai" | "bot";
  text: string;
}

const Message: React.FC<MessageProps> = ({ sender, text }) => {
  // Conversion de 'ai' en 'bot' pour la compatibilité avec les styles CSS
  const senderClass = sender === "ai" ? "bot" : sender;
  
  return (
    <div className={`message ${senderClass}`}>
      <p>{text}</p>
    </div>
  );
};

export default Message;