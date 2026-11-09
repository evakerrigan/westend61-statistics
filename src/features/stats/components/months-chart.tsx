import { type ReactNode, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { formatMonth, formatMonthShort } from '@/utils/format';
import type { MonthStat } from '../utils/aggregate';
import { niceTicks } from '../utils/chart-ticks';
import styles from './months-view.module.scss';

type MonthsChartProps = {
  months: MonthStat[];
  /** The bar value of a month. */
  value: (month: MonthStat) => number;
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  seriesLabel: string;
  /** Bar values are counts: use whole-number ticks. */
  integer?: boolean;
  /** `sales` draws the bars in violet, to tell the two charts apart. */
  tone?: 'revenue' | 'sales';
  /**
   * Images in the portfolio at the end of each month (aligned with `months`),
   * drawn as a green area behind the bars on its own right-hand scale.
   */
  portfolio: number[] | null;
  /** Extra tooltip lines for a month. */
  tooltipExtra?: (month: MonthStat) => ReactNode;
  /** Tooltip title of a column; month names by default. */
  formatKey?: (key: string) => string;
  /**
   * Label of every column under the chart. By default months are labelled
   * sparsely, with the year on January.
   */
  formatAxisKey?: (key: string) => string;
  className?: string;
  /** Text written at the top of each bar (inside it, or above a short one). */
  barLabel?: (month: MonthStat) => string;
};

/** Bars lower than this share of the plot get their label above them. */
const LABEL_INSIDE_MIN = 12;

const monthAxisLabel = (key: string, i: number, labelEvery: number) =>
  i % labelEvery === 0
    ? key.endsWith('-01') || i === 0
      ? formatMonth(key)
      : formatMonthShort(key)
    : '';

/** Monthly bars, optionally over the growth of the portfolio. */
export const MonthsChart = ({
  months,
  value,
  formatValue,
  formatTick,
  seriesLabel,
  integer = false,
  tone = 'revenue',
  portfolio,
  tooltipExtra,
  formatKey = formatMonth,
  formatAxisKey,
  className = '',
  barLabel,
}: MonthsChartProps) => {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);

  const ticks = niceTicks(Math.max(0, ...months.map(value)), integer);
  const axisMax = ticks[ticks.length - 1] || 1;
  const portfolioTicks = portfolio
    ? niceTicks(Math.max(0, ...portfolio), true)
    : [];
  const portfolioMax = portfolioTicks[portfolioTicks.length - 1] || 1;
  const labelEvery = Math.ceil(months.length / 24);
  const toneClass = tone === 'sales' ? styles.toneSales : '';

  // The area's points sit at the centre of each month's column.
  const n = months.length;
  const y = (count: number) => 100 - (count / portfolioMax) * 100;
  const points = portfolio?.map((count, i) => `${i + 0.5},${y(count)}`) ?? [];
  const area =
    portfolio && n
      ? `M0,${y(portfolio[0])} L${points.join(' L')} L${n},${y(portfolio[n - 1])} L${n},100 L0,100 Z`
      : '';
  const line =
    portfolio && n
      ? `M0,${y(portfolio[0])} L${points.join(' L')} L${n},${y(portfolio[n - 1])}`
      : '';

  return (
    <div className={`${styles.chart} ${toneClass} ${className}`}>
      <div className={styles.legend}>
        <span className={styles.legend__item}>
          <span className={`${styles.legend__swatch} ${styles.legend__bar}`} />
          {seriesLabel}
        </span>
        {portfolio && (
          <span className={styles.legend__item}>
            <span
              className={`${styles.legend__swatch} ${styles.legend__area}`}
            />
            {t('months.legendPortfolio')}
          </span>
        )}
      </div>

      <div
        className={`${styles.plot} ${portfolio ? styles.plotWithRightAxis : ''}`}
      >
        {ticks.map((tick) => (
          <div
            key={tick}
            className={styles.gridline}
            style={{ bottom: `${(tick / axisMax) * 100}%` }}
          >
            <span className={styles.tick}>{formatTick(tick)}</span>
          </div>
        ))}
        {portfolioTicks.map((tick) => (
          <span
            key={tick}
            className={styles.tickRight}
            style={{ bottom: `${(tick / portfolioMax) * 100}%` }}
          >
            {tick}
          </span>
        ))}

        {portfolio && (
          <svg
            className={styles.area}
            viewBox={`0 0 ${n} 100`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={area} className={styles.area__fill} />
            <path
              d={line}
              className={styles.area__line}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        <div className={styles.columns}>
          {months.map((m, i) => {
            const height = (value(m) / axisMax) * 100;
            const label = value(m) > 0 ? barLabel?.(m) : undefined;
            return (
              <div
                key={m.key}
                className={styles.slot}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className={`${styles.bar} ${hovered !== null && hovered !== i ? styles.barDim : ''}`}
                  style={{ height: `${height}%` }}
                >
                  {label && (
                    <span
                      className={`${styles.barLabel} ${height < LABEL_INSIDE_MIN ? styles.barLabelAbove : ''}`}
                    >
                      {label}
                    </span>
                  )}
                </div>
                {hovered === i && (
                  <div className={styles.tooltip} role="tooltip">
                    <strong>{formatKey(m.key)}</strong>
                    <div>{formatValue(value(m))}</div>
                    {tooltipExtra?.(m)}
                    {portfolio && (
                      <div className={styles.tooltipMuted}>
                        {t('months.tooltipPortfolio', { n: portfolio[i] })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`${styles.labels} ${portfolio ? styles.plotWithRightAxis : ''}`}
      >
        {months.map((m, i) => (
          <span key={m.key} className={styles.label}>
            {formatAxisKey
              ? formatAxisKey(m.key)
              : monthAxisLabel(m.key, i, labelEvery)}
          </span>
        ))}
      </div>
    </div>
  );
};
