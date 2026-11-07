import { useContext } from 'react';
import { I18nContext } from '@/lib/i18n';

/** The interface language, the `t()` translator and a language toggle. */
export const useI18n = () => useContext(I18nContext);
