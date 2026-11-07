import { openWestendSession } from '@/lib/westend-client';
import type { Dataset, PortfolioItem, Product, Sale } from '@/types/westend';
import {
  type DashboardInfo,
  fetchDashboard,
  fetchImagesOnlineByDay,
  fetchPortfolioPage,
  fetchRevenuePage,
  PORTFOLIO_PAGE_SIZE,
  REVENUE_PAGE_SIZE,
  type RevenueQuery,
  type RevenueRow,
} from './api/westend-api';
import { collectShoots } from './collect-shoots';

export type SyncStep =
  | 'connect'
  | 'sales'
  | 'portfolio'
  | 'dates'
  | 'shootList'
  | 'shoots';

export type SyncProgress = {
  step: SyncStep;
  done: number;
  total: number;
};

type OnProgress = (progress: SyncProgress) => void;

// Safety limits, far above any real portfolio: stop instead of looping if
// the site ever ignores the page parameters.
const MAX_REVENUE_PAGES = 200;
const MAX_PORTFOLIO_PAGES = 100;
// Used when the dashboard shows no contract start.
const FALLBACK_START_YEAR = 2010;

const round = (n: number) => Math.round(n * 100) / 100;

/** Every license from the contract start until today, page by page. */
const fetchAllSales = async (
  session: Awaited<ReturnType<typeof openWestendSession>>,
  info: DashboardInfo,
  onProgress: OnProgress
) => {
  const now = new Date();
  const query: RevenueQuery = {
    providerUuid: info.providerUuid,
    from: {
      year: info.contractStart
        ? Number(info.contractStart.slice(0, 4))
        : FALLBACK_START_YEAR,
      month: 1,
    },
    to: { year: now.getFullYear(), month: now.getMonth() + 1 },
    page: 1,
    pageSize: REVENUE_PAGE_SIZE,
  };

  onProgress({ step: 'sales', done: 0, total: 1 });
  const first = await fetchRevenuePage(session, query);
  const rows: RevenueRow[] = [...first.rows];
  const pages = Math.min(first.pageCount, MAX_REVENUE_PAGES);
  for (let page = 2; page <= pages; page++) {
    onProgress({ step: 'sales', done: page - 1, total: pages });
    const next = await fetchRevenuePage(session, { ...query, page });
    if (!next.rows.length) break;
    rows.push(...next.rows);
  }
  return rows;
};

/** The whole portfolio (the photographer search behind “My portfolio”). */
const fetchPortfolio = async (
  session: Awaited<ReturnType<typeof openWestendSession>>,
  info: DashboardInfo,
  onProgress: OnProgress
) => {
  if (!info.portfolioUrl) return [];
  const byId = new Map<string, PortfolioItem>();
  let expected = info.imagesOnline ?? 0;
  for (let page = 1; page <= MAX_PORTFOLIO_PAGES; page++) {
    const pages = Math.max(page, Math.ceil(expected / PORTFOLIO_PAGE_SIZE));
    onProgress({ step: 'portfolio', done: page - 1, total: pages });
    const result = await fetchPortfolioPage(session, info.portfolioUrl, page);
    expected = result.total ?? expected;
    const before = byId.size;
    for (const item of result.items) byId.set(item.id, item);
    if (byId.size === before || (expected && byId.size >= expected)) break;
  }
  return [...byId.values()];
};

/** `EVKF00130` -> 130; images get increasing numbers as they go online. */
const imageNumber = (id: string) => Number(/(\d+)$/.exec(id)?.[1] ?? 0);

/**
 * Westend61 shows no upload date per image, only how many images went online
 * on each day. Image IDs grow in the same order, so the n-th image (by ID)
 * gets the date of the n-th image of that series. An estimate: images taken
 * offline later shift the dates a little.
 */
const estimateUploadDates = (
  portfolio: PortfolioItem[],
  days: { date: string; count: number }[]
): Map<string, string> => {
  const dates = days.flatMap((d) => Array<string>(d.count).fill(d.date));
  const sorted = [...portfolio].sort(
    (a, b) => imageNumber(a.id) - imageNumber(b.id)
  );
  const result = new Map<string, string>();
  sorted.forEach((item, i) => {
    const date = dates[Math.min(i, dates.length - 1)];
    if (date) result.set(item.id, date);
  });
  return result;
};

/**
 * Downloads sales, the portfolio and the submissions from Westend61.
 * Requests go one at a time with a pause between them to stay gentle on the
 * site. Sales and the portfolio are fetched every time (only a handful of
 * requests); a submission's images only when it is new or changed since
 * `previous`.
 */
export const collectDataset = async (
  onProgress: OnProgress,
  previous: Dataset | null
): Promise<Dataset> => {
  const data = await collectSalesAndPortfolio(onProgress);
  const { shoots, error } = await collectShoots(
    previous?.shoots ?? [],
    (step, done, total) => onProgress({ step, done, total })
  );
  return { ...data, shoots, shootsError: error };
};

const collectSalesAndPortfolio = async (
  onProgress: OnProgress
): Promise<Omit<Dataset, 'shoots' | 'shootsError'>> => {
  onProgress({ step: 'connect', done: 0, total: 1 });
  const session = await openWestendSession();

  try {
    const info = await fetchDashboard(session);
    const rows = await fetchAllSales(session, info, onProgress);
    const portfolio = await fetchPortfolio(session, info, onProgress);

    onProgress({ step: 'dates', done: 0, total: 1 });
    const days = await fetchImagesOnlineByDay(session, info);
    const uploadDates = days
      ? estimateUploadDates(portfolio, days)
      : new Map<string, string>();
    for (const item of portfolio) {
      item.createdAt = uploadDates.get(item.id) ?? null;
    }

    const products = new Map<string, Product>();
    const otherSales: Sale[] = [];
    for (const row of rows) {
      const sale: Sale = {
        date: row.date,
        amount: row.amount,
        partner: row.partner,
      };
      if (!row.productId) {
        otherSales.push(sale);
        continue;
      }
      const product = products.get(row.productId) ?? {
        id: row.productId,
        headline: row.headline,
        createdAt: uploadDates.get(row.productId) ?? null,
        thumbUrl: row.thumbUrl,
        url: row.url,
        sales: [],
      };
      product.sales.push(sale);
      products.set(row.productId, product);
    }

    const collected = round(rows.reduce((sum, r) => sum + r.amount, 0));
    return {
      syncedAt: new Date().toISOString(),
      westendTotal: info.imageRevenue ?? collected,
      portfolioSize: info.imagesOnline ?? portfolio.length,
      portfolio,
      products: [...products.values()],
      otherSales,
    };
  } finally {
    await session.close();
  }
};
