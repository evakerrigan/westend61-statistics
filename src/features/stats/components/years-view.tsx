import { Fragment, useMemo, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { COMPACT_QUERY, useMediaQuery } from '@/hooks/use-media-query';
import {
  formatDate,
  formatDecimal,
  formatDuration,
  formatMoney,
  formatMoneyShort,
  formatMonths,
} from '@/utils/format';
import { useHiddenChartYears } from '../hooks/use-hidden-chart-years';
import { type SortAccessors, useSort } from '../hooks/use-sort';
import { updatedSortKey, type ShootStat } from '../utils/aggregate';
import { shootSubtitle, shootTitle } from '../utils/shoot-labels';
import {
  buildYearSales,
  saleAmount,
  buildYears,
  salesPerHundredPhotos,
  type YearStat,
} from '../utils/years';
import { SortHeader, StackedSortHeader } from './sort-header';
import { StackRow } from './stack-row';
import { TableWrap } from './table-wrap';
import { YearsChart } from './years-chart';
import styles from './table.module.scss';
import yearStyles from './years-view.module.scss';

type YearsViewProps = {
  shoots: ShootStat[];
};

const COLUMN_COUNT = 6;

/** One row per upload year; a row opens the table of that year's shoots. */
export const YearsView = ({ shoots }: YearsViewProps) => {
  const { t } = useI18n();
  const years = useMemo(() => buildYears(shoots), [shoots]);
  const yearSales = useMemo(() => buildYearSales(years), [years]);
  const yearRevenue = useMemo(() => buildYearSales(years, saleAmount), [years]);
  const perHundred = useMemo(
    () => salesPerHundredPhotos(yearSales),
    [yearSales]
  );
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());
  const hiddenYears = useHiddenChartYears();
  const chartYears = (chart: string) => ({
    hiddenYears: hiddenYears.value[chart] ?? [],
    onToggleYear: (year: string) => hiddenYears.toggle(chart, year),
  });

  const accessors = useMemo<SortAccessors<YearStat>>(
    () => ({
      year: (y) => y.year,
      avgOnSale: (y) => y.avgMonthsOnSale ?? -1,
      shoots: (y) => y.shoots.length,
      photos: (y) => y.photoCount,
      sales: (y) => y.salesCount,
      revenue: (y) => y.revenue,
    }),
    []
  );
  const { sorted, sortKey, direction, toggle } = useSort(
    years,
    accessors,
    'year'
  );
  const header = { sortKey, direction, onSort: toggle };

  const toggleYear = (year: string) =>
    setOpenYears((current) => {
      const next = new Set(current);
      if (!next.delete(year)) next.add(year);
      return next;
    });

  return (
    <div className={yearStyles.years}>
      <TableWrap>
        <table className={styles.table}>
          <thead>
            <tr>
              <SortHeader
                label={t('years.col.year')}
                columnKey="year"
                className={styles.table__pinned}
                {...header}
              />
              <SortHeader
                label={t('years.avgOnSale')}
                columnKey="avgOnSale"
                numeric
                {...header}
              />
              <SortHeader
                label={t('stats.shoots')}
                columnKey="shoots"
                numeric
                {...header}
              />
              <SortHeader
                label={t('years.photos')}
                columnKey="photos"
                numeric
                {...header}
              />
              <SortHeader
                label={t('stats.sales')}
                columnKey="sales"
                numeric
                {...header}
              />
              <SortHeader
                label={t('years.revenue')}
                columnKey="revenue"
                numeric
                className={styles.table__revenue}
                {...header}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className={styles.table__empty}>
                  {t('shoots.empty')}
                </td>
              </tr>
            )}
            {sorted.map((year) => {
              const isOpen = openYears.has(year.year);
              return (
                <Fragment key={year.year}>
                  <tr
                    className={styles.table__clickable}
                    onClick={() => toggleYear(year.year)}
                  >
                    <td className={styles.table__pinned}>
                      {/* Clicks bubble up to the row, which does the toggling. */}
                      <button
                        type="button"
                        className={yearStyles.toggle}
                        aria-expanded={isOpen}
                      >
                        <span
                          aria-hidden="true"
                          className={`${yearStyles.arrow} ${isOpen ? yearStyles.arrowOpen : ''}`}
                        />
                        {year.year}
                      </button>
                    </td>
                    <td className={styles.table__num}>
                      {year.avgMonthsOnSale === null
                        ? '—'
                        : formatMonths(year.avgMonthsOnSale)}
                    </td>
                    <td className={styles.table__num}>{year.shoots.length}</td>
                    <td className={styles.table__num}>{year.photoCount}</td>
                    <td className={styles.table__num}>{year.salesCount}</td>
                    <td
                      className={`${styles.table__num} ${styles.table__revenue}`}
                    >
                      {formatMoney(year.revenue)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={COLUMN_COUNT} className={yearStyles.details}>
                        <YearShootsTable shoots={year.shoots} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </TableWrap>

      {/* Wait for the saved choice, so hidden years don't flash on load. */}
      {years.length > 0 && hiddenYears.ready && (
        <>
          <h2 className={yearStyles.chartTitle}>{t('years.chart.title')}</h2>
          <YearsChart
            sales={yearSales}
            integer
            note={t('years.chart.note')}
            {...chartYears('sales')}
          />
          <h2 className={yearStyles.chartTitle}>{t('years.revenue.title')}</h2>
          <YearsChart
            sales={yearRevenue}
            formatValue={formatMoney}
            formatTick={formatMoneyShort}
            note={t('years.revenue.note')}
            {...chartYears('revenue')}
          />
          <h2 className={yearStyles.chartTitle}>
            {t('years.perHundred.title')}
          </h2>
          <YearsChart
            sales={perHundred}
            formatValue={formatDecimal}
            note={t('years.perHundred.note')}
            {...chartYears('perHundred')}
          />
        </>
      )}
    </div>
  );
};

/** A year's shoots: the shoots table's main columns, without partners. */
const YearShootsTable = ({ shoots }: { shoots: ShootStat[] }) => {
  const { t } = useI18n();
  const compact = useMediaQuery(COMPACT_QUERY);

  const accessors = useMemo<SortAccessors<ShootStat>>(
    () => ({
      title: (s) => shootTitle(s, t),
      createdAt: updatedSortKey,
      onSale: (s) =>
        s.publishedAt
          ? Date.now() - new Date(s.publishedAt.slice(0, 10)).getTime()
          : -1,
      published: (s) => s.publishedCount ?? -1,
      sold: (s) => s.photos.length,
      sales: (s) => s.salesCount,
      revenue: (s) => s.revenue,
    }),
    [t]
  );
  const { sorted, sortKey, direction, toggle } = useSort(
    shoots,
    accessors,
    'createdAt'
  );
  const header = { sortKey, direction, onSort: toggle };

  return (
    <div className={yearStyles.subtable}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th aria-label={t('col.preview')} />
            <SortHeader label={t('col.shoot')} columnKey="title" {...header} />
            <StackedSortHeader
              columns={[
                { label: t('shoots.col.created'), columnKey: 'createdAt' },
                { label: t('shoots.col.onSale'), columnKey: 'onSale' },
              ]}
              className={styles.table__compact}
              {...header}
            />
            <StackedSortHeader
              columns={[
                {
                  label: t(
                    compact
                      ? 'shoots.col.publishedShort'
                      : 'shoots.col.published'
                  ),
                  columnKey: 'published',
                },
                {
                  label: t(
                    compact ? 'shoots.col.soldShort' : 'shoots.col.sold'
                  ),
                  columnKey: 'sold',
                },
              ]}
              numeric
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
          </tr>
        </thead>
        <tbody>
          {sorted.map((shoot) => (
            <tr key={shoot.key}>
              <td>
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
              </td>
              <td className={styles.table__titleCell}>
                <div className={styles.table__primary}>
                  {shootTitle(shoot, t)}
                </div>
                <div className={styles.table__secondary}>
                  {shootSubtitle(shoot, t)}
                </div>
              </td>
              <td className={styles.table__compact}>
                <div className={styles.table__stack}>
                  <span>{formatDate(shoot.updatedAt)}</span>
                  <span>{formatDuration(shoot.publishedAt)}</span>
                </div>
              </td>
              <td className={styles.table__num}>
                <div className={styles.table__pairs}>
                  <StackRow
                    label={t('shoots.pair.published')}
                    value={shoot.publishedCount ?? '—'}
                  />
                  <StackRow
                    label={t('shoots.pair.sold')}
                    value={shoot.photos.length}
                  />
                </div>
              </td>
              <td className={styles.table__num}>{shoot.salesCount}</td>
              <td className={`${styles.table__num} ${styles.table__revenue}`}>
                {formatMoney(shoot.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
