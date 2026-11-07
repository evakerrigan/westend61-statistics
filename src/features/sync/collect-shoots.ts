import {
  INGESTION_NEO_ORIGIN,
  INGESTION_ORIGIN,
  openSession,
  WestendAuthError,
  type WestendSession,
} from '@/lib/westend-client';
import type { Shoot, SubmissionSystem } from '@/types/westend';
import {
  fetchSubmissionList,
  fetchSubmissionPhotos,
  submissionStartPath,
  type SubmissionSummary,
} from './api/submissions-api';

const ORIGINS: Record<SubmissionSystem, string> = {
  old: INGESTION_ORIGIN,
  new: INGESTION_NEO_ORIGIN,
};
const SYSTEMS: SubmissionSystem[] = ['old', 'new'];

export const shootId = (system: SubmissionSystem, number: number) =>
  `${system}:${number}`;

export type ShootsProgress = (
  step: 'shootList' | 'shoots',
  done: number,
  total: number
) => void;

export type ShootsResult = {
  shoots: Shoot[];
  error: 'auth' | 'other' | null;
};

/** A submission's images can only change while it is new to us or changed. */
const isUnchanged = (previous: Shoot | undefined, s: SubmissionSummary) =>
  !!previous &&
  previous.acceptedCount === s.acceptedCount &&
  previous.state === s.state;

/**
 * Submissions from both submission systems, with the IDs of their accepted
 * images. A submission's page is loaded only when it is new or its state or
 * number of accepted images changed since the previous update.
 *
 * A system that can't be reached (e.g. not logged in there) keeps the
 * submissions from the previous update and is reported in `error`.
 */
export const collectShoots = async (
  previous: Shoot[],
  onProgress: ShootsProgress
): Promise<ShootsResult> => {
  const previousById = new Map(previous.map((s) => [s.id, s]));
  const sessions: Partial<Record<SubmissionSystem, WestendSession>> = {};
  const lists: Partial<Record<SubmissionSystem, SubmissionSummary[]>> = {};
  let error: ShootsResult['error'] = null;

  const fail = (e: unknown) => {
    error =
      e instanceof WestendAuthError && error !== 'other' ? 'auth' : 'other';
  };

  try {
    // 1. Both submission lists.
    for (const [i, system] of SYSTEMS.entries()) {
      onProgress('shootList', i, SYSTEMS.length);
      try {
        const session = await openSession(
          ORIGINS[system],
          submissionStartPath[system]
        );
        sessions[system] = session;
        lists[system] = await fetchSubmissionList(session, system);
      } catch (e) {
        fail(e);
      }
    }

    // 2. Images of new or changed submissions.
    const withImages = SYSTEMS.flatMap((system) =>
      (lists[system] ?? []).filter((s) => s.acceptedCount > 0)
    );
    const toFetch = withImages.filter(
      (s) => !isUnchanged(previousById.get(shootId(s.system, s.number)), s)
    );
    const fetched = new Map<string, string[]>();
    for (const [i, s] of toFetch.entries()) {
      onProgress('shoots', i, toFetch.length);
      const session = sessions[s.system];
      if (!session) continue;
      try {
        fetched.set(
          shootId(s.system, s.number),
          await fetchSubmissionPhotos(session, s.system, s.number)
        );
      } catch (e) {
        fail(e);
      }
    }

    const shoots: Shoot[] = [];
    for (const system of SYSTEMS) {
      const list = lists[system];
      if (!list) {
        // Not reachable this time: keep what the previous update found.
        shoots.push(...previous.filter((s) => s.system === system));
        continue;
      }
      for (const s of list.filter((x) => x.acceptedCount > 0)) {
        const id = shootId(system, s.number);
        const photoIds = fetched.get(id) ?? previousById.get(id)?.photoIds;
        if (!photoIds) continue;
        shoots.push({
          id,
          system,
          number: s.number,
          title: s.title,
          state: s.state,
          acceptedCount: s.acceptedCount,
          photoIds,
        });
      }
    }
    return { shoots, error };
  } finally {
    for (const session of Object.values(sessions)) await session?.close();
  }
};
