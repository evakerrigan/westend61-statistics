import { getActiveLanguage } from '@/lib/i18n';

// Formatting follows the interface language (see `lib/i18n`).

const moneyFormats = {
  en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }),
  ru: new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR' }),
};

/** `1232.68` -> `€1,232.68` / `1 232,68 €` */
export const formatMoney = (value: number) =>
  moneyFormats[getActiveLanguage()].format(value);

const wholeMoneyFormats = {
  en: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }),
  ru: new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }),
};

/** Whole euros, for chart axes: `€1,233` / `1 233 €` */
export const formatMoneyShort = (value: number) =>
  wholeMoneyFormats[getActiveLanguage()].format(value);

const decimalFormats = {
  en: new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }),
  ru: new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }),
};

/** `12.5` -> `12.5` / `12,5`; at most one decimal. */
export const formatDecimal = (value: number) =>
  decimalFormats[getActiveLanguage()].format(value);

const percentFormats = {
  en: new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }),
  ru: new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    maximumFractionDigits: 1,
  }),
};

/** A share from 0 to 1: `0.6` -> `60%` / `60 %`; at most one decimal. */
export const formatPercent = (share: number) =>
  percentFormats[getActiveLanguage()].format(share);

/** `2026-08-15` or a full ISO timestamp -> `08/15/2026` / `15.08.2026` */
export const formatDate = (value: string | null) => {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return getActiveLanguage() === 'ru' ? `${d}.${m}.${y}` : `${m}/${d}/${y}`;
};

/** A timestamp's local time: `7:53 PM` / `19:53` */
export const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString(
    getActiveLanguage() === 'ru' ? 'ru-RU' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

const MONTHS_SHORT = {
  en: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  ru: [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ],
};

/** `2026-08` -> `Aug` / `авг` */
export const formatMonthShort = (key: string) =>
  MONTHS_SHORT[getActiveLanguage()][Number(key.split('-')[1]) - 1];

/** `2026-08` -> `Aug 2026` / `авг 2026` */
export const formatMonth = (key: string) =>
  `${formatMonthShort(key)} ${key.split('-')[0]}`;

const pluralRu = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

/** Whole months from a date (`2026-08-15` or a full ISO timestamp) to `to`. */
export const monthsSince = (from: string, to = new Date()) => {
  const [y, m, d] = from.slice(0, 10).split('-').map(Number);
  const months = (to.getFullYear() - y) * 12 + (to.getMonth() + 1 - m);
  return to.getDate() < d ? months - 1 : months;
};

/**
 * Time since a date in whole months: `3 yr 5 mo` / `3 года 5 мес`,
 * `1 yr` / `1 год`, `7 mo` / `7 мес`.
 */
export const formatDuration = (from: string | null, to = new Date()) =>
  from ? formatMonths(monthsSince(from, to)) : '—';

/** A number of months: `3 yr 5 mo` / `3 года 5 мес`. */
export const formatMonths = (months: number) => {
  const ru = getActiveLanguage() === 'ru';
  if (months < 1) return ru ? 'меньше месяца' : 'less than a month';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years
      ? ru
        ? `${years} ${pluralRu(years, 'год', 'года', 'лет')}`
        : `${years} yr`
      : '',
    rest ? (ru ? `${rest} мес` : `${rest} mo`) : '',
  ]
    .filter(Boolean)
    .join(' ');
};
