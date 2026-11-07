import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useI18n } from '@/hooks/use-i18n';
import {
  WestendAuthError,
  WestendFormatError,
  WestendHttpError,
  isExtensionContext,
} from '@/lib/westend-client';
import type { Translate } from '@/lib/i18n';
import { saveDataset } from '@/lib/storage';
import type { Dataset } from '@/types/westend';
import { formatDate, formatTime } from '@/utils/format';
import { collectDataset, type SyncProgress } from '../collect';
import styles from './sync-panel.module.scss';

type SyncPanelProps = {
  /** Data from the previous update, if any. */
  dataset: Dataset | null;
  onSynced: (dataset: Dataset) => void;
};

const progressLabel = (progress: SyncProgress, t: Translate) => {
  switch (progress.step) {
    case 'connect':
      return t('progress.connect');
    case 'sales':
      return t('progress.sales');
    case 'portfolio':
      return t('progress.portfolio');
    case 'dates':
      return t('progress.dates');
    case 'shootList':
      return t('progress.shootList');
    case 'shoots':
      return t('progress.shoots');
  }
};

const errorMessage = (error: unknown, t: Translate) => {
  if (error instanceof WestendAuthError) return t('sync.errorAuth');
  if (error instanceof WestendFormatError) {
    // The technical detail tells the author what exactly didn't parse.
    return `${t('sync.errorFormat')} (${error.message})`;
  }
  if (error instanceof WestendHttpError) {
    return t('sync.errorHttp', { status: error.status });
  }
  return error instanceof Error ? error.message : String(error);
};

export const SyncPanel = ({ dataset, onSynced }: SyncPanelProps) => {
  const { t } = useI18n();
  const syncedAt = dataset?.syncedAt ?? null;
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<unknown>(null);
  const canSync = isExtensionContext();

  const handleSync = async () => {
    setError(null);
    try {
      const next = await collectDataset(setProgress, dataset);
      await saveDataset(next);
      onSynced(next);
    } catch (e) {
      setError(e);
    } finally {
      setProgress(null);
    }
  };

  const percent = progress
    ? Math.min(
        100,
        Math.round((progress.done / Math.max(1, progress.total)) * 100)
      )
    : 0;

  return (
    <section className={styles.syncPanel}>
      <div className={styles.syncPanel__row}>
        <h1 className={styles.syncPanel__title}>{t('app.title')}</h1>
        <div className={styles.syncPanel__controls}>
          <div className={styles.syncPanel__actions}>
            <LanguageToggle />
            <ThemeToggle />
            <Button onClick={handleSync} disabled={!!progress || !canSync}>
              {progress
                ? t('sync.loading')
                : dataset
                  ? t('sync.quick')
                  : t('sync.first')}
            </Button>
            {syncedAt && (
              <div
                className={styles.syncPanel__updated}
                title={t('sync.updatedAt', {
                  date: formatDate(syncedAt),
                  time: formatTime(syncedAt),
                })}
              >
                <span>{t('sync.updatedLabel')}</span>
                <span>{formatDate(syncedAt)}</span>
              </div>
            )}
          </div>
          {!syncedAt && (
            <p className={styles.syncPanel__meta}>{t('sync.noData')}</p>
          )}
        </div>
      </div>
      {!canSync && (
        <p className={styles.syncPanel__note}>{t('sync.extensionOnly')}</p>
      )}

      {progress && (
        <div className={styles.syncPanel__progress}>
          <div className={styles.syncPanel__progressLabel}>
            <span>{progressLabel(progress, t)}</span>
            {progress.total > 1 && (
              <span>
                {progress.done} / {progress.total}
              </span>
            )}
          </div>
          <div className={styles.syncPanel__bar}>
            <div
              className={styles.syncPanel__barFill}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className={styles.syncPanel__note}>{t('sync.keepOpen')}</p>
        </div>
      )}

      {error !== null && (
        <p role="alert" className={styles.syncPanel__error}>
          {errorMessage(error, t)}
        </p>
      )}
    </section>
  );
};
