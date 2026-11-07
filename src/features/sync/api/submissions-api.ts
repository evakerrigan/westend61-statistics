import {
  WestendAuthError,
  WestendFormatError,
  type WestendSession,
} from '@/lib/westend-client';
import type { SubmissionSystem } from '@/types/westend';

// Pages of the two submission systems: the old one (“Previous Submissions”,
// ingestion.westend61.de) and the current one (ingestionneo.westend61.de).
// Both list the submissions in a table and show each submission's images,
// the accepted ones with their Westend61 image ID.

/** Submissions per list page; the site may cap it lower. */
export const SUBMISSION_LIST_PAGE_SIZE = 100;

export const submissionStartPath: Record<SubmissionSystem, string> = {
  old: '/ingestion/mySubmissions/index',
  new: '/mySubmissions/listAll',
};

export const submissionListPath = (
  system: SubmissionSystem,
  offset: number
) => {
  const params = new URLSearchParams({
    max: String(SUBMISSION_LIST_PAGE_SIZE),
    offset: String(offset),
  });
  return `${submissionStartPath[system]}?${params}`;
};

export const submissionPath = (system: SubmissionSystem, number: number) =>
  system === 'old'
    ? `/ingestion/mySubmissions/show/${number}`
    : `/mySubmissions/show/${number}`;

export type SubmissionSummary = {
  system: SubmissionSystem;
  number: number;
  title: string;
  /** E.g. `DONE`, `WITHDRAWN`, `EDITING`. */
  state: string | null;
  acceptedCount: number;
  /** “Last Updated”, `YYYY-MM-DD`. */
  updatedAt: string | null;
};

export type SubmissionListPage = {
  /** All submissions in the list (all pages); `null` when not shown. */
  total: number | null;
  submissions: SubmissionSummary[];
};

const SHOW_LINK = /\/mySubmissions\/show\/(\d+)/;

const count = (text: string | null | undefined) => {
  const digits = text?.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

/** The submission's name: the edit link whose text is not its number. */
const rowTitle = (row: Element) => {
  const named = row.querySelector('.submission-name')?.textContent?.trim();
  if (named) return named;
  for (const link of row.querySelectorAll('a[href*="/mySubmissions/edit/"]')) {
    const text = link.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text && !/^#?[\d,.\s]+$/.test(text) && !link.querySelector('img')) {
      return text;
    }
  }
  return '';
};

const isoDate = (year: number, month: number, day: number) => {
  const y = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * A list date -> `YYYY-MM-DD`: `8/8/25 11:20 PM`, `10/22/26, 10:30 PM`
 * (English), `18.01.26 11:59` (German) or `2026-01-18`.
 */
export const parseListDate = (text: string) => {
  const s = text.replace(/\s+/g, ' ').trim();
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?![\d/])/.exec(s);
  if (m) return isoDate(+m[3], +m[1], +m[2]);
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?![\d.])/.exec(s);
  if (m) return isoDate(+m[3], +m[2], +m[1]);
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return isoDate(+m[1], +m[2], +m[3]);
  return null;
};

/**
 * “Last Updated”: the cell holding a date — in its tooltip (also where
 * Bootstrap moves it) or as its text. Rows show no other dates.
 */
const rowUpdatedAt = (row: Element) => {
  for (const cell of row.querySelectorAll('td')) {
    const candidates = [
      cell.getAttribute('title'),
      cell.getAttribute('data-bs-original-title'),
      cell.getAttribute('data-original-title'),
      cell.textContent,
    ];
    for (const text of candidates) {
      const date = text ? parseListDate(text) : null;
      if (date) return date;
    }
  }
  return null;
};

const rowState = (row: Element) => {
  const el = row.querySelector('[class*="submission-state-"]');
  return /submission-state-([A-Z_]+)/.exec(el?.className ?? '')?.[1] ?? null;
};

export const parseSubmissionList = (
  doc: Document,
  system: SubmissionSystem
): SubmissionListPage => {
  // Not a submission page at all: usually a login page.
  if (!doc.querySelector('a[href*="/mySubmissions/"]')) {
    throw new WestendAuthError();
  }
  const seen = new Set<number>();
  const submissions: SubmissionSummary[] = [];
  for (const row of doc.querySelectorAll('tr')) {
    const link = row.querySelector('a[href*="/mySubmissions/show/"]');
    const number = Number(
      SHOW_LINK.exec(link?.getAttribute('href') ?? '')?.[1]
    );
    if (!number || seen.has(number)) continue;
    seen.add(number);
    submissions.push({
      system,
      number,
      title: rowTitle(row) || `#${number}`,
      state: rowState(row),
      updatedAt: rowUpdatedAt(row),
      acceptedCount:
        count(row.querySelector('.assetsAccepted')?.textContent) ?? 0,
    });
  }

  // “Total: 24” (old system) or “Showing submissions 1 to 6 of 6” (new).
  const text = doc.body.textContent?.replace(/\s+/g, ' ') ?? '';
  const total =
    count(/Total:\s*([\d,.]+)/i.exec(text)?.[1]) ??
    count(
      /Showing submissions [\d,.]+ to [\d,.]+ of ([\d,.]+)/i.exec(text)?.[1]
    );
  return { total, submissions };
};

/** Westend61 image IDs look like `EVKF00231`: letters, then five digits. */
const IMAGE_ID = /\b([A-Z]{3,5}\d{5,6})\b/g;

/** The Westend61 IDs of a submission's accepted images, in page order. */
export const parseSubmissionPhotos = (doc: Document): string[] => {
  const list = doc.querySelector('#asset-list');
  if (!list) {
    if (!doc.querySelector('a[href*="/mySubmissions/"]')) {
      throw new WestendAuthError();
    }
    throw new WestendFormatError('submission page without images');
  }
  const ids = new Set<string>();
  for (const asset of list.querySelectorAll('.js-asset')) {
    // The ID is the caption of an accepted image (rejected ones show their
    // file name instead); the old system also has it in the preview link.
    const sources = [
      asset.textContent ?? '',
      ...[...asset.querySelectorAll('a[href]')].map(
        (a) => a.getAttribute('href') ?? ''
      ),
    ];
    for (const source of sources) {
      for (const m of source.matchAll(IMAGE_ID)) ids.add(m[1]);
    }
  }
  return [...ids];
};

export const fetchSubmissionList = async (
  session: WestendSession,
  system: SubmissionSystem
): Promise<SubmissionSummary[]> => {
  const all = new Map<number, SubmissionSummary>();
  for (let offset = 0; ; ) {
    const page = parseSubmissionList(
      await session.getPage(submissionListPath(system, offset)),
      system
    );
    const before = all.size;
    for (const s of page.submissions) all.set(s.number, s);
    offset += page.submissions.length;
    const done =
      all.size === before ||
      page.total === null ||
      all.size >= page.total ||
      offset > 10_000;
    if (done) break;
  }
  return [...all.values()];
};

export const fetchSubmissionPhotos = async (
  session: WestendSession,
  system: SubmissionSystem,
  number: number
) =>
  parseSubmissionPhotos(await session.getPage(submissionPath(system, number)));
