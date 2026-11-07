import { useCallback } from 'react';
import { loadShootMerges, saveShootMerges } from '@/lib/storage';
import type { ShootMerges } from '@/types/westend';
import { useStoredState } from './use-stored-state';

const EMPTY: ShootMerges = {};

/** Shoots the user joined together, persisted in extension storage. */
export const useShootMerges = () => {
  const state = useStoredState(loadShootMerges, saveShootMerges, EMPTY);
  const { update } = state;

  /** Joins `source` (and anything already joined to it) into `target`. */
  const merge = useCallback(
    (source: string, target: string) =>
      update((current) => {
        const next: ShootMerges = {};
        for (const [from, to] of Object.entries(current)) {
          next[from] = to === source ? target : to;
        }
        next[source] = target;
        return next;
      }),
    [update]
  );

  const unmerge = useCallback(
    (source: string) =>
      update((current) => {
        const next = { ...current };
        delete next[source];
        return next;
      }),
    [update]
  );

  return { value: state.value, ready: state.ready, merge, unmerge };
};
