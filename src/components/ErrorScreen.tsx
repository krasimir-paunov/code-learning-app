import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button.tsx';
import { EmptyState } from './EmptyState.tsx';

interface ErrorScreenProps {
  title?: string;
  message: ReactNode;
  actions?: ReactNode;
}

/** Calm, static error state (no effects on error surfaces, DESIGN §5). */
export function ErrorScreen({
  title = 'Something went wrong',
  message,
  actions,
}: ErrorScreenProps) {
  return (
    <div role="alert">
      <EmptyState
        level={1}
        icon={<TriangleAlert />}
        title={title}
        actions={
          actions ?? (
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload the page
            </Button>
          )
        }
      >
        {message}
      </EmptyState>
    </div>
  );
}
