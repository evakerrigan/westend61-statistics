import { useMemo, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import type { MessageKey } from '@/lib/i18n';
import { formatMoney, formatMonth } from '@/utils/format';
import type { MonthStat } from '../utils/aggregate';
import { isDensePartnerTable } from '../utils/partner-columns';
import { partnerLabel } from '../utils/shoot-labels';
import { MonthsChart } from './months-chart';
import { TableWrap } from './table-wrap';
import styles from './table.module.scss';
import chartStyles from './months-view.module.scss';

type MonthsViewProps = {
  months: MonthStat[];
  partners: string[];
  /** Go-live dates of the portfolio images, oldest first. */
  portfolioDates: string[];
};

const RANGES: { label: MessageKey; count: number }[] = [
  { label: 'months.range12', count: 12 },
  { label: 'months.range24', count: 24 },
  { label: 'months.all', count: Infinity },
];

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Every month from the first sale up to now, with empty months as zero. */
const fillMonths = (months: MonthStat[]): MonthStat[] => {
  if (!months.length) return [];
  const byKey = new Map(months.map((m) => [m.key, m]));
  const [y, m] = months[0].key.split('-').map(Number);
  const cursor = new Date(y, m - 1, 1);
  const end = monthKey(new Date());
  const result: MonthStat[] = [];
  for (let key = monthKey(cursor); key <= end; key = monthKey(cursor)) {
    result.push(
      byKey.get(key) ?? { key, revenue: 0, salesCount: 0, byPartner: {} }
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
};

/** Images already published by the end of each month. */
const portfolioAtMonthEnd = (months: MonthStat[], dates: string[]) =>
  months.map((m) => dates.filter((d) => d.slice(0, 7) <= m.key).length);

export const MonthsView = ({
  months,
  partners,
  portfolioDates,
}: MonthsViewProps) => {
  const { t } = useI18n();
  const [range, setRange] = useState<number>(24);

  const allMonths = useMemo(() => fillMonths(months), [months]);
  const visible = useMemo(
    () => (Number.isFinite(range) ? allMonths.slice(-range) : allMonths),
    [allMonths, range]
  );
  const portfolio = useMemo(
    () =>
      portfolioDates.length
        ? portfolioAtMonthEnd(visible, portfolioDates)
        : null,
    [visible, portfolioDates]
  );

  return (
    <>
      <div className={chartStyles.toolbar}>
        <h2 className={chartStyles.title}>{t('months.title')}</h2>
        <div
          className={chartStyles.ranges}
          role="group"
          aria-label={t('months.period')}
        >
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              className={`${chartStyles.range} ${range === r.count ? chartStyles.rangeActive : ''}`}
              aria-pressed={range === r.count}
              onClick={() => setRange(r.count)}
            >
              {t(r.label)}
            </button>
          ))}
        </div>
      </div>

      <MonthsChart
        months={visible}
        value={(m) => m.revenue}
        formatValue={formatMoney}
        formatTick={(tick) => `$${tick}`}
        seriesLabel={t('months.legendRevenue')}
        portfolio={portfolio}
        tooltipExtra={(m) => (
          <>
            <div className={chartStyles.tooltipMuted}>
              {t('months.tooltipSales', { n: m.salesCount })}
            </div>
            {partners
              .filter((p) => m.byPartner[p])
              .map((p) => (
                <div key={p} className={chartStyles.tooltipMuted}>
                  {partnerLabel(p, t)}: {formatMoney(m.byPartner[p])}
                </div>
              ))}
          </>
        )}
      />

      <h2 className={`${chartStyles.title} ${chartStyles.titleSpaced}`}>
        {t('months.salesTitle')}
      </h2>
      <MonthsChart
        months={visible}
        value={(m) => m.salesCount}
        formatValue={(n) => t('months.tooltipSales', { n })}
        formatTick={String}
        integer
        tone="sales"
        seriesLabel={t('months.legendSales')}
        portfolio={portfolio}
        tooltipExtra={(m) => (
          <div className={chartStyles.tooltipMuted}>
            {formatMoney(m.revenue)}
          </div>
        )}
      />

      <TableWrap>
        <table
          className={`${styles.table} ${isDensePartnerTable(partners, false) ? styles.table__dense : ''}`}
        >
          <thead>
            <tr>
              <th className={styles.table__pinned}>{t('months.col.month')}</th>
              <th className={styles.table__num}>{t('col.sales')}</th>
              <th className={`${styles.table__num} ${styles.table__revenue}`}>
                {t('col.revenue')}
              </th>
              {partners.map((p) => (
                <th key={p} className={styles.table__num}>
                  {partnerLabel(p, t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...visible]
              .reverse()
              .filter((m) => m.salesCount)
              .map((m) => (
                <tr key={m.key}>
                  <td className={styles.table__pinned}>{formatMonth(m.key)}</td>
                  <td className={styles.table__num}>{m.salesCount}</td>
                  <td
                    className={`${styles.table__num} ${styles.table__revenue}`}
                  >
                    {formatMoney(m.revenue)}
                  </td>
                  {partners.map((p) => (
                    <td key={p} className={styles.table__num}>
                      {m.byPartner[p] ? formatMoney(m.byPartner[p]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
};
