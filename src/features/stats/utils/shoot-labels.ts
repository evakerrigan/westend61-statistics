import type { Translate } from '@/lib/i18n';
import { type ShootStat, UNKNOWN_PARTNER } from './aggregate';

/** A shoot's name for display; «No shoot» is translated. */
export const shootTitle = (shoot: ShootStat, t: Translate) =>
  shoot.kind === 'unmatched' ? t('shoot.unmatched') : shoot.title;

/** A partner's name for display; sales without a partner show as «Other». */
export const partnerLabel = (partner: string, t: Translate) =>
  partner === UNKNOWN_PARTNER ? t('partner.other') : partner;

/** The second line under a shoot's name: its ID, kind or joined parts. */
export const shootSubtitle = (shoot: ShootStat, t: Translate) => {
  const base = baseSubtitle(shoot, t);
  const joined = shoot.mergedFrom.length;
  return joined ? `${base} · ${t('shoots.sub.joined', { n: joined })}` : base;
};

const baseSubtitle = (shoot: ShootStat, t: Translate) => {
  if (shoot.kind === 'unmatched') return t('shoots.sub.unmatched');
  if (shoot.kind === 'manual') return t('shoots.sub.manual');
  const number = `#${shoot.westendNumber}`;
  return shoot.westendState === 'WITHDRAWN'
    ? `${number} · ${t('shoots.sub.withdrawn')}`
    : number;
};
