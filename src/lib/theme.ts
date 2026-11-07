/**
 * Light / dark theme. The choice is kept in localStorage (a per-viewer
 * preference); without one, the system setting decides. The theme is applied
 * as `data-theme` on <html>, which `styles/themes.scss` reads.
 */
export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

export const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage unavailable: fall back to the system setting.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
};

export const saveTheme = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not persisted; the theme still applies for this visit.
  }
};
