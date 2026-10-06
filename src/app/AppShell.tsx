import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { TerminalLoader } from '../effects/TerminalLoader.tsx';
import styles from './AppShell.module.css';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { TopBar } from './TopBar.tsx';

/**
 * After client-side navigation, move focus to the new page's heading (or main) so
 * screen-reader and keyboard users start at the new content, as on a full page load.
 */
function useRouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const main = document.getElementById('main');
    const target = main?.querySelector<HTMLElement>('h1') ?? main;
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [pathname]);
}

export function AppShell() {
  useRouteFocus();
  const { pathname } = useLocation();
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <TopBar />
      <main id="main" className={styles.main} tabIndex={-1}>
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<TerminalLoader line="loading page" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
