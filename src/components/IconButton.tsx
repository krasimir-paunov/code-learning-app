import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';
import { Tooltip } from './Tooltip.tsx';
import { cx } from './cx.ts';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  /** Accessible name; also shown as a tooltip. Required: icon buttons must be named. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'solid';
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        className={cx(styles.iconButton, styles[variant], className)}
        {...rest}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    </Tooltip>
  );
}
