import React from "react";

interface MessageProps {
  sender: "user" | "ai";
  text: string;
}

const Message: React.FC<MessageProps> = ({ sender, text }) => {
  return (
    <div className={`flex ${sender === "user" ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={`max-w-2xl px-4 py-2 rounded-lg shadow-md ${
          sender === "user"
            ? "bg-blue-500 text-white self-end"
            : "bg-gray-700 text-white self-start"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default Message;