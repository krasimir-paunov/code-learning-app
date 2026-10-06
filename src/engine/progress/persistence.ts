import { STORAGE_NAMESPACE } from '../../config/app.ts';
import { migrate } from './migrations/index.ts';
import { createEmptyProgress, type Progress } from './schema.ts';

export const PROGRESS_KEY = `${STORAGE_NAMESPACE}.progress`;
/** Unreadable data is moved here instead of being overwritten, so nothing is ever lost. */
export const UNREADABLE_KEY = `${STORAGE_NAMESPACE}.progress.unreadable`;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** localStorage can throw on access (privacy modes, blocked site data). */
export function safeLocalStorage(): StorageLike | undefined {
  try {
    const storage = window.localStorage;
    storage.getItem(PROGRESS_KEY);
    return storage;
  } catch {
    return undefined;
  }
}

export interface LoadResult {
  progress: Progress;
  /** Stored data existed but could not be read; it was kept under UNREADABLE_KEY. */
  recoveredFromError?: string;
}

export function parseStored(raw: string): ReturnType<typeof migrate> {
  try {
    return migrate(JSON.parse(raw));
  } catch {
    return { ok: false, error: 'Stored progress is not valid JSON.' };
  }
}

export function loadProgress(storage: StorageLike | undefined, now: Date): LoadResult {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(PROGRESS_KEY) ?? null;
  } catch {
    return { progress: createEmptyProgress(now) };
  }
  if (raw === null) return { progress: createEmptyProgress(now) };
  const result = parseStored(raw);
  if (result.ok) return { progress: result.progress };
  try {
    storage?.setItem(UNREADABLE_KEY, raw);
  } catch {
    // Nothing more we can do; the in-memory session still works.
  }
  return { progress: createEmptyProgress(now), recoveredFromError: result.error };
}

/** Returns false when the write failed (quota, private mode): the app keeps working in memory. */
export function saveProgress(storage: StorageLike | undefined, progress: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
