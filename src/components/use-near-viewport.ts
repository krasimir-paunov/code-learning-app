import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the element comes within `margin` of the viewport, and stays true. Heavy, below-the-fold
 * work (CodeMirror, sandbox runs) waits for it so it never competes with the first paint.
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = '400px'): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true);
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin, near]);
  return near;
}
