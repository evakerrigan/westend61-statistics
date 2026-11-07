import { useMemo, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import type { MessageKey } from '@/lib/i18n';
import type { Dataset } from '@/types/westend';
import { formatMoney, formatPercent } from '@/utils/format';
import { useManualShoots } from '../hooks/use-manual-shoots';
import { useShootMerges } from '../hooks/use-shoot-merges';
import { buildStats } from '../utils/aggregate';
import { partnerLabel } from '../utils/shoot-labels';
import { MonthsView } from './months-view';
import { PhotosTable } from './photos-table';
import { ShootsTable } from './shoots-table';
import styles from './stats-view.module.scss';
import { YearsView } from './years-view';

type StatsViewProps = {
  dataset: Dataset;
};

const TABS: {
  id: 'shoots' | 'photos' | 'months' | 'years';
  label: MessageKey;
}[] = [
  { id: 'shoots', label: 'tabs.shoots' },
  { id: 'photos', label: 'tabs.photos' },
  { id: 'months', label: 'tabs.months' },
  { id: 'years', label: 'tabs.years' },
];

type TabId = (typeof TABS)[number]['id'];

export const StatsView = ({ dataset }: StatsViewProps) => {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>('shoots');
  const manual = useManualShoots();
  const merges = useShootMerges();
  const stats = useMemo(
    () => buildStats(dataset, manual.value, merges.value),
    [dataset, manual.value, merges.value]
  );
  const ready = manual.ready && merges.ready;

  // Wait for the user's own shoots, so «No shoot» doesn't flash on load.
  if (!ready) return null;

  const missing = Math.round((stats.westendTotal - stats.revenue) * 100) / 100;
  const matchedShoots = stats.shoots.filter((s) => s.kind !== 'unmatched');
  const unmatched = stats.shoots.find((s) => s.kind === 'unmatched');

  return (
    <div className={styles.stats}>
      <h2 className={styles.sectionTitle}>{t('stats.overviewTitle')}</h2>
      <div className={styles.tiles}>
        <div className={styles.tile}>
          <div className={styles.tile__label}>{t('stats.earned')}</div>
          <div className={`${styles.tile__value} ${styles.tile__hero}`}>
            {formatMoney(stats.revenue)}
          </div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tile__label}>{t('stats.sales')}</div>
          <div className={styles.tile__value}>{stats.salesCount}</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tile__label}>{t('stats.soldPhotos')}</div>
          <div className={styles.tile__value}>
            {stats.soldPhotos}
            <span className={styles.tile__of}>
              {' '}
              {t('stats.of', { n: stats.publishedPhotos })}
            </span>
          </div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tile__label}>
            {t('stats.portfolioSuccess')}
          </div>
          <div className={styles.tile__value}>
            {stats.publishedPhotos
              ? formatPercent(stats.soldPhotos / stats.publishedPhotos)
              : '—'}
          </div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tile__label}>{t('stats.shoots')}</div>
          <div className={styles.tile__value}>{matchedShoots.length}</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tile__label}>{t('stats.perSold')}</div>
          <div className={styles.tile__value}>
            {stats.revenuePerSoldPhoto === null
              ? '—'
              : formatMoney(stats.revenuePerSoldPhoto)}
          </div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tile__label}>{t('stats.perPortfolio')}</div>
          <div className={styles.tile__value}>
            {stats.revenuePerPortfolioPhoto === null
              ? '—'
              : formatMoney(stats.revenuePerPortfolioPhoto)}
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>{t('stats.partnersTitle')}</h2>
      <div className={styles.tiles}>
        {stats.partners.map((p) => (
          <div key={p} className={styles.tile}>
            <div className={styles.tile__label}>{partnerLabel(p, t)}</div>
            <div className={styles.tile__value}>
              {formatMoney(
                stats.months.reduce((sum, m) => sum + (m.byPartner[p] ?? 0), 0)
              )}
            </div>
          </div>
        ))}
      </div>

      {Math.abs(missing) >= 0.01 && (
        <p className={styles.notice}>
          {t('stats.mismatch', {
            total: formatMoney(stats.westendTotal),
            collected: formatMoney(stats.revenue),
            diff: formatMoney(missing),
          })}
        </p>
      )}
      {dataset.shootsError && (
        <p className={styles.notice}>
          {t(
            dataset.shootsError === 'auth'
              ? 'stats.shootsAuth'
              : 'stats.shootsError'
          )}
        </p>
      )}
      {unmatched && unmatched.photos.length > 0 && (
        <p className={styles.notice}>
          {t('stats.unmatched', {
            count: unmatched.photos.length,
            amount: formatMoney(unmatched.revenue),
          })}
        </p>
      )}

      <div className={styles.tabs} role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
            onClick={() => setTab(item.id)}
          >
            {t(item.label)}
          </button>
        ))}
      </div>

      {tab === 'shoots' && (
        <ShootsTable
          shoots={stats.shoots}
          partners={stats.partners}
          manualShoots={manual.value}
          onManualShootsChange={manual.update}
          onMergeShoot={merges.merge}
          onUnmergeShoot={merges.unmerge}
        />
      )}
      {tab === 'photos' && (
        <PhotosTable
          photos={stats.photos}
          shoots={stats.shoots}
          partners={stats.partners}
        />
      )}
      {tab === 'months' && (
        <MonthsView
          months={stats.months}
          partners={stats.partners}
          portfolioDates={stats.portfolioDates}
        />
      )}
      {tab === 'years' && <YearsView shoots={stats.shoots} />}
    </div>
  );
};
