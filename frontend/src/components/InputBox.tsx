import React, { useState } from "react";

interface InputBoxProps {
  onSendMessage: (message: string) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  // Gère la soumission du message
  const handleSubmit = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage(""); // Réinitialise le champ après envoi
    }
  };

  // Gère l'appui sur "Entrée" pour envoyer le message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center p-4 bg-gray-800 border-t border-gray-700">
      {/* Champ de saisie */}
      <input
        type="text"
        className="flex-1 bg-gray-700 text-white p-2 rounded-lg outline-none"
        placeholder="Tapez un message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Bouton d'envoi */}
      <button
        onClick={handleSubmit}
        className="ml-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
      >
        Envoyer
      </button>
    </div>
  );
};

export default InputBox;