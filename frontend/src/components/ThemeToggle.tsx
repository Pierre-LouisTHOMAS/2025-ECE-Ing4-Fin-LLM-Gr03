import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

// Icône pour le mode sombre
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Icône pour le mode clair
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);
  
  // Effet pour suivre les changements de thème
  useEffect(() => {
    // Enregistrer le thème actuel dans le localStorage
    localStorage.setItem('theme', theme);
    
    // Appliquer la classe de thème au document pour les styles globaux
    document.documentElement.className = theme;
  }, [theme]);
  
  const handleToggle = () => {
    // Activer l'animation de pulsation
    setIsChanging(true);
    
    // Désactiver l'animation après un délai
    setTimeout(() => setIsChanging(false), 500);
    
    // Basculer le thème
    toggleTheme();
  };

  return (
    <button 
      className={`theme-toggle-button ${isChanging ? 'theme-changing' : ''}`}
      onClick={handleToggle}
      aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

export default ThemeToggle;
