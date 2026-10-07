import { useState } from 'react';

/**
 * The content width of an element, kept current with a ResizeObserver. Returns a callback ref:
 * it attaches when the element mounts, which an effect with an empty dependency list can miss.
 */
export function useElementWidth() {
  const [width, setWidth] = useState<number | null>(null);
  const ref = (element: HTMLElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  };
  return [ref, width] as const;
}
