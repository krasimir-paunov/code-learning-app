import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './CopyButton.module.css';
import { cx } from './cx.ts';

type CopyState = 'idle' | 'copied' | 'failed';

interface CopyButtonProps {
  text: string;
  /** What is copied, for the accessible name: "Copy JavaScript code". */
  what?: string;
  className?: string;
}

/** Copies text; the result is visible and announced through a polite live region. */
export function CopyButton({ text, what = 'code', className }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  return (
    <>
      <button
        type="button"
        className={cx(styles.copy, className)}
        onClick={copy}
        aria-label={`Copy ${what}`}
        data-print="hide"
      >
        <span aria-hidden="true">{state === 'copied' ? <Check /> : <Copy />}</span>
        <span aria-hidden="true">{state === 'copied' ? 'Copied' : 'Copy'}</span>
      </button>
      <span className="visually-hidden" aria-live="polite">
        {state === 'copied' && 'Copied to clipboard'}
        {state === 'failed' && 'Copy failed. Select the code and copy it manually.'}
      </span>
    </>
  );
}
