import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import * as actions from './actions.ts';
import type { LessonRef, PassResult } from './actions.ts';
import { mergeProgress } from './import-export.ts';
import {
  loadProgress,
  parseStored,
  PROGRESS_KEY,
  safeLocalStorage,
  saveProgress,
  type StorageLike,
} from './persistence.ts';
import { createEmptyProgress, type Progress, type Settings } from './schema.ts';

export interface ProgressState {
  progress: Progress;
  /** The last write failed; the app keeps working in memory (show an "export it" banner). */
  saveFailed: boolean;
  /** Stored data could not be read at startup (it was set aside, not deleted). */
  recoveredFromError?: string;

  startLesson(lesson: LessonRef): void;
  recordFailedAttempt(lesson: LessonRef, challengeId: string): void;
  recordHint(lesson: LessonRef, challengeId: string): void;
  recordReveal(lesson: LessonRef, challengeId: string): void;
  recordPass(lesson: LessonRef, challengeId: string, baseXp: number): PassResult;
  updateSettings(patch: Partial<Settings>): void;
  skipRecommendations(trackId: string): void;
  restoreRecommendations(trackId: string): void;
  markLevelCelebrated(level: number): void;
  importProgress(incoming: Progress, mode: 'replace' | 'merge'): void;
  resetProgress(): void;
}

export type ProgressStore = StoreApi<ProgressState>;

export interface StoreOptions {
  storage?: StorageLike;
  now?: () => Date;
}

export function createProgressStore({ storage, now = () => new Date() }: StoreOptions = {}) {
  const loaded = loadProgress(storage, now());
  return createStore<ProgressState>()((set, get) => {
    const apply = (next: Progress) => {
      if (next !== get().progress) set({ progress: next });
    };
    return {
      progress: loaded.progress,
      saveFailed: false,
      recoveredFromError: loaded.recoveredFromError,

      startLesson: (lesson) => apply(actions.startLesson(get().progress, lesson, now())),
      recordFailedAttempt: (lesson, id) =>
        apply(actions.recordFailedAttempt(get().progress, lesson, id, now())),
      recordHint: (lesson, id) => apply(actions.recordHint(get().progress, lesson, id, now())),
      recordReveal: (lesson, id) => apply(actions.recordReveal(get().progress, lesson, id, now())),
      recordPass: (lesson, id, baseXp) => {
        const result = actions.recordPass(get().progress, lesson, id, baseXp, now());
        apply(result.progress);
        return result;
      },
      updateSettings: (patch) => apply(actions.updateSettings(get().progress, patch)),
      skipRecommendations: (trackId) => apply(actions.skipRecommendations(get().progress, trackId)),
      restoreRecommendations: (trackId) =>
        apply(actions.restoreRecommendations(get().progress, trackId)),
      markLevelCelebrated: (level) => apply(actions.markLevelCelebrated(get().progress, level)),
      importProgress: (incoming, mode) =>
        apply(mode === 'replace' ? incoming : mergeProgress(get().progress, incoming)),
      resetProgress: () =>
        apply({ ...createEmptyProgress(now()), settings: get().progress.settings }),
    };
  });
}

const SAVE_DEBOUNCE_MS = 300;

/**
 * Debounced writes (and an immediate flush on pagehide), plus cross-tab sync through the
 * `storage` event. Returns a cleanup function.
 */
export function connectPersistence(
  store: ProgressStore,
  storage: StorageLike | undefined,
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fromOtherTab = false;

  const write = () => {
    timer = undefined;
    const ok = saveProgress(storage, store.getState().progress);
    if (ok === store.getState().saveFailed) store.setState({ saveFailed: !ok });
  };

  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    write();
  };

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.progress === previous.progress || fromOtherTab) return;
    clearTimeout(timer);
    timer = setTimeout(write, SAVE_DEBOUNCE_MS);
  });

  const onStorage = (event: StorageEvent) => {
    if (event.key !== PROGRESS_KEY || event.newValue === null) return;
    const result = parseStored(event.newValue);
    if (!result.ok) return;
    fromOtherTab = true;
    store.setState({ progress: result.progress });
    fromOtherTab = false;
  };

  target.addEventListener('pagehide', flush);
  target.addEventListener('storage', onStorage as EventListener);
  return () => {
    flush();
    unsubscribe();
    target.removeEventListener('pagehide', flush);
    target.removeEventListener('storage', onStorage as EventListener);
  };
}

const appStorage = typeof window === 'undefined' ? undefined : safeLocalStorage();

/** The app's single progress store. */
export const progressStore = createProgressStore({ storage: appStorage });

export function startProgressPersistence(): () => void {
  return connectPersistence(progressStore, appStorage);
}

export function useProgress<T>(selector: (state: ProgressState) => T): T {
  return useStore(progressStore, selector);
}
