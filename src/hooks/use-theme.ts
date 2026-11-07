import { useCallback, useState } from 'react';
import { applyTheme, saveTheme, type Theme } from '@/lib/theme';

/** The current theme and a toggle that applies and remembers the switch. */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
};
