import { useEffect, type RefObject } from 'react';

const DIRECTIONS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/**
 * Arrow keys move focus to the nearest map item in that direction (items carry data-nav),
 * so keyboard users can walk the graph the way it is drawn. Tab order stays intact too.
 */
export function useArrowNavigation(container: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = DIRECTIONS[event.key];
      const current = event.target as HTMLElement;
      if (!direction || !current.matches('[data-nav]')) return;
      const [dx, dy] = direction;
      const from = current.getBoundingClientRect();
      const cx = from.left + from.width / 2;
      const cy = from.top + from.height / 2;
      let best: HTMLElement | undefined;
      let bestScore = Infinity;
      for (const item of root.querySelectorAll<HTMLElement>('[data-nav]')) {
        if (item === current) continue;
        const r = item.getBoundingClientRect();
        const ix = r.left + r.width / 2 - cx;
        const iy = r.top + r.height / 2 - cy;
        const along = ix * dx + iy * dy;
        if (along <= 1) continue;
        const across = Math.abs(ix * dy) + Math.abs(iy * dx);
        // Prefer items straight ahead; sideways distance costs more than forward distance.
        const score = along + across * 2.5;
        if (score < bestScore) {
          bestScore = score;
          best = item;
        }
      }
      if (best) {
        event.preventDefault();
        best.focus();
        best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [container]);
}
