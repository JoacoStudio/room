import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { loadTheme, saveTheme, THEMES, isNight } from './useNotes';

export function useTheme() {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [theme, setTheme] = useState('auto');
  const [resolved, setResolved] = useState(systemScheme || 'light');

  useEffect(() => {
    loadTheme().then((saved) => {
      setTheme(saved);
      applyResolved(saved, systemScheme);
    });
  }, [systemScheme]);

  function applyResolved(t, scheme) {
    if (t === 'dark') {
      setResolved('dark');
    } else if (t === 'light') {
      setResolved('light');
    } else {
      // auto: usar esquema del sistema, con fallback a noche/día por hora
      setResolved(scheme || (isNight() ? 'dark' : 'light'));
    }
  }

  function cycleTheme() {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
    saveTheme(next);
    applyResolved(next, systemScheme);
    return next;
  }

  return { theme, resolved, cycleTheme };
}
