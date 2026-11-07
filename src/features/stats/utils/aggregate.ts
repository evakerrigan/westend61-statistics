import type {
  Dataset,
  ManualShoot,
  PortfolioItem,
  Product,
  Sale,
  ShootMerges,
  ShootPhoto,
} from '@/types/westend';

export type PartnerTotals = Record<string, number>;

export type PhotoStat = {
  product: Product;
  /** {@link ShootStat.key} of the shoot this image belongs to. */
  shootKey: string | null;
  sales: Sale[];
  revenue: number;
  lastSale: string | null;
  byPartner: PartnerTotals;
};

/**
 * - `westend`: a submission synced from Westend61
 * - `manual`: a shoot the user created by hand
 * - `unmatched`: images that belong to no shoot yet
 */
export type ShootKind = 'westend' | 'manual' | 'unmatched';

export type ShootStat = {
  key: string;
  kind: ShootKind;
  /** Submission number as Westend61 shows it (`westend` only). */
  westendNumber: number | null;
  /** Westend61's processing state, e.g. `WITHDRAWN` (`westend` only). */
  westendState: string | null;
  /** {@link ManualShoot.id} (`manual` only). */
  manualId: string | null;
  title: string;
  /** Westend61 shows no creation date: always `null` for now. */
  createdAt: string | null;
  /** “Last Updated” of the submission (`westend` only). */
  updatedAt: string | null;
  /**
   * Creation order of the submission (`westend` only): numbers grow as
   * submissions are created, and the new system's come after the old one's.
   */
  order: number | null;
  /**
   * When the shoot went on sale: the earliest (estimated) go-live date of
   * its images.
   */
  publishedAt: string | null;
  /** Images of the shoot; unknown without the portfolio for own shoots. */
  publishedCount: number | null;
  thumbUrl: string | null;
  /** Images with at least one sale. */
  photos: PhotoStat[];
  /** Images with no sales. */
  unsoldPhotos: ShootPhoto[];
  salesCount: number;
  revenue: number;
  revenuePerPhoto: number | null;
  lastSale: string | null;
  byPartner: PartnerTotals;
  /** Shoots the user joined into this one. */
  mergedFrom: { key: string; title: string }[];
};

export type MonthStat = {
  /** `YYYY-MM` */
  key: string;
  revenue: number;
  salesCount: number;
  byPartner: PartnerTotals;
};

export type Stats = {
  revenue: number;
  salesCount: number;
  soldPhotos: number;
  /** Images online, from the dashboard. */
  publishedPhotos: number;
  /** Revenue per image that sold at least once. */
  revenuePerSoldPhoto: number | null;
  /** Revenue per image in the whole portfolio. */
  revenuePerPortfolioPhoto: number | null;
  partners: string[];
  photos: PhotoStat[];
  shoots: ShootStat[];
  months: MonthStat[];
  /** Sales that Westend61 lists without an image. */
  otherRevenue: number;
  /** Lifetime image earnings as on the dashboard. */
  westendTotal: number;
  /** Go-live dates of the images in the portfolio, oldest first. */
  portfolioDates: string[];
};

/** Partner key for sales without one; shown translated in the UI. */
export const UNKNOWN_PARTNER = 'other';
export const UNMATCHED_KEY = 'unmatched';

/** Shoot key of a submission, from {@link Shoot.id} (`old:58251`). */
/** Puts every submission of the new system after all of the old one. */
const NEW_SYSTEM_ORDER = 1_000_000_000;

/**
 * Sort key for “Updated”: the submission's “Last Updated” date, then its
 * creation order for equal or unknown dates.
 */
export const updatedSortKey = (s: ShootStat) =>
  `${s.updatedAt ?? ''}#${String(s.order ?? 0).padStart(12, '0')}`;

export const westendShootKey = (id: string) => `westend:${id}`;
export const manualShootKey = (id: string) => `manual:${id}`;

const round = (n: number) => Math.round(n * 100) / 100;
const partnerOf = (sale: Sale) => sale.partner ?? UNKNOWN_PARTNER;

const addTo = (totals: PartnerTotals, key: string, amount: number) => {
  totals[key] = round((totals[key] ?? 0) + amount);
};

const latest = (a: string | null, b: string | null) =>
  !a ? b : !b ? a : a > b ? a : b;

const earliest = (dates: (string | null)[]) =>
  dates.reduce<string | null>(
    (min, d) => (d && (!min || d < min) ? d : min),
    null
  );

/** `EVKF00130` before `EVKF00200`: image IDs in upload order. */
export const compareImageIds = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

/** Only Westend61 shoots can be joined; hand-made ones are edited directly. */
export const isMergeable = (shoot: ShootStat) => shoot.kind === 'westend';

/** Follows merge links to the shoot that finally takes in `key`. */
const resolveMerge = (
  key: string,
  merges: ShootMerges,
  existing: Set<string>
) => {
  const path = [key];
  for (;;) {
    const next = merges[path[path.length - 1]];
    if (!next || !existing.has(next)) return path[path.length - 1];
    const loopStart = path.indexOf(next);
    if (loopStart >= 0) {
      // A loop of merges: settle on one member, the same from any start.
      return [...path.slice(loopStart)].sort()[0];
    }
    path.push(next);
  }
};

const combineShoots = (target: ShootStat, sources: ShootStat[]): ShootStat => {
  const all = [target, ...sources];
  const photos = all
    .flatMap((s) => s.photos)
    .sort((a, b) => b.revenue - a.revenue);
  const byPartner: PartnerTotals = {};
  for (const shoot of all) {
    for (const [partner, amount] of Object.entries(shoot.byPartner)) {
      addTo(byPartner, partner, amount);
    }
  }
  const revenue = round(all.reduce((sum, s) => sum + s.revenue, 0));
  const publishedCount = all.every((s) => s.publishedCount !== null)
    ? all.reduce((sum, s) => sum + (s.publishedCount ?? 0), 0)
    : null;
  return {
    ...target,
    createdAt: earliest(all.map((s) => s.createdAt)),
    updatedAt: all.reduce<string | null>(
      (d, s) => latest(d, s.updatedAt),
      null
    ),
    publishedAt: earliest(all.map((s) => s.publishedAt)),
    publishedCount,
    thumbUrl: photos[0]?.product.thumbUrl ?? target.thumbUrl,
    photos,
    unsoldPhotos: all.flatMap((s) => s.unsoldPhotos),
    salesCount: all.reduce((sum, s) => sum + s.salesCount, 0),
    revenue,
    revenuePerPhoto: publishedCount ? round(revenue / publishedCount) : null,
    lastSale: all.reduce<string | null>((d, s) => latest(d, s.lastSale), null),
    byPartner,
    mergedFrom: sources.map((s) => ({ key: s.key, title: s.title })),
  };
};

/** Folds every joined shoot into the shoot it was joined to. */
const foldMerges = (shoots: ShootStat[], merges: ShootMerges) => {
  const existing = new Set(shoots.filter(isMergeable).map((s) => s.key));
  const resolve = (key: string) =>
    existing.has(key) ? resolveMerge(key, merges, existing) : key;

  const sourcesOf = new Map<string, ShootStat[]>();
  for (const shoot of shoots) {
    const target = resolve(shoot.key);
    if (target !== shoot.key) {
      sourcesOf.set(target, [...(sourcesOf.get(target) ?? []), shoot]);
    }
  }
  const folded = shoots
    .filter((s) => resolve(s.key) === s.key)
    .map((s) =>
      sourcesOf.has(s.key) ? combineShoots(s, sourcesOf.get(s.key)!) : s
    );
  return { shoots: folded, resolve };
};

const portfolioToShootPhoto = (item: PortfolioItem): ShootPhoto => ({
  id: item.id,
  headline: item.headline,
  publishedAt: item.createdAt,
  thumbUrl: item.thumbUrl,
});

export const buildStats = (
  dataset: Dataset,
  manualShoots: ManualShoot[] = [],
  shootMerges: ShootMerges = {}
): Stats => {
  const portfolioById = new Map(dataset.portfolio.map((p) => [p.id, p]));
  // A withdrawn submission never went on sale: not a shoot. (Data synced
  // before they were skipped may still hold some.)
  const submissions = dataset.shoots.filter((s) => s.state !== 'WITHDRAWN');

  // Priority: the user's manual assignment, then the submissions.
  const shootKeyOf = new Map<string, string>();
  for (const shoot of submissions) {
    for (const id of shoot.photoIds) {
      shootKeyOf.set(id, westendShootKey(shoot.id));
    }
  }
  for (const manual of manualShoots) {
    for (const productId of manual.productIds) {
      shootKeyOf.set(productId, manualShootKey(manual.id));
    }
  }

  const photos: PhotoStat[] = dataset.products.map((product) => {
    const byPartner: PartnerTotals = {};
    for (const sale of product.sales) {
      addTo(byPartner, partnerOf(sale), sale.amount);
    }
    return {
      product: {
        ...product,
        createdAt:
          product.createdAt ?? portfolioById.get(product.id)?.createdAt ?? null,
      },
      shootKey: shootKeyOf.get(product.id) ?? null,
      sales: product.sales,
      revenue: round(product.sales.reduce((sum, s) => sum + s.amount, 0)),
      lastSale: product.sales.reduce<string | null>(
        (d, s) => latest(d, s.date),
        null
      ),
      byPartner,
    };
  });
  photos.sort((a, b) => b.revenue - a.revenue);
  const soldIds = new Set(photos.map((p) => p.product.id));

  // Shoots
  type ShootBase = Pick<
    ShootStat,
    | 'key'
    | 'kind'
    | 'westendNumber'
    | 'westendState'
    | 'manualId'
    | 'title'
    | 'createdAt'
    | 'updatedAt'
    | 'order'
    | 'publishedAt'
    | 'publishedCount'
    | 'unsoldPhotos'
  >;

  const makeShoot = (base: ShootBase, shootPhotos: PhotoStat[]): ShootStat => {
    const byPartner: PartnerTotals = {};
    let salesCount = 0;
    let lastSale: string | null = null;
    for (const photo of shootPhotos) {
      salesCount += photo.sales.length;
      lastSale = latest(lastSale, photo.lastSale);
      for (const [partner, amount] of Object.entries(photo.byPartner)) {
        addTo(byPartner, partner, amount);
      }
    }
    const revenue = round(shootPhotos.reduce((sum, p) => sum + p.revenue, 0));
    return {
      ...base,
      publishedAt:
        base.publishedAt ??
        earliest(shootPhotos.map((p) => p.product.createdAt)),
      thumbUrl:
        shootPhotos[0]?.product.thumbUrl ??
        base.unsoldPhotos[0]?.thumbUrl ??
        null,
      photos: shootPhotos,
      salesCount,
      revenue,
      revenuePerPhoto: base.publishedCount
        ? round(revenue / base.publishedCount)
        : null,
      lastSale,
      byPartner,
      mergedFrom: [],
    };
  };

  const photosOf = (key: string | null) =>
    photos.filter((p) => p.shootKey === key);

  // An image is online when it is in the portfolio. Without a complete
  // portfolio (it failed to load in full) that can't be told, so every image
  // with an ID counts as published.
  const portfolioComplete =
    dataset.portfolio.length > 0 &&
    dataset.portfolio.length >= dataset.portfolioSize * 0.95;
  const isOnline = (id: string) => !portfolioComplete || portfolioById.has(id);

  const shoots = submissions.flatMap((shoot) => {
    const key = westendShootKey(shoot.id);
    // Images the user moved into an own shoot are no longer counted here.
    const ids = shoot.photoIds.filter((id) => shootKeyOf.get(id) === key);
    const shootPhotos = photosOf(key);
    // Unsold images taken offline since are not part of the shoot any more.
    const unsold = ids
      .filter((id) => !soldIds.has(id) && isOnline(id))
      .map((id): ShootPhoto => {
        const item = portfolioById.get(id);
        return item
          ? portfolioToShootPhoto(item)
          : { id, headline: null, publishedAt: null, thumbUrl: null };
      });
    const published = shootPhotos.length + unsold.length;
    // Nothing published (yet): images still in processing, or all of them
    // moved into own shoots.
    if (!published) return [];
    return makeShoot(
      {
        key,
        kind: 'westend',
        westendNumber: shoot.number,
        updatedAt: shoot.updatedAt ?? null,
        order: (shoot.system === 'new' ? NEW_SYSTEM_ORDER : 0) + shoot.number,
        westendState: shoot.state,
        manualId: null,
        title: shoot.title,
        createdAt: null,
        publishedAt: earliest([
          ...unsold.map((p) => p.publishedAt),
          ...shootPhotos.map((p) => p.product.createdAt),
        ]),
        publishedCount: published,
        unsoldPhotos: unsold,
      },
      shootPhotos
    );
  });
  // Unsold portfolio images outside the submissions: they belong to a
  // manual shoot or to «No shoot», so all of them can be grouped by hand.
  const unsoldByKey = new Map<string | null, ShootPhoto[]>();
  for (const item of dataset.portfolio) {
    const key = shootKeyOf.get(item.id) ?? null;
    if (soldIds.has(item.id) || key?.startsWith('westend:')) continue;
    unsoldByKey.set(key, [
      ...(unsoldByKey.get(key) ?? []),
      portfolioToShootPhoto(item),
    ]);
  }
  // Without the portfolio only the sold images of a shoot are known.
  const countOf = (sold: PhotoStat[], unsold: ShootPhoto[]) =>
    dataset.portfolio.length ? sold.length + unsold.length : null;

  for (const manual of manualShoots) {
    const key = manualShootKey(manual.id);
    const shootPhotos = photosOf(key);
    const unsold = unsoldByKey.get(key) ?? [];
    if (!shootPhotos.length && !unsold.length) continue;
    shoots.push(
      makeShoot(
        {
          key,
          kind: 'manual',
          westendNumber: null,
          updatedAt: null,
          order: null,
          westendState: null,
          manualId: manual.id,
          title: manual.title,
          createdAt: null,
          publishedAt: earliest([
            ...unsold.map((p) => p.publishedAt),
            ...shootPhotos.map((p) => p.product.createdAt),
          ]),
          publishedCount: countOf(shootPhotos, unsold),
          unsoldPhotos: unsold,
        },
        shootPhotos
      )
    );
  }
  const unmatched = photosOf(null);
  const unmatchedUnsold = unsoldByKey.get(null) ?? [];
  if (unmatched.length || unmatchedUnsold.length) {
    shoots.push(
      makeShoot(
        {
          key: UNMATCHED_KEY,
          kind: 'unmatched',
          westendNumber: null,
          updatedAt: null,
          order: null,
          westendState: null,
          manualId: null,
          // Shown translated in the UI (see `shoot-labels.ts`).
          title: '',
          createdAt: null,
          publishedAt: null,
          publishedCount: countOf(unmatched, unmatchedUnsold),
          unsoldPhotos: unmatchedUnsold,
        },
        unmatched
      )
    );
  }
  const merged = foldMerges(shoots, shootMerges);
  merged.shoots.sort((a, b) => b.revenue - a.revenue);
  const finalPhotos = photos.map((p) =>
    p.shootKey ? { ...p, shootKey: merged.resolve(p.shootKey) } : p
  );

  // Months
  const monthMap = new Map<string, MonthStat>();
  for (const sale of [
    ...photos.flatMap((p) => p.sales),
    ...dataset.otherSales,
  ]) {
    const key = sale.date.slice(0, 7);
    const month = monthMap.get(key) ?? {
      key,
      revenue: 0,
      salesCount: 0,
      byPartner: {},
    };
    month.revenue = round(month.revenue + sale.amount);
    month.salesCount += 1;
    addTo(month.byPartner, partnerOf(sale), sale.amount);
    monthMap.set(key, month);
  }
  const months = [...monthMap.values()].sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  const partnerTotals: PartnerTotals = {};
  for (const m of months) {
    for (const [partner, amount] of Object.entries(m.byPartner)) {
      addTo(partnerTotals, partner, amount);
    }
  }

  const otherRevenue = round(
    dataset.otherSales.reduce((sum, s) => sum + s.amount, 0)
  );
  const revenue = round(months.reduce((sum, m) => sum + m.revenue, 0));
  const soldPhotos = photos.filter((p) => p.sales.length).length;
  const publishedPhotos = dataset.portfolioSize || dataset.portfolio.length;

  return {
    revenue,
    salesCount: months.reduce((sum, m) => sum + m.salesCount, 0),
    soldPhotos,
    publishedPhotos,
    revenuePerSoldPhoto: soldPhotos ? round(revenue / soldPhotos) : null,
    revenuePerPortfolioPhoto: publishedPhotos
      ? round(revenue / publishedPhotos)
      : null,
    partners: Object.keys(partnerTotals).sort(
      (a, b) => partnerTotals[b] - partnerTotals[a]
    ),
    photos: finalPhotos,
    shoots: merged.shoots,
    months,
    otherRevenue,
    westendTotal: dataset.westendTotal,
    portfolioDates: dataset.portfolio
      .flatMap((p) => (p.createdAt ? [p.createdAt] : []))
      .sort(),
  };
};
