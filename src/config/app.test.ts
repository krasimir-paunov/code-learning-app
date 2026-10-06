import { describe, expect, it } from 'vitest';
import { APP_SLUG, STORAGE_NAMESPACE } from './app.ts';

describe('app config', () => {
  it('derives a file-name-safe slug from the app name', () => {
    expect(APP_SLUG).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('never changes the storage namespace (it keys saved progress)', () => {
    expect(STORAGE_NAMESPACE).toBe('pneon');
  });
});
