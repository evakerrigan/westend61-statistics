import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import styles from './scroll-to-top.module.scss';

// Shown once the page is scrolled further than this.
const SHOW_AFTER_PX = 400;

/** A floating «back to top» arrow in the bottom-right corner. */
export const ScrollToTop = () => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={styles.scrollToTop}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('common.scrollTop')}
      title={t('common.scrollTop')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 16V4M10 4L4.5 9.5M10 4l5.5 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
