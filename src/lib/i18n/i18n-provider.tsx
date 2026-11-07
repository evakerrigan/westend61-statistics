import { type ReactNode, useMemo, useState } from 'react';
import { I18nContext, makeTranslate } from './i18n-context';
import {
  getInitialLanguage,
  type Language,
  saveLanguage,
  setActiveLanguage,
} from './language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const initial = getInitialLanguage();
    setActiveLanguage(initial);
    return initial;
  });

  const value = useMemo(
    () => ({
      language,
      t: makeTranslate(language),
      toggleLanguage: () => {
        const next: Language = language === 'en' ? 'ru' : 'en';
        // Before the re-render, so formatting helpers already use it.
        setActiveLanguage(next);
        saveLanguage(next);
        setLanguage(next);
      },
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
