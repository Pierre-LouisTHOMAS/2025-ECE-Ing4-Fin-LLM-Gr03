import React, { useState } from 'react';
import './InputBox.css';

interface InputBoxStatiqueProps {
  onSend: (text: string) => void;
}

const InputBoxStatique: React.FC<InputBoxStatiqueProps> = ({ onSend }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
      setSelectedFile(null);
    }
  };

  return (
    <>
      {selectedFile && (
        <div className="file-preview">
          {selectedFile.type.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="preview"
              className="preview-image"
            />
          ) : (
            <p className="preview-file">{selectedFile.name}</p>
          )}
        </div>
      )}
      <div className="input-box">
        <label htmlFor="fileUpload" className="file-upload-btn">📎</label>
        <input
          type="file"
          id="fileUpload"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
            }
          }}
        />
        <input
          type="text"
          placeholder="Écris ton message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Envoyer</button>
      </div>
    </>
  );
};

export default InputBoxStatique;