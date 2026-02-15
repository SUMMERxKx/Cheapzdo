import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId = 
  | 'default'
  | 'rain'
  | 'snow'
  | 'sunny'
  | 'winter'
  | 'autumn'
  | 'spring';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  particles?: 'rain' | 'snow' | 'leaves' | 'petals' | 'sun-rays';
}

export const themes: ThemeDefinition[] = [
  { id: 'default',  name: 'Default',  emoji: '🔴', description: 'Dark crimson' },
  { id: 'rain',     name: 'Rainy',    emoji: '🌧️', description: 'Moody downpour',   particles: 'rain' },
  { id: 'snow',     name: 'Snowy',    emoji: '🌨️', description: 'Gentle snowfall',  particles: 'snow' },
  { id: 'sunny',    name: 'Sunny',    emoji: '☀️', description: 'Golden daylight',  particles: 'sun-rays' },
  { id: 'winter',   name: 'Winter',   emoji: '❄️', description: 'Icy frost',        particles: 'snow' },
  { id: 'autumn',   name: 'Autumn',   emoji: '🍂', description: 'Falling leaves',   particles: 'leaves' },
  { id: 'spring',   name: 'Spring',   emoji: '🌸', description: 'Cherry blossoms',  particles: 'petals' },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  currentTheme: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'cheapzdo-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as ThemeId) || 'default';
  });

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
