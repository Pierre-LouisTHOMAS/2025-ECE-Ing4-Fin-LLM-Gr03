import React from "react";
import "../App.css";

interface MessageProps {
  sender: "user" | "ai" | "bot";
  text: string;
}

const Message: React.FC<MessageProps> = ({ sender, text }) => {
  const senderClass = sender === "ai" ? "bot" : sender;
  
  return (
    <div className={`message ${senderClass}`}>
      <p>{text}</p>
    </div>
  );
};

export default Message;