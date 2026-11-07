import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useI18n } from '@/hooks/use-i18n';
import { clearAllData } from '@/lib/storage';
import styles from './clear-data.module.scss';

/**
 * Wipes everything the extension stored in this browser — e.g. after using it
 * on someone else's computer — then reloads into a clean state.
 */
export const ClearData = () => {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    await clearAllData();
    window.location.reload();
  };

  return (
    <div className={styles.clearData}>
      <button
        type="button"
        className={styles.clearData__button}
        onClick={() => setConfirming(true)}
      >
        {t('data.deleteAll')}
      </button>
      <Modal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title={t('data.deleteTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleDelete}>{t('data.delete')}</Button>
          </>
        }
      >
        {t('data.deleteBody')}
      </Modal>
    </div>
  );
};
