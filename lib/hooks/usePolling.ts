import { useEffect, useRef } from 'react';

// Runs `callback` immediately, then every `intervalMs`, skipping ticks while
// the tab is hidden so backgrounded admin pages don't hammer the API.
export function usePolling(callback: () => void, intervalMs: number): void {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    savedCallback.current();

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        savedCallback.current();
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
}
