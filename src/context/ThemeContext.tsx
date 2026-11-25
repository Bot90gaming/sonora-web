import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ThemeStyle,
  getStoredUiSettings,
  saveUiSettings,
  applyUiSettingsToDOM,
  SETTINGS_CHANGED_EVENT,
} from '../utils/settings';

export type Theme = ThemeStyle;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'light' || urlTheme === 'dark' || urlTheme === 'amoled') {
        return urlTheme as Theme;
      }
    }
    const ui = getStoredUiSettings();
    return ui.theme || 'dark';
  });

  // Apply UI settings including theme, accent, glass, motion to DOM on startup and change
  useEffect(() => {
    const currentUi = getStoredUiSettings();
    const updated = { ...currentUi, theme };
    applyUiSettingsToDOM(updated);
  }, [theme]);

  // Listen to cross-component settings updates
  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'ui' && customEvent.detail?.settings?.theme) {
        setThemeState(customEvent.detail.settings.theme);
      }
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    saveUiSettings({ theme: nextTheme });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveUiSettings({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
