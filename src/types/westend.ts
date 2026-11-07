// Data collected from Westend61 and kept in extension storage.
// Only the fields the statistics need are kept; the pages are parsed in
// `features/sync/api`.

export type Sale = {
  /** ISO date, e.g. `2026-08-15`. */
  date: string;
  amount: number;
  /** Partner agency (Getty Images, Adobe Stock, …); `null` when unknown. */
  partner: string | null;
};

/** An image on Westend61 with its sales. IDs look like `EVKF00130`. */
export type Product = {
  id: string;
  headline: string;
  /**
   * ISO date the image went online, estimated from the dashboard's “images
   * online” series; `null` when unknown (e.g. the image was taken offline).
   */
  createdAt: string | null;
  thumbUrl: string;
  url: string;
  sales: Sale[];
};

/** An image in the portfolio (the photographer search on westend61.de). */
export type PortfolioItem = {
  id: string;
  headline: string;
  /** See {@link Product.createdAt}. */
  createdAt: string | null;
  thumbUrl: string;
};

/** A published image inside a shoot. */
export type ShootPhoto = {
  id: string;
  headline: string | null;
  publishedAt: string | null;
  thumbUrl: string | null;
};

/** Westend61's two submission systems number their submissions separately. */
export type SubmissionSystem = 'old' | 'new';

/** A submission on Westend61. One submission is one shoot. */
export type Shoot = {
  /** Unique across both systems, e.g. `old:58251` or `new:2880`. */
  id: string;
  system: SubmissionSystem;
  /** The submission number as Westend61 shows it. */
  number: number;
  title: string;
  /** Westend61's processing state, e.g. `DONE` or `WITHDRAWN`. */
  state: string | null;
  /** Accepted images, as in the submission list. */
  acceptedCount: number;
  /** “Last Updated” in the submission list, `YYYY-MM-DD`. */
  updatedAt?: string | null;
  /** IDs of the accepted images (only they get a Westend61 image ID). */
  photoIds: string[];
};

/**
 * A shoot the user put together by hand. Kept separately from the synced
 * data so re-syncing never touches it.
 */
export type ManualShoot = {
  id: string;
  title: string;
  productIds: string[];
  createdAt: string;
};

/**
 * Shoots the user joined together, as source key -> target key. Used when one
 * photo session was uploaded to Westend61 in several parts.
 */
export type ShootMerges = Record<string, string>;

/**
 * Years the user switched off in the charts of the “By upload year” tab, as
 * chart ID -> upload years.
 */
export type HiddenChartYears = Record<string, string[]>;

export type Dataset = {
  /** ISO timestamp of the last successful sync. */
  syncedAt: string;
  /** Lifetime image earnings as shown on the dashboard, to check completeness. */
  westendTotal: number;
  /** Images online, as on the dashboard. */
  portfolioSize: number;
  /** Every image in the portfolio. */
  portfolio: PortfolioItem[];
  /** Submissions with accepted images, from both submission systems. */
  shoots: Shoot[];
  /**
   * Why the submissions could not be loaded this time (then `shoots` are the
   * ones from the previous update); `null` when they loaded fine.
   */
  shootsError?: 'auth' | 'other' | null;
  /** Every image that sold, with its sales. */
  products: Product[];
  /** Sales Westend61 lists without an image. */
  otherSales: Sale[];
};
