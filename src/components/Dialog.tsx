import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Dialog.module.css';
import { IconButton } from './IconButton.tsx';
import { cx } from './cx.ts';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}

/**
 * Native modal <dialog>: the browser traps focus, makes the page inert and closes on Escape.
 * Focus returns to the element that opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  className,
  titleClassName,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, className)}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={cx(styles.title, titleClassName)}>
          {title}
        </h2>
        <IconButton label="Close" icon={<X />} onClick={onClose} />
      </div>
      <div className={styles.body}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </dialog>
  );
}
