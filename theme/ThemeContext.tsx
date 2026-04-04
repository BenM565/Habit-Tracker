import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const lightColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceAlt: '#f0f0f0',
  text: '#1a1a1a',
  subtext: '#666666',
  muted: '#999999',
  border: '#dddddd',
  progressBg: '#e0e0e0',
  primary: '#4CAF50',
  danger: '#FF6B6B',
  accent: '#2196F3',
  warning: '#FFA502',
  tabBar: '#ffffff',
  tabBarBorder: '#e0e0e0',
};

export const darkColors = {
  background: '#0f0f0f',
  surface: '#1c1c1e',
  surfaceAlt: '#2c2c2e',
  text: '#f2f2f7',
  subtext: '#aeaeb2',
  muted: '#636366',
  border: '#3a3a3c',
  progressBg: '#2c2c2e',
  primary: '#4CAF50',
  danger: '#FF6B6B',
  accent: '#2196F3',
  warning: '#FFA502',
  tabBar: '#1c1c1e',
  tabBarBorder: '#3a3a3c',
};

export type ThemeColors = typeof lightColors;

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(v => {
      if (v === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
