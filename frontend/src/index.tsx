/*import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./context/ChatContext";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <ChatProvider>
      <App />
    </ChatProvider>
  </React.StrictMode>
);*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppStatique from './AppStatique';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppStatique />
  </React.StrictMode>
);

export {};