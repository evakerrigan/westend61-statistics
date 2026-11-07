import type { Sale } from '@/types/westend';
import { monthsSince } from '@/utils/format';
import type { ShootStat } from './aggregate';

export type YearStat = {
  /** `YYYY` */
  year: string;
  shoots: ShootStat[];
  /** Average time on sale of the year's shoots, in whole months. */
  avgMonthsOnSale: number | null;
  /** Published images; only the sold ones are known for manual shoots. */
  photoCount: number;
  salesCount: number;
  revenue: number;
};

export type YearSalesLine = {
  /** Upload year; for a folded line, the newest of its years. */
  year: string;
  /** Older upload years joined into one line: «2018 and earlier». */
  folded: boolean;
  /** Photos in the line's shoots (see {@link YearStat.photoCount}). */
  photoCount: number;
  /** Sales per calendar year (see {@link YearSales.saleYears}); `null` before the line starts. */
  values: (number | null)[];
};

export type YearSales = {
  /** Every calendar year from the first upload or sale up to now. */
  saleYears: string[];
  /** Oldest upload year first. */
  lines: YearSalesLine[];
};

/** Lines with their own colour; older upload years fold into the first. */
export const MAX_YEAR_LINES = 8;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Shoots grouped by the year they were uploaded, newest year first. Sales
 * and revenue are each shoot's lifetime totals. Manual shoots have no upload
 * date and count from their first published image; «No shoot» is left out.
 */
export const buildYears = (shoots: ShootStat[]): YearStat[] => {
  const byYear = new Map<string, ShootStat[]>();
  for (const shoot of shoots) {
    const date = shoot.createdAt ?? shoot.publishedAt;
    if (shoot.kind === 'unmatched' || !date) continue;
    const year = date.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), shoot]);
  }

  return [...byYear]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, yearShoots]) => {
      const onSale = yearShoots.flatMap((s) =>
        s.publishedAt ? [Math.max(0, monthsSince(s.publishedAt))] : []
      );
      return {
        year,
        shoots: yearShoots,
        avgMonthsOnSale: onSale.length
          ? Math.round(onSale.reduce((sum, m) => sum + m, 0) / onSale.length)
          : null,
        photoCount: yearShoots.reduce(
          (sum, s) => sum + (s.publishedCount ?? s.photos.length),
          0
        ),
        salesCount: yearShoots.reduce((sum, s) => sum + s.salesCount, 0),
        revenue: round(yearShoots.reduce((sum, s) => sum + s.revenue, 0)),
      };
    });
};

/** What a sale adds to its year: one sale, or its amount. */
export const countSale = () => 1;
export const saleAmount = (sale: Sale) => sale.amount;

/**
 * How many sales (or how much money, with `measure` = {@link saleAmount}) the
 * shoots of each upload year made in every calendar year, to see how sales
 * fade as shoots get older.
 */
export const buildYearSales = (
  years: YearStat[],
  measure: (sale: Sale) => number = countSale,
  now = new Date()
): YearSales => {
  const oldestFirst = [...years].reverse();
  const foldCount = Math.max(0, oldestFirst.length - (MAX_YEAR_LINES - 1));
  const groups =
    foldCount > 1
      ? [
          oldestFirst.slice(0, foldCount),
          ...oldestFirst.slice(foldCount).map((y) => [y]),
        ]
      : oldestFirst.map((y) => [y]);

  const counted = groups.map((group) => {
    const bySaleYear = new Map<number, number>();
    for (const shoot of group.flatMap((y) => y.shoots)) {
      for (const sale of shoot.photos.flatMap((p) => p.sales)) {
        const year = Number(sale.date.slice(0, 4));
        bySaleYear.set(
          year,
          round((bySaleYear.get(year) ?? 0) + measure(sale))
        );
      }
    }
    // A sale can come before the upload year (joined shoots), so the line
    // starts at whichever is first.
    const start = Math.min(Number(group[0].year), ...bySaleYear.keys());
    return { group, bySaleYear, start };
  });

  const first = Math.min(...counted.map((c) => c.start));
  const saleYears: string[] = [];
  for (let y = first; y <= now.getFullYear(); y++) saleYears.push(String(y));

  return {
    saleYears,
    lines: counted.map(({ group, bySaleYear, start }) => ({
      year: group[group.length - 1].year,
      folded: group.length > 1,
      photoCount: group.reduce((sum, y) => sum + y.photoCount, 0),
      values: saleYears.map((y) =>
        Number(y) < start ? null : (bySaleYear.get(Number(y)) ?? 0)
      ),
    })),
  };
};

/**
 * The same sales per 100 photos of each upload year, so years with more or
 * fewer uploads compare fairly. A line without known photos stays empty.
 */
export const salesPerHundredPhotos = (sales: YearSales): YearSales => ({
  saleYears: sales.saleYears,
  lines: sales.lines.map((line) => ({
    ...line,
    values: line.values.map((v) =>
      v === null || !line.photoCount
        ? null
        : Math.round((v / line.photoCount) * 1000) / 10
    ),
  })),
});
