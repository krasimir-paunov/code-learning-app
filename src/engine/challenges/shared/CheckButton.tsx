import { CircleCheckBig } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/Button.tsx';

interface CheckButtonProps {
  onCheck: () => Promise<unknown>;
  disabled?: boolean;
  label?: string;
}

/** The one primary action of every challenge view; shows progress while grading runs. */
export function CheckButton({ onCheck, disabled, label = 'Check' }: CheckButtonProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="primary"
      icon={<CircleCheckBig />}
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onCheck();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Checking…' : label}
    </Button>
  );
}
