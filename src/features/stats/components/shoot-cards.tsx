import { useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import type { ManualShoot } from '@/types/westend';
import { formatDate, formatDuration, formatMoney } from '@/utils/format';
import type { ManualShootsUpdate } from '../hooks/use-manual-shoots';
import type { ShootStat } from '../utils/aggregate';
import { partnerSortKey } from '../utils/partner-columns';
import { partnerLabel, shootSubtitle, shootTitle } from '../utils/shoot-labels';
import { CardStat, RevenueBox } from './card-stat';
import { ShootDetails } from './shoot-details';
import type { SortState } from './sort-header';
import { SortBar } from './sort-bar';
import cardStyles from './cards.module.scss';
import styles from './table.module.scss';
import shootStyles from './shoots-table.module.scss';

type ShootCardsProps = SortState & {
  /** Already sorted. */
  shoots: ShootStat[];
  /** Every shoot, for joining shoots together in the details. */
  allShoots: ShootStat[];
  partners: string[];
  manualShoots: ManualShoot[];
  onManualShootsChange: (update: ManualShootsUpdate) => void;
  onMergeShoot: (source: string, target: string) => void;
  onUnmergeShoot: (source: string) => void;
};

/** The shoots table as cards, for narrow screens. */
export const ShootCards = ({
  shoots,
  allShoots,
  partners,
  sortKey,
  direction,
  onSort,
  ...detailsProps
}: ShootCardsProps) => {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const options = [
    { label: t('col.revenue'), columnKey: 'revenue' },
    { label: t('shoots.col.perPhoto'), columnKey: 'perPhoto' },
    { label: t('col.sales'), columnKey: 'sales' },
    { label: t('shoots.col.published'), columnKey: 'published' },
    { label: t('shoots.col.sold'), columnKey: 'sold' },
    { label: t('shoots.col.created'), columnKey: 'createdAt' },
    { label: t('shoots.col.onSale'), columnKey: 'onSale' },
    { label: t('col.shoot'), columnKey: 'title' },
    ...partners.map((p) => ({
      label: partnerLabel(p, t),
      columnKey: partnerSortKey(p),
    })),
  ];

  return (
    <>
      <SortBar
        options={options}
        sortKey={sortKey}
        direction={direction}
        onSort={onSort}
      />
      {shoots.length === 0 && (
        <p className={styles.table__empty}>{t('shoots.empty')}</p>
      )}
      <div className={cardStyles.cards}>
        {shoots.map((shoot) => {
          const isOpen = openKey === shoot.key;
          const sorted = (key: string) => key === sortKey;
          return (
            <article key={shoot.key} className={cardStyles.card}>
              <div
                className={cardStyles.card__clickable}
                onClick={() => setOpenKey(isOpen ? null : shoot.key)}
                aria-expanded={isOpen}
              >
                <div className={cardStyles.card__head}>
                  {shoot.thumbUrl ? (
                    <img
                      src={shoot.thumbUrl}
                      alt=""
                      loading="lazy"
                      className={`${styles.table__thumb} ${shoot.photos.length ? '' : styles.table__thumbUnsold}`}
                    />
                  ) : (
                    <div className={styles.table__thumb} />
                  )}
                  <div className={cardStyles.card__text}>
                    <div className={styles.table__primary}>
                      {shootTitle(shoot, t)}
                      {shoot.kind === 'manual' && (
                        <span className={shootStyles.manualBadge}>
                          {t('shoots.badgeManual')}
                        </span>
                      )}
                    </div>
                    <div className={styles.table__secondary}>
                      {shootSubtitle(shoot, t)}
                    </div>
                  </div>
                  <RevenueBox
                    label={t('col.revenue')}
                    value={formatMoney(shoot.revenue)}
                    highlighted={sorted('revenue')}
                  />
                </div>
                <div className={cardStyles.card__stats}>
                  <CardStat
                    label={t('shoots.col.perPhoto')}
                    value={
                      shoot.revenuePerPhoto === null
                        ? '—'
                        : formatMoney(shoot.revenuePerPhoto)
                    }
                    highlighted={sorted('perPhoto')}
                  />
                  <CardStat
                    label={t('col.sales')}
                    value={shoot.salesCount}
                    highlighted={sorted('sales')}
                  />
                  <CardStat
                    label={t('shoots.col.published')}
                    value={shoot.publishedCount ?? '—'}
                    highlighted={sorted('published')}
                  />
                  <CardStat
                    label={t('shoots.col.sold')}
                    value={shoot.photos.length}
                    highlighted={sorted('sold')}
                  />
                  <CardStat
                    label={t('shoots.col.created')}
                    value={formatDate(shoot.updatedAt)}
                    highlighted={sorted('createdAt')}
                  />
                  <CardStat
                    label={t('shoots.col.onSale')}
                    value={formatDuration(shoot.publishedAt)}
                    highlighted={sorted('onSale')}
                  />
                </div>
                {partners.length > 0 && (
                  <div
                    className={`${cardStyles.card__stats} ${cardStyles.card__partners}`}
                  >
                    {partners.map((p) => (
                      <CardStat
                        key={p}
                        label={partnerLabel(p, t)}
                        value={
                          shoot.byPartner[p]
                            ? formatMoney(shoot.byPartner[p])
                            : '—'
                        }
                        highlighted={sorted(partnerSortKey(p))}
                      />
                    ))}
                  </div>
                )}
              </div>
              {isOpen && (
                <div className={cardStyles.card__details}>
                  <ShootDetails
                    shoot={shoot}
                    shoots={allShoots}
                    {...detailsProps}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
};
