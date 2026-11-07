import { useMemo, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import {
  COMPACT_QUERY,
  MOBILE_QUERY,
  useMediaQuery,
} from '@/hooks/use-media-query';
import { formatDate, formatMoney } from '@/utils/format';
import { type SortAccessors, useSort } from '../hooks/use-sort';
import {
  type PhotoStat,
  type ShootStat,
  UNMATCHED_KEY,
} from '../utils/aggregate';
import {
  isDensePartnerTable,
  partnerColumnCount,
} from '../utils/partner-columns';
import { shootTitle } from '../utils/shoot-labels';
import { PartnerCells, PartnerHeaders } from './partner-columns';
import { PhotoCards } from './photo-cards';
import { SortHeader } from './sort-header';
import { TableWrap } from './table-wrap';
import styles from './table.module.scss';
import photoStyles from './photos-table.module.scss';

type PhotosTableProps = {
  photos: PhotoStat[];
  shoots: ShootStat[];
  partners: string[];
};

export const PhotosTable = ({ photos, shoots, partners }: PhotosTableProps) => {
  const { t } = useI18n();
  const compact = useMediaQuery(COMPACT_QUERY);
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [query, setQuery] = useState('');

  const shootTitles = useMemo(
    () => new Map(shoots.map((s) => [s.key, shootTitle(s, t)])),
    [shoots, t]
  );
  const titleOf = (photo: PhotoStat) =>
    shootTitles.get(photo.shootKey ?? UNMATCHED_KEY) ?? '—';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter((p) =>
      [
        p.product.id,
        p.product.headline,
        shootTitles.get(p.shootKey ?? UNMATCHED_KEY) ?? '',
      ].some((field) => field.toLowerCase().includes(q))
    );
  }, [photos, query, shootTitles]);

  const accessors = useMemo<SortAccessors<PhotoStat>>(
    () => ({
      id: (p) => p.product.id,
      shoot: (p) => shootTitles.get(p.shootKey ?? UNMATCHED_KEY) ?? '',
      sales: (p) => p.sales.length,
      revenue: (p) => p.revenue,
      lastSale: (p) => p.lastSale ?? '',
      ...Object.fromEntries(
        partners.map((name) => [
          `partner:${name}`,
          (p: PhotoStat) => p.byPartner[name] ?? 0,
        ])
      ),
    }),
    [partners, shootTitles]
  );
  const { sorted, sortKey, direction, toggle } = useSort(
    filtered,
    accessors,
    'revenue'
  );
  const header = { sortKey, direction, onSort: toggle };

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('photos.search')}
        className={photoStyles.search}
      />
      {mobile ? (
        <PhotoCards
          photos={sorted}
          partners={partners}
          shootTitleOf={titleOf}
          emptyText={query ? t('details.nothingFound') : t('photos.empty')}
          {...header}
        />
      ) : (
        <TableWrap>
          <table
            className={`${styles.table} ${isDensePartnerTable(partners, compact) ? styles.table__dense : ''}`}
          >
            <thead>
              <tr>
                <th
                  aria-label={t('col.preview')}
                  className={styles.table__pinned}
                />
                <SortHeader
                  label={t('photos.col.photo')}
                  columnKey="id"
                  {...header}
                />
                <SortHeader
                  label={t('col.shoot')}
                  columnKey="shoot"
                  {...header}
                />
                <SortHeader
                  label={t('col.sales')}
                  columnKey="sales"
                  numeric
                  {...header}
                />
                <SortHeader
                  label={t('col.revenue')}
                  columnKey="revenue"
                  numeric
                  className={styles.table__revenue}
                  {...header}
                />
                <PartnerHeaders
                  partners={partners}
                  compact={compact}
                  {...header}
                />
                <SortHeader
                  label={t('photos.col.lastSale')}
                  columnKey="lastSale"
                  numeric
                  {...header}
                />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={6 + partnerColumnCount(partners, compact)}
                    className={styles.table__empty}
                  >
                    {query ? t('details.nothingFound') : t('photos.empty')}
                  </td>
                </tr>
              )}
              {sorted.map((photo) => (
                <tr key={photo.product.id}>
                  <td className={styles.table__pinned}>
                    <img
                      src={photo.product.thumbUrl}
                      alt=""
                      loading="lazy"
                      className={styles.table__thumb}
                    />
                  </td>
                  <td
                    className={`${photoStyles.photoCell} ${styles.table__titleCell}`}
                  >
                    <a
                      href={photo.product.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${styles.table__primary} ${styles.table__link}`}
                    >
                      {photo.product.id}
                    </a>
                    <div className={styles.table__secondary}>
                      {photo.product.headline}
                    </div>
                  </td>
                  <td>{titleOf(photo)}</td>
                  <td className={styles.table__num}>{photo.sales.length}</td>
                  <td
                    className={`${styles.table__num} ${styles.table__revenue}`}
                  >
                    {formatMoney(photo.revenue)}
                  </td>
                  <PartnerCells
                    partners={partners}
                    byPartner={photo.byPartner}
                    compact={compact}
                    sortKey={sortKey}
                  />
                  <td className={styles.table__num}>
                    {formatDate(photo.lastSale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
};
