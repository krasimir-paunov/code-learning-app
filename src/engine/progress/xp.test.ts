import { describe, expect, it } from 'vitest';
import { challengeXp, completionXp, levelForXp, levelProgress, xpForLevel } from './xp.ts';

describe('challengeXp', () => {
  it('gives ×1.5 (rounded) for a first attempt without hints', () => {
    expect(challengeXp({ base: 10, attempts: 1, hintsUsed: 0, revealed: false })).toBe(15);
    expect(challengeXp({ base: 5, attempts: 1, hintsUsed: 0, revealed: false })).toBe(8);
  });

  it('gives the base value after a failed attempt', () => {
    expect(challengeXp({ base: 20, attempts: 3, hintsUsed: 0, revealed: false })).toBe(20);
  });

  it('takes 25% per hint, never below 25%, and loses the first-try bonus', () => {
    expect(challengeXp({ base: 20, attempts: 1, hintsUsed: 1, revealed: false })).toBe(15);
    expect(challengeXp({ base: 20, attempts: 1, hintsUsed: 2, revealed: false })).toBe(10);
    expect(challengeXp({ base: 20, attempts: 1, hintsUsed: 3, revealed: false })).toBe(5);
    expect(challengeXp({ base: 20, attempts: 1, hintsUsed: 9, revealed: false })).toBe(5);
  });

  it('gives nothing once the solution was revealed', () => {
    expect(challengeXp({ base: 20, attempts: 1, hintsUsed: 0, revealed: true })).toBe(0);
  });
});

describe('levels', () => {
  it('follows 50 · L · (L − 1) cumulative XP', () => {
    expect([1, 2, 3, 5, 10].map(xpForLevel)).toEqual([0, 100, 300, 1000, 4500]);
  });

  it('maps XP to levels at the boundaries', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(4500)).toBe(10);
  });

  it('reports progress inside the current level', () => {
    expect(levelProgress(200)).toEqual({ level: 2, into: 100, span: 200, fraction: 0.5 });
  });

  it('rewards boss lessons more', () => {
    expect(completionXp(false)).toBe(20);
    expect(completionXp(true)).toBe(100);
  });
});
