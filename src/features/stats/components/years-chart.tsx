import { useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import type { YearSales, YearSalesLine } from '../utils/years';
import { niceTicks } from '../utils/chart-ticks';
import chartStyles from './months-view.module.scss';
import styles from './years-chart.module.scss';

const lineColor = (index: number) => `var(--color-series-${index + 1})`;

type YearsChartProps = {
  sales: YearSales;
  /** Values are whole counts: use whole-number ticks. */
  integer?: boolean;
  formatValue?: (value: number) => string;
  /** Axis ticks; the same as values by default. */
  formatTick?: (value: number) => string;
  /** Explanation under the chart. */
  note: string;
  /** Upload years switched off in the legend. */
  hiddenYears: string[];
  onToggleYear: (year: string) => void;
};

/**
 * One line per upload year: how many sales its shoots made in each calendar
 * year. The current year isn't over yet, so its segment is dashed.
 */
export const YearsChart = ({
  sales,
  integer = false,
  formatValue = String,
  formatTick = formatValue,
  note,
  hiddenYears,
  onToggleYear,
}: YearsChartProps) => {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const hidden = new Set(hiddenYears);

  const { saleYears, lines } = sales;
  const n = saleYears.length;
  // Colour follows the line's place among all lines, so hiding one
  // doesn't repaint the rest.
  const shown = lines
    .map((line, index) => ({ line, color: lineColor(index) }))
    .filter(({ line }) => !hidden.has(line.year));

  const ticks = niceTicks(
    Math.max(0, ...shown.flatMap(({ line }) => line.values.map((v) => v ?? 0))),
    integer
  );
  const axisMax = ticks[ticks.length - 1] || 1;
  const y = (value: number) => 100 - (value / axisMax) * 100;
  const point = (i: number, value: number) => `${i + 0.5},${y(value)}`;

  const label = (line: YearSalesLine) =>
    line.folded ? t('years.chart.earlier', { year: line.year }) : line.year;
  const firstIndex = (line: YearSalesLine) =>
    line.values.findIndex((v) => v !== null);

  const dimmed = (line: YearSalesLine) =>
    focused !== null && focused !== line.year ? styles.dimmed : '';

  return (
    <div className={chartStyles.chart}>
      <div className={chartStyles.legend}>
        {lines.map((line, index) => (
          <button
            key={line.year}
            type="button"
            className={`${chartStyles.legend__item} ${styles.legendButton} ${hidden.has(line.year) ? styles.legendOff : ''}`}
            aria-pressed={!hidden.has(line.year)}
            onClick={() => onToggleYear(line.year)}
            onMouseEnter={() => setFocused(line.year)}
            onMouseLeave={() => setFocused(null)}
          >
            <span
              className={chartStyles.legend__swatch}
              style={{ background: lineColor(index) }}
            />
            {label(line)}
          </button>
        ))}
      </div>

      <div className={chartStyles.plot}>
        {ticks.map((tick) => (
          <div
            key={tick}
            className={chartStyles.gridline}
            style={{ bottom: `${(tick / axisMax) * 100}%` }}
          >
            <span className={chartStyles.tick}>{formatTick(tick)}</span>
          </div>
        ))}

        <svg
          className={styles.lines}
          viewBox={`0 0 ${n} 100`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {shown.map(({ line, color }) => {
            const points = line.values.flatMap((v, i) =>
              v === null ? [] : [{ i, v }]
            );
            const complete = points.filter((p) => p.i < n - 1);
            const [before, current] = points.slice(-2);
            return (
              <g
                key={line.year}
                className={dimmed(line)}
                style={{ stroke: color }}
              >
                {complete.length > 1 && (
                  <path
                    className={styles.line}
                    d={`M${complete.map((p) => point(p.i, p.v)).join(' L')}`}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {current?.i === n - 1 && before && (
                  <path
                    className={`${styles.line} ${styles.lineDashed}`}
                    d={`M${point(before.i, before.v)} L${point(current.i, current.v)}`}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Dots: where each line starts and ends, and at the hovered year. */}
        {shown.flatMap(({ line, color }) =>
          line.values.flatMap((v, i) =>
            v === null ||
            (i !== firstIndex(line) && i !== n - 1 && i !== hovered)
              ? []
              : [
                  <span
                    key={`${line.year}:${i}`}
                    className={`${styles.dot} ${dimmed(line)}`}
                    style={{
                      left: `${((i + 0.5) / n) * 100}%`,
                      bottom: `${(v / axisMax) * 100}%`,
                      background: color,
                    }}
                  />,
                ]
          )
        )}

        {/* Each line starts in its own year, so its name goes above its
            first point: the labels don't run into each other there. */}
        {shown.map(({ line }) => {
          const i = firstIndex(line);
          if (i < 0) return null;
          return (
            <span
              key={line.year}
              className={`${styles.startLabel} ${dimmed(line)}`}
              style={{
                left: `${((i + 0.5) / n) * 100}%`,
                bottom: `${((line.values[i] ?? 0) / axisMax) * 100}%`,
              }}
              aria-hidden="true"
            >
              {label(line)}
            </span>
          );
        })}

        <div className={styles.columns}>
          {saleYears.map((year, i) => (
            <div
              key={year}
              className={styles.slot}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <>
                  <div className={styles.crosshair} />
                  <div
                    className={`${chartStyles.tooltip} ${styles.tooltip} ${i >= n / 2 ? styles.tooltipLeft : ''}`}
                    role="tooltip"
                  >
                    <strong>{year}</strong>
                    {i === n - 1 && (
                      <div className={chartStyles.tooltipMuted}>
                        {t('years.chart.partial')}
                      </div>
                    )}
                    {shown
                      .filter(({ line }) => line.values[i] !== null)
                      .map(({ line, color }) => (
                        <div key={line.year} className={styles.tooltipRow}>
                          <span
                            className={styles.tooltipSwatch}
                            style={{ background: color }}
                          />
                          <span className={chartStyles.tooltipMuted}>
                            {label(line)}
                          </span>
                          <span className={styles.tooltipValue}>
                            {formatValue(line.values[i]!)}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={chartStyles.labels}>
        {saleYears.map((year) => (
          <span key={year} className={chartStyles.label}>
            {year}
          </span>
        ))}
      </div>

      <p className={styles.note}>{note}</p>
    </div>
  );
};
