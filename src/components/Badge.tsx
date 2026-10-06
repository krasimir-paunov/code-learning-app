import type { ReactNode } from 'react';
import styles from './Badge.module.css';
import { cx } from './cx.ts';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'reward';

interface BadgeProps {
  tone?: BadgeTone;
  /** Decorative; the text must carry the meaning (color is never the only signal). */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
