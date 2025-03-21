import React, { useState } from 'react';
import './InputBox.css';

interface InputBoxStatiqueProps {
  onSend: (text: string) => void;
}

const InputBoxStatique: React.FC<InputBoxStatiqueProps> = ({ onSend }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="input-box">
      <input
        type="file"
        id="fileUpload"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            console.log('Fichier sélectionné:', file);
          }
        }}
      />
      <label htmlFor="fileUpload" className="file-upload-btn">📎</label>
      <input
        type="text"
        placeholder="Écris ton message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Envoyer</button>
    </div>
  );
};

export default InputBoxStatique;