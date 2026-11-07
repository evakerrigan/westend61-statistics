import { Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useI18n } from '@/hooks/use-i18n';
import { formatDate } from '@/utils/format';
import styles from './app-layout.module.scss';

const TELEGRAM_URL = 'https://t.me/EvaKerrigan';

export const AppLayout = () => {
  const { t } = useI18n();
  return (
    <div className={styles.appLayout}>
      <main className={styles.appLayout__content}>
        <Outlet />
      </main>
      <footer className={styles.appLayout__footer}>
        <div className={styles.appLayout__footerInner}>
          <div>
            {t('footer.author')}{' '}
            <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              Telegram @EvaKerrigan
            </a>
            <div className={styles.appLayout__disclaimer}>
              {t('footer.disclaimer')}
            </div>
          </div>
          <div className={styles.appLayout__version}>
            {t('footer.version', {
              version: __APP_VERSION__,
              date: formatDate(__BUILD_DATE__),
            })}
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
};
