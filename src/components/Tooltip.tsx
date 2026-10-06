import { useEffect, useState, type ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  /** Must repeat the trigger's accessible name; the bubble itself is visual only. */
  content: string;
  children: ReactNode;
}

/** Shows on hover and on keyboard focus; Escape dismisses it (WCAG 1.4.13). */
export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span
      className={styles.wrapper}
      onPointerEnter={(event) => setOpen(event.pointerType === 'mouse')}
      onPointerLeave={() => setOpen(false)}
      onFocus={(event) => setOpen(event.target.matches(':focus-visible'))}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className={styles.bubble} aria-hidden="true">
          {content}
        </span>
      )}
    </span>
  );
}
