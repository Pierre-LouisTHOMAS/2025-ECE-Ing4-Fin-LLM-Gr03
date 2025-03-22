import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Utilisation de l'application réelle qui communique avec le modèle EXAONE
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Note: La version statique ci-dessous a été désactivée car elle utilise des réponses prédéfinies
// au lieu de communiquer avec le modèle EXAONE
/*
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
*/

export {};