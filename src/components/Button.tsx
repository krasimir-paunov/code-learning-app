import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';
import { cx } from './cx.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Decorative icon rendered before the label. */
  icon?: ReactNode;
}

function buttonClass({ variant = 'secondary', size = 'md' }: StyleProps, extra?: string) {
  return cx(styles.button, styles[variant], size === 'sm' && styles.sm, extra);
}

export type ButtonProps = StyleProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, size, icon, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={buttonClass({ variant, size }, className)} {...rest}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

/** A router link that looks like a button (navigation stays a link, DESIGN/HTML semantics). */
export function LinkButton({
  variant,
  size,
  icon,
  className,
  children,
  ...rest
}: StyleProps & LinkProps) {
  return (
    <Link className={buttonClass({ variant, size }, className)} {...rest}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </Link>
  );
}
