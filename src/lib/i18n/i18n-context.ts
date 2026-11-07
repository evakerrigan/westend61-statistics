import { createContext } from 'react';
import type { Language } from './language';
import { en, type MessageKey, type Messages, ru } from './messages';

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: TranslateParams) => string;

export type I18nValue = {
  language: Language;
  /** Switches between English and Russian. */
  toggleLanguage: () => void;
  t: Translate;
};

const dictionaries: Record<Language, Messages> = { en, ru };

/** Picks the plural form of a word for `n`: `one|other` / `one|few|many`. */
const pluralForm = (language: Language, n: number, forms: string[]) => {
  if (language === 'en') return n === 1 ? forms[0] : forms[1];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2] ?? forms[1];
};

/**
 * Fills `{name}` placeholders, and `{name|form|form…}` with the plural form
 * of a word for that number, e.g. `{n} {n|photo|photos}`.
 */
export const makeTranslate =
  (language: Language): Translate =>
  (key, params) => {
    const text = dictionaries[language][key];
    if (!params) return text;
    return text.replace(
      /\{(\w+)(?:\|([^}]+))?\}/g,
      (match, name: string, forms?: string) => {
        if (!(name in params)) return match;
        const value = params[name];
        if (!forms) return String(value);
        return pluralForm(language, Number(value), forms.split('|'));
      }
    );
  };

export const I18nContext = createContext<I18nValue>({
  language: 'en',
  toggleLanguage: () => {},
  t: makeTranslate('en'),
});
