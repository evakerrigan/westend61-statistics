/** Sort key of a partner's column. */
export const partnerSortKey = (partner: string) => `partner:${partner}`;

/** Number of table columns the partner columns take up. */
export const partnerColumnCount = (partners: string[], compact: boolean) =>
  compact ? Math.min(1, partners.length) : partners.length;

/** Partner columns that still fit a 1600px screen with the usual padding. */
const ROOMY_PARTNER_LIMIT = 10;

/**
 * Whether the table needs tighter cells: past the limit the partner columns
 * alone push it wider than the screen.
 */
export const isDensePartnerTable = (partners: string[], compact: boolean) =>
  partnerColumnCount(partners, compact) > ROOMY_PARTNER_LIMIT;
