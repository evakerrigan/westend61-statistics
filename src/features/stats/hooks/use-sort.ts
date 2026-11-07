import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export type SortAccessors<T> = Record<string, (row: T) => number | string>;

/** Client-side column sorting for a table. Clicking a column twice flips it. */
export const useSort = <T>(
  rows: T[],
  accessors: SortAccessors<T>,
  initialKey: string
) => {
  const [sortKey, setSortKey] = useState(initialKey);
  const [direction, setDirection] = useState<SortDirection>('desc');

  const sorted = useMemo(() => {
    const get = accessors[sortKey];
    if (!get) return rows;
    const factor = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * factor;
      }
      return String(va).localeCompare(String(vb), 'ru') * factor;
    });
  }, [rows, accessors, sortKey, direction]);

  const toggle = (key: string) => {
    if (key === sortKey) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setDirection('desc');
    }
  };

  return { sorted, sortKey, direction, toggle };
};
