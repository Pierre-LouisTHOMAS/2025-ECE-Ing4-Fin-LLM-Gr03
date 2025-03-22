import React, { useState, useRef } from "react";

interface InputBoxProps {
  onSendMessage: (message: string, file?: File | null) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendMessage(`Fichier envoyé : ${file.name}`, file);
    }
  };

  return (
    <div className="input-container">
      {/* Trombone */}
      <button
        className="clip-button"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 1 1 4.95 4.95l-9.19 9.19a1.5 1.5 0 0 1-2.12-2.12l8.48-8.48" />
        </svg>
      </button>

      <textarea
        className="input-textarea"
        placeholder="Envoyez un message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />

      <button 
        className="send-button" 
        onClick={handleSubmit}
        disabled={!message.trim()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default InputBox;