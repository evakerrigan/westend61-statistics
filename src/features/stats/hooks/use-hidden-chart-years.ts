import { loadHiddenChartYears, saveHiddenChartYears } from '@/lib/storage';
import type { HiddenChartYears } from '@/types/westend';
import { useStoredState } from './use-stored-state';

const EMPTY: HiddenChartYears = {};

/**
 * Years switched off in the “By upload year” charts, persisted in extension
 * storage so they stay off after leaving the page.
 */
export const useHiddenChartYears = () => {
  const { value, ready, update } = useStoredState(
    loadHiddenChartYears,
    saveHiddenChartYears,
    EMPTY
  );
  const toggle = (chart: string, year: string) =>
    update((current) => {
      const years = current[chart] ?? [];
      const next = years.includes(year)
        ? years.filter((y) => y !== year)
        : [...years, year];
      return { ...current, [chart]: next };
    });
  return { value, ready, toggle };
};
