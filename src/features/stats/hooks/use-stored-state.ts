import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A value persisted in extension storage. `update` applies a pure change and
 * saves the result; `ready` turns true once the stored value has loaded.
 */
export const useStoredState = <T>(
  load: () => Promise<T>,
  save: (value: T) => Promise<void>,
  initial: T
) => {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const current = useRef<T>(initial);

  useEffect(() => {
    load().then((stored) => {
      current.current = stored;
      setValue(stored);
      setReady(true);
    });
  }, [load]);

  const update = useCallback(
    (fn: (value: T) => T) => {
      const next = fn(current.current);
      current.current = next;
      setValue(next);
      save(next);
    },
    [save]
  );

  return { value, ready, update };
};
