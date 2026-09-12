'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

type Theme = 'day' | 'night' | 'auto';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'day' | 'night';
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'auto',
  resolvedTheme: 'day',
  setTheme: () => {},
  toggleTheme: () => {},
});

function getResolvedTheme(t: Theme): 'day' | 'night' {
  if (t === 'auto') {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6 ? 'night' : 'day';
  }
  return t;
}

function applyToDOM(resolved: 'day' | 'night') {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved;
  }
}

function readStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'auto';
  return (localStorage.getItem('tadac-theme') as Theme) ?? 'auto';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'day' | 'night'>('day');
  const themeRef = useRef<Theme>('auto');

  // Bootstrap from localStorage on mount
  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = getResolvedTheme(stored);
    themeRef.current = stored;
    
    // Defer state update slightly to avoid synchronous setState warning
    setTimeout(() => {
      setThemeState(stored);
      setResolvedTheme(resolved);
      applyToDOM(resolved);
    }, 0);
  }, []); // intentionally runs once on mount only

  // Re-evaluate auto theme every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (themeRef.current === 'auto') {
        const resolved = getResolvedTheme('auto');
        setResolvedTheme(resolved);
        applyToDOM(resolved);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    const resolved = getResolvedTheme(t);
    themeRef.current = t;
    setThemeState(t);
    setResolvedTheme(resolved);
    applyToDOM(resolved);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tadac-theme', t);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'day' ? 'night' : 'day');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
