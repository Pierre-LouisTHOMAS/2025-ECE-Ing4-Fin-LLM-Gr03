import React from "react";
import "../App.css";

const TypingLoader: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 p-2">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-0"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
    </div>
  );
};

export default TypingLoader;