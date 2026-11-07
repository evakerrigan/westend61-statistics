import { useCallback } from 'react';
import { loadManualShoots, saveManualShoots } from '@/lib/storage';
import type { ManualShoot } from '@/types/westend';
import { useStoredState } from './use-stored-state';

export type ManualShootsUpdate = (shoots: ManualShoot[]) => ManualShoot[];

const EMPTY: ManualShoot[] = [];

/** The user's hand-made shoots, persisted in extension storage. */
export const useManualShoots = () => {
  const state = useStoredState(loadManualShoots, saveManualShoots, EMPTY);
  const { update: updateStored } = state;

  // A shoot with no images left is removed automatically.
  const update = useCallback(
    (fn: ManualShootsUpdate) =>
      updateStored((shoots) => fn(shoots).filter((s) => s.productIds.length)),
    [updateStored]
  );

  return { ...state, update };
};
