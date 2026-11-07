import { ToggleButton } from '@/components/ui/toggle-button';
import { useI18n } from '@/hooks/use-i18n';
import styles from './language-toggle.module.scss';

/** Switches the interface language; shows the language it switches to. */
export const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useI18n();
  return (
    <ToggleButton label={t('language.switch')} onClick={toggleLanguage}>
      <span className={styles.code}>{language === 'en' ? 'RU' : 'EN'}</span>
    </ToggleButton>
  );
};
