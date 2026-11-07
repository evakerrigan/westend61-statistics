/**
 * Interface language. English by default; the choice is kept in localStorage
 * (a per-viewer preference). The active language is also mirrored here so
 * plain formatting helpers (`utils/format.ts`) can read it.
 */
export type Language = 'en' | 'ru';

const LANGUAGE_KEY = 'language';

let activeLanguage: Language = 'en';

export const getActiveLanguage = () => activeLanguage;

export const setActiveLanguage = (language: Language) => {
  activeLanguage = language;
  document.documentElement.lang = language;
};

export const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // Storage unavailable: use the default.
  }
  return 'en';
};

export const saveLanguage = (language: Language) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Not persisted; the language still applies for this visit.
  }
};
