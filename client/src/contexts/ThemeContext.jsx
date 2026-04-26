import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ss_theme';
const DEFAULT_THEME = 'dark';

const themePalettes = {
  dark: {
    '--brand-bg': '#0a0e1a',
    '--brand-surface': '#111827',
    '--brand-card': '#1a2235',
    '--brand-border': '#1f2d45',
    '--brand-accent': '#3b82f6',
    '--brand-accent-hover': '#2563eb',
    '--brand-danger': '#ef4444',
    '--brand-danger-dark': '#b91c1c',
    '--brand-text': '#e2e8f0',
    '--brand-muted': '#94a3b8',
    '--brand-subtle': '#cbd5e1',
  },
  light: {
    '--brand-bg': '#f8fafc',
    '--brand-surface': '#ffffff',
    '--brand-card': '#f1f5f9',
    '--brand-border': '#cbd5e1',
    '--brand-accent': '#2563eb',
    '--brand-accent-hover': '#1d4ed8',
    '--brand-danger': '#dc2626',
    '--brand-danger-dark': '#991b1b',
    '--brand-text': '#0f172a',
    '--brand-muted': '#475569',
    '--brand-subtle': '#64748b',
  },
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  const palette = themePalettes[theme] || themePalettes.dark;

  root.dataset.theme = theme;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
