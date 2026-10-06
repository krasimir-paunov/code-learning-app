import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from '../components/ErrorScreen.tsx';

interface State {
  error: Error | null;
}

/**
 * React still requires a class for error boundaries (the one exception to the
 * function-components rule). Lazy chunks that fail to load after a deploy land here too.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      const chunkFailed = /dynamically imported module|Importing a module script failed/i.test(
        this.state.error.message,
      );
      return (
        <ErrorScreen
          message={
            chunkFailed
              ? 'Part of the app could not be downloaded. You may be offline, or a new version was just published.'
              : 'This page hit an unexpected error. Your progress is safe.'
          }
        />
      );
    }
    return this.props.children;
  }
}
