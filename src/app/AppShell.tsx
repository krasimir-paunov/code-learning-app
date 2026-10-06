import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { TerminalLoader } from '../effects/TerminalLoader.tsx';
import { LevelUpOverlay } from '../features/progress/LevelUpOverlay.tsx';
import { StorageNotice } from '../features/progress/StorageNotice.tsx';
import styles from './AppShell.module.css';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { trackInputModality } from './input-modality.ts';
import { TopBar } from './TopBar.tsx';

/** How long route focus waits for a lazily loaded page to render its heading. */
const HEADING_WAIT_MS = 3000;

function focusForRoute(target: HTMLElement) {
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.setAttribute('data-route-focus', '');
  target.focus({ preventScroll: true });
}

/**
 * After client-side navigation, move focus to the new page's heading (or main) so
 * screen-reader and keyboard users start at the new content, as on a full page load.
 * `data-route-focus` lets the stylesheet show that focus ring to keyboard users only.
 */
function useRouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    const main = document.getElementById('main');
    if (!main) return;
    const heading = main.querySelector<HTMLElement>('h1');
    if (heading) {
      focusForRoute(heading);
      return;
    }
    // The page's chunk is still loading (its fallback has no heading): wait for the heading
    // rather than focusing main and then moving focus again.
    const observer = new MutationObserver(() => {
      const found = main.querySelector<HTMLElement>('h1');
      if (!found) return;
      stop();
      focusForRoute(found);
    });
    const timer = setTimeout(() => {
      stop();
      focusForRoute(main);
    }, HEADING_WAIT_MS);
    function stop() {
      observer.disconnect();
      clearTimeout(timer);
    }
    observer.observe(main, { childList: true, subtree: true });
    return stop;
  }, [pathname]);
}

export function AppShell() {
  useRouteFocus();
  useEffect(() => trackInputModality(), []);
  const { pathname } = useLocation();
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <TopBar />
      <StorageNotice />
      <main id="main" className={styles.main} tabIndex={-1}>
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<TerminalLoader line="loading page" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <LevelUpOverlay />
    </div>
  );
}
