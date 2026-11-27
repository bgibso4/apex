import { useEffect, useRef } from 'react';
import { syncAll } from './syncClient';

/**
 * Triggers a background sync on app mount. Non-blocking.
 * Only fires once per app launch.
 */
export function useSyncOnOpen(): void {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    // Fire and forget — don't await
    syncAll().catch((err) => {
      console.warn('[sync] Background sync failed:', err);
    });
  }, []);
}
