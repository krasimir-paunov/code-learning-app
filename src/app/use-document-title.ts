import { useEffect } from 'react';
import { APP_NAME } from '../config/app.ts';

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
