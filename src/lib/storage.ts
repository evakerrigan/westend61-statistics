import type {
  Dataset,
  HiddenChartYears,
  ManualShoot,
  ShootMerges,
} from '@/types/westend';

const DATASET_KEY = 'dataset';
const MANUAL_SHOOTS_KEY = 'manualShoots';
const SHOOT_MERGES_KEY = 'shootMerges';
const HIDDEN_CHART_YEARS_KEY = 'hiddenChartYears';

// Outside the extension (plain `npm run dev`) chrome.storage is unavailable,
// so fall back to localStorage to keep the UI usable while developing.
const hasChromeStorage = () =>
  typeof chrome !== 'undefined' && !!chrome.storage?.local;

const read = async <T>(key: string): Promise<T | null> => {
  if (hasChromeStorage()) {
    const stored = await chrome.storage.local.get(key);
    return (stored[key] as T | undefined) ?? null;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = async (key: string, value: unknown): Promise<void> => {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadDataset = () => read<Dataset>(DATASET_KEY);

export const saveDataset = (dataset: Dataset) => write(DATASET_KEY, dataset);

export const loadManualShoots = async () =>
  (await read<ManualShoot[]>(MANUAL_SHOOTS_KEY)) ?? [];

export const saveManualShoots = (shoots: ManualShoot[]) =>
  write(MANUAL_SHOOTS_KEY, shoots);

export const loadShootMerges = async () =>
  (await read<ShootMerges>(SHOOT_MERGES_KEY)) ?? {};

export const saveShootMerges = (merges: ShootMerges) =>
  write(SHOOT_MERGES_KEY, merges);

export const loadHiddenChartYears = async () =>
  (await read<HiddenChartYears>(HIDDEN_CHART_YEARS_KEY)) ?? {};

export const saveHiddenChartYears = (hidden: HiddenChartYears) =>
  write(HIDDEN_CHART_YEARS_KEY, hidden);

/**
 * Removes everything the extension keeps in this browser: synced data, the
 * user's own shoots and joins, hidden chart years, and the theme /
 * language choice.
 */
export const clearAllData = async (): Promise<void> => {
  if (hasChromeStorage()) await chrome.storage.local.clear();
  try {
    localStorage.clear();
  } catch {
    // Nothing stored there, or storage unavailable.
  }
};
