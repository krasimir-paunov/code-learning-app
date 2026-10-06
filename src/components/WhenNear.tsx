import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNearViewport } from './use-near-viewport.ts';

/** Upper bound on waiting for an idle moment; also the delay where requestIdleCallback is missing. */
const IDLE_TIMEOUT_MS = 1500;

function afterLoadIdle(callback: () => void): () => void {
  let cancel = () => {};
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, IDLE_TIMEOUT_MS);
      cancel = () => clearTimeout(id);
    }
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    cancel();
  };
}

/**
 * Renders `fallback` until the spot nears the viewport or the page goes idle after loading, then
 * `children`. Lazy views below the fold wrap in it so their chunks load after the first paint
 * instead of competing with it, yet are in place before a keyboard or find-in-page user gets there.
 */
export function WhenNear({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref);
  const [idle, setIdle] = useState(false);
  useEffect(() => afterLoadIdle(() => setIdle(true)), []);
  return near || idle ? children : <div ref={ref}>{fallback}</div>;
}
