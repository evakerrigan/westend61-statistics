import {
  WestendAuthError,
  WestendFormatError,
  type WestendSession,
} from '@/lib/westend-client';
import type { PortfolioItem, Sale } from '@/types/westend';

// Pages and queries mirror what westend61.de itself loads in the photographer
// area. Everything is requested in English so dates and amounts parse.
const DASHBOARD_URL = '/photographers/dashboard?lang=en';
const DASHBOARD_QUERY_URL = '/photographers/dashboard/query';
const REVENUE_URL = '/photographers/revenue/index';

/** Licenses per page of “My Earnings”; Westend61 may cap it lower. */
export const REVENUE_PAGE_SIZE = 100;
/** Images per page of the portfolio search (the largest the site offers). */
export const PORTFOLIO_PAGE_SIZE = 200;

// --- Parsing helpers ----------------------------------------------------------

const SHOW_TEXT = 4; // NodeFilter.SHOW_TEXT

/** The visible text of a page as trimmed pieces, in document order. */
const textTokens = (doc: Document): string[] => {
  const tokens: string[] = [];
  const walker = doc.createTreeWalker(doc.body, SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('script, style, noscript, select')) {
      continue;
    }
    const text = node.textContent?.replace(/\s+/g, ' ').trim();
    if (text) tokens.push(text);
  }
  return tokens;
};

/** The piece of text right after a label, e.g. the value of a table row. */
const tokenAfter = (tokens: string[], label: string): string | null => {
  const wanted = label.toLowerCase();
  const i = tokens.findIndex((t) => t.toLowerCase() === wanted);
  return i >= 0 && i + 1 < tokens.length ? tokens[i + 1] : null;
};

/** `€1,234.56` -> `1234.56`; `1.234,56 €` is understood too. */
export const parseMoney = (text: string | null | undefined): number | null => {
  if (!text) return null;
  let s = text.replace(/[^\d.,-]/g, '');
  if (!/\d/.test(s)) return null;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastComma > lastDot && s.length - lastComma - 1 <= 2) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};

const parseCount = (text: string | null | undefined): number | null => {
  const digits = text?.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

// Month names by number, in the languages Westend61 offers.
const MONTHS: string[][] = [
  ['january', 'januar', 'jänner', 'enero'],
  ['february', 'februar', 'febrero'],
  ['march', 'märz', 'marz', 'marzo'],
  ['april', 'abril'],
  ['may', 'mai', 'mayo'],
  ['june', 'juni', 'junio'],
  ['july', 'juli', 'julio'],
  ['august', 'agosto'],
  ['september', 'septiembre', 'setiembre'],
  ['october', 'oktober', 'octubre'],
  ['november', 'noviembre'],
  ['december', 'dezember', 'diciembre'],
];

/** `Nov`, `November`, `Dezember` -> 1-based month, or 0. */
const monthNumber = (name: string) => {
  const n = name.toLowerCase().replace(/\.$/, '');
  if (n.length < 3) return 0;
  return MONTHS.findIndex((names) => names.some((m) => m.startsWith(n))) + 1;
};

const isoDate = (year: number, month: number, day: number) => {
  const y = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * A date as Westend61 prints it -> `YYYY-MM-DD`. Pages are requested in
 * English (`November 4, 2026`), but other forms are understood too:
 * `4. November 2026`, `4 de noviembre de 2026`, `2026-11-04`, `04.11.2026`,
 * `11/4/26`.
 */
export const parseEnglishDate = (
  text: string | null | undefined
): string | null => {
  const s = text?.replace(/\s+/g, ' ').trim() ?? '';
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return isoDate(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/.exec(s);
  if (m) return isoDate(+m[3], +m[2], +m[1]);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (m) return isoDate(+m[3], +m[1], +m[2]);
  // `November 4, 2026` / `Nov. 4 2026`
  m = /^(\p{L}+)\.? (\d{1,2}),? (\d{4})$/u.exec(s);
  if (m && monthNumber(m[1])) return isoDate(+m[3], monthNumber(m[1]), +m[2]);
  // `4. November 2026` / `4 de noviembre de 2026`
  m = /^(\d{1,2})\.? (?:de )?(\p{L}+\.?) (?:de )?(\d{4})$/u.exec(s);
  if (m && monthNumber(m[2])) return isoDate(+m[3], monthNumber(m[2]), +m[1]);
  return null;
};

/** `…/0002135438l/some-title-EVKF00228.jpg` -> `…/0002135438c/w61-thumbnail.jpg` */
const toThumbUrl = (src: string) =>
  src.replace(/\/(\d+)[a-z]\/[^/]+\.jpg$/i, '/$1c/w61-thumbnail.jpg');

const imageSrc = (img: Element | null) => {
  if (!img) return '';
  const candidates = ['src', 'data-src', 'data-original', 'data-lazy'].map(
    (name) => img.getAttribute(name) ?? ''
  );
  return candidates.find((src) => /^https?:\/\//.test(src)) ?? '';
};

const absolute = (href: string) =>
  new URL(href, 'https://www.westend61.de').toString();

// --- Dashboard ----------------------------------------------------------------

export type DashboardInfo = {
  /** Chart session of the photographer area, needed by its JSON queries. */
  sessionId: string | null;
  providerUuid: string;
  /** Lifetime earnings with images. */
  imageRevenue: number | null;
  imagesOnline: number | null;
  /** ISO date. */
  contractStart: string | null;
  /** The “My portfolio” link: a search for all of the photographer's images. */
  portfolioUrl: string | null;
};

export const parseDashboard = (doc: Document): DashboardInfo => {
  const html = doc.documentElement.innerHTML;
  const providerUuid = /providerUuid:\s*'([^']+)'/.exec(html)?.[1];
  // Without the chart settings the page is not the photographer dashboard:
  // the user is not logged in (or not as a photographer).
  if (!providerUuid) throw new WestendAuthError();
  const sessionId = /session:\s*'([^']+)'/.exec(html)?.[1] ?? null;

  const tokens = textTokens(doc);
  const portfolioLink = [...doc.querySelectorAll('a[href]')].find(
    (a) => a.textContent?.trim().toLowerCase() === 'my portfolio'
  );

  return {
    sessionId,
    providerUuid,
    imageRevenue:
      parseMoney(tokenAfter(tokens, 'with images')) ??
      parseMoney(tokenAfter(tokens, 'Revenue All-Time')),
    imagesOnline: parseCount(tokenAfter(tokens, 'images online')),
    contractStart:
      parseEnglishDate(tokenAfter(tokens, 'Contract Start')) ??
      parseEnglishDate(tokenAfter(tokens, 'First Upload')),
    portfolioUrl: portfolioLink
      ? absolute(portfolioLink.getAttribute('href')!)
      : null,
  };
};

export const fetchDashboard = async (session: WestendSession) =>
  parseDashboard(await session.getPage(DASHBOARD_URL));

type ChartResponse = {
  results?: Record<string, Record<string, number | null>>;
};

/**
 * How many images went online on each day, as on the dashboard chart
 * “My Images online”. `null` when the site does not answer in that form.
 */
export const fetchImagesOnlineByDay = async (
  session: WestendSession,
  info: DashboardInfo
): Promise<{ date: string; count: number }[] | null> => {
  const params = new URLSearchParams({
    q: 'imagesOnline',
    providerUuid: info.providerUuid,
    group: 'DAY',
  });
  if (info.sessionId) params.set('sessionId', info.sessionId);
  try {
    const data = await session.getJson<ChartResponse>(
      `${DASHBOARD_QUERY_URL}?${params}`
    );
    const series = Object.values(data.results ?? {})[0] ?? {};
    const days = Object.entries(series)
      .filter(([date, count]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && count)
      .map(([date, count]) => ({ date, count: count ?? 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return days.length ? days : null;
  } catch {
    // Upload dates are a nice-to-have: the sales and portfolio already
    // loaded, so a chart query that fails must not fail the whole update.
    return null;
  }
};

// --- My Earnings ---------------------------------------------------------------

export type RevenueRow = Sale & {
  /** Westend61 image ID, e.g. `EVKF00130`; `null` for a sale without image. */
  productId: string | null;
  headline: string;
  thumbUrl: string;
  url: string;
};

export type RevenuePage = {
  /** Total of the selected period, as shown above the list. */
  total: number | null;
  /** Licenses in the selected period (all pages). */
  licenses: number | null;
  pageCount: number;
  rows: RevenueRow[];
};

export type RevenueQuery = {
  providerUuid: string;
  from: { year: number; month: number };
  to: { year: number; month: number };
  page: number;
  pageSize: number;
};

/** Same parameters as the page's own “Export” link. */
export const revenueUrl = (q: RevenueQuery) => {
  const params = new URLSearchParams({
    providerUuid: q.providerUuid,
    _typeImages: '',
    typeImages: 'on',
    _typeVideos: '',
    inputRangeStartMonth: String(q.from.month),
    inputRangeStartYear: String(q.from.year),
    inputRangeEndMonth: String(q.to.month),
    inputRangeEndYear: String(q.to.year),
    inputGranularity: 'MONTH',
    agency: 'all',
    sortBy: 'newest',
    m: String(q.pageSize),
    o: String((q.page - 1) * q.pageSize),
    page: String(q.page),
    lang: 'en',
  });
  return `${REVENUE_URL}?${params}`;
};

export const parseRevenuePage = (doc: Document): RevenuePage => {
  const form = doc.querySelector('#revenueForm');
  if (!form) throw new WestendAuthError();

  const items = [...form.querySelectorAll('.asset-list .gallery_item')].filter(
    // Only sale rows: they carry an amount or an invoice date.
    (item) => item.querySelector('.info_teaser, .invoiceDate')
  );
  const rows = items.map((item): RevenueRow => {
    const link = item.querySelector('a[href]');
    const href = link?.getAttribute('href') ?? '';
    const productId =
      /\/(?:imageView|photo)\/([A-Za-z0-9_-]+)/.exec(href)?.[1] ?? null;
    const amountText = item.querySelector('.info_teaser')?.textContent;
    const dateText = item.querySelector('.invoiceDate')?.textContent?.trim();
    const amount = parseMoney(amountText);
    const date = parseEnglishDate(dateText);
    const where = productId ?? 'sale without image';
    if (amount === null) {
      throw new WestendFormatError(
        `amount ${JSON.stringify(amountText?.trim() ?? null)} (${where})`
      );
    }
    if (!date) {
      throw new WestendFormatError(
        `date ${JSON.stringify(dateText ?? null)} (${where})`
      );
    }
    return {
      productId,
      headline:
        item.querySelector('.img_cont')?.getAttribute('title')?.trim() ?? '',
      thumbUrl: imageSrc(item.querySelector('img')),
      url: href ? absolute(href) : '',
      amount,
      date,
      partner: item.querySelector('.clientName')?.textContent?.trim() || null,
    };
  });

  const licensesToken = textTokens(doc).find((t) =>
    /^[\d,.]+ licen[cs]es?$/i.test(t)
  );
  return {
    total: parseMoney(form.querySelector('.total .large')?.textContent),
    licenses: parseCount(licensesToken),
    pageCount: parseCount(form.querySelector('.pageCount')?.textContent) ?? 1,
    rows,
  };
};

export const fetchRevenuePage = async (
  session: WestendSession,
  query: RevenueQuery
) => parseRevenuePage(await session.getPage(revenueUrl(query)));

// --- Portfolio ------------------------------------------------------------------

export type PortfolioPage = {
  /** All images of the search, as in its heading. */
  total: number | null;
  items: PortfolioItem[];
};

export const parsePortfolioPage = (doc: Document): PortfolioPage => {
  const heading = doc.querySelector('#search_result_msg h1')?.textContent;
  const items = [
    ...doc.querySelectorAll('#searchGallery .search_item[data-assetid]'),
  ].map((item): PortfolioItem => {
    const id = item.getAttribute('data-assetid')!;
    const img = item.querySelector('img');
    const title = img?.getAttribute('title') ?? img?.getAttribute('alt') ?? '';
    const src = imageSrc(img);
    return {
      id,
      headline: title.replace(new RegExp(`\\s*-\\s*${id}$`), '').trim(),
      createdAt: null,
      thumbUrl: src ? toThumbUrl(src) : '',
    };
  });
  return {
    total: parseCount(/([\d,.]+)/.exec(heading ?? '')?.[1]),
    items,
  };
};

export const portfolioPageUrl = (portfolioUrl: string, page: number) => {
  const url = new URL(portfolioUrl);
  url.searchParams.set('mode', 'grid');
  url.searchParams.set('m', String(PORTFOLIO_PAGE_SIZE));
  url.searchParams.set('o', String((page - 1) * PORTFOLIO_PAGE_SIZE));
  return url.pathname + url.search;
};

export const fetchPortfolioPage = async (
  session: WestendSession,
  portfolioUrl: string,
  page: number
) =>
  parsePortfolioPage(
    await session.getPage(portfolioPageUrl(portfolioUrl, page))
  );
