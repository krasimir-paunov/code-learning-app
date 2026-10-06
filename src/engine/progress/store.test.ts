import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROGRESS_KEY, UNREADABLE_KEY, type StorageLike } from './persistence.ts';
import { createEmptyProgress } from './schema.ts';
import { connectPersistence, createProgressStore } from './store.ts';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  failWrites = false;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('quota', 'QuotaExceededError');
    this.data.set(key, value);
  }
}

class FakeWindow extends EventTarget {}

const lesson = { id: 'css.box-model', version: 1, challengeIds: ['a'], boss: false };

describe('progress store persistence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('writes debounced (300 ms) after a change', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore({ storage });
    connectPersistence(store, storage, new FakeWindow());

    store.getState().recordPass(lesson, 'a', 10);
    store.getState().updateSettings({ freeRoam: true });
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    vi.advanceTimersByTime(300);
    const saved = JSON.parse(storage.getItem(PROGRESS_KEY) ?? '{}');
    expect(saved.settings.freeRoam).toBe(true);
    expect(saved.lessons['css.box-model'].completedAt).toBeDefined();
  });

  it('flushes immediately on pagehide', () => {
    const storage = new MemoryStorage();
    const target = new FakeWindow();
    const store = createProgressStore({ storage });
    connectPersistence(store, storage, target);
    store.getState().skipRecommendations('cs');
    target.dispatchEvent(new Event('pagehide'));
    expect(storage.getItem(PROGRESS_KEY)).toContain('"cs"');
  });

  it('keeps working in memory and flags the failure when storage is full', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const store = createProgressStore({ storage });
    connectPersistence(store, storage, new FakeWindow());
    store.getState().updateSettings({ editorFontSize: 18 });
    vi.advanceTimersByTime(300);
    expect(store.getState().saveFailed).toBe(true);
    expect(store.getState().progress.settings.editorFontSize).toBe(18);

    storage.failWrites = false;
    store.getState().updateSettings({ editorFontSize: 16 });
    vi.advanceTimersByTime(300);
    expect(store.getState().saveFailed).toBe(false);
  });

  it('loads saved progress and sets unreadable data aside instead of deleting it', () => {
    const storage = new MemoryStorage();
    const saved = { ...createEmptyProgress(new Date()), lastCelebratedLevel: 4 };
    storage.setItem(PROGRESS_KEY, JSON.stringify(saved));
    expect(createProgressStore({ storage }).getState().progress.lastCelebratedLevel).toBe(4);

    storage.setItem(PROGRESS_KEY, '{"schemaVersion":1,"lessons":"nope"}');
    const store = createProgressStore({ storage });
    expect(store.getState().recoveredFromError).toContain('damaged');
    expect(storage.getItem(UNREADABLE_KEY)).toBe('{"schemaVersion":1,"lessons":"nope"}');
    expect(store.getState().progress.lessons).toEqual({});
  });

  it('syncs from other tabs without writing back', () => {
    const storage = new MemoryStorage();
    const target = new FakeWindow();
    const store = createProgressStore({ storage });
    connectPersistence(store, storage, target);
    const other = { ...createEmptyProgress(new Date()), skippedRecommendations: ['cs'] };
    const event = new Event('storage') as StorageEvent;
    Object.assign(event, { key: PROGRESS_KEY, newValue: JSON.stringify(other) });
    target.dispatchEvent(event);
    expect(store.getState().progress.skippedRecommendations).toEqual(['cs']);
    vi.advanceTimersByTime(1000);
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it('reset clears progress but keeps settings', () => {
    const store = createProgressStore();
    store.getState().updateSettings({ freeRoam: true });
    store.getState().recordPass(lesson, 'a', 10);
    store.getState().resetProgress();
    expect(store.getState().progress.lessons).toEqual({});
    expect(store.getState().progress.settings.freeRoam).toBe(true);
  });
});
