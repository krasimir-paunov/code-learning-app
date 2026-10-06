import { describe, expect, it } from 'vitest';
import { advance, clampIndex, shouldAnnounce } from './player-math.ts';

describe('advance', () => {
  it('takes whole steps and carries the remainder', () => {
    expect(advance(0, 250, 2, 10)).toEqual({ index: 0, carry: 250, finished: false });
    expect(advance(0, 500, 2, 10)).toEqual({ index: 1, carry: 0, finished: false });
    expect(advance(3, 1600, 2, 10)).toEqual({ index: 6, carry: 100, finished: false });
  });

  it('runs several steps per frame at high speed and stops at the end', () => {
    expect(advance(0, 16, 1000, 5000).index).toBe(16);
    expect(advance(4990, 1000, 1000, 5000)).toEqual({ index: 5000, carry: 0, finished: true });
  });
});

describe('clampIndex', () => {
  it('keeps the index inside 0..length', () => {
    expect(clampIndex(-2, 9)).toBe(0);
    expect(clampIndex(12, 9)).toBe(9);
    expect(clampIndex(4.6, 9)).toBe(5);
  });
});

describe('shouldAnnounce', () => {
  it('announces every manual step but rate-limits playback', () => {
    expect(shouldAnnounce(100, 90, false)).toBe(true);
    expect(shouldAnnounce(1000, 0, true)).toBe(false);
    expect(shouldAnnounce(1600, 0, true)).toBe(true);
  });
});
