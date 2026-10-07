import { describe, expect, it } from 'vitest';
import { breakpoints, matches, parseQuery } from './model.ts';

describe('matches', () => {
  it('reads min-width and max-width', () => {
    expect(matches('(min-width: 40rem)', 640)).toBe(true);
    expect(matches('(min-width: 40rem)', 639)).toBe(false);
    expect(matches('(max-width: 600px)', 600)).toBe(true);
  });

  it('reads the range syntax', () => {
    expect(matches('(width >= 48rem)', 768)).toBe(true);
    expect(matches('(width < 48rem)', 768)).toBe(false);
    expect(matches('(40rem <= width < 64rem)', 1023)).toBe(true);
    expect(matches('(40rem <= width < 64rem)', 1024)).toBe(false);
  });

  it('combines conditions with and', () => {
    expect(matches('(min-width: 40rem) and (max-width: 63.99rem)', 700)).toBe(true);
  });

  it('refuses queries it cannot evaluate', () => {
    expect(parseQuery('(orientation: portrait)')).toBeNull();
  });
});

describe('breakpoints', () => {
  it('collects every width the queries mention, in px', () => {
    expect(breakpoints(['(min-width: 40rem)', '(40rem <= width < 64rem)'])).toEqual([640, 1024]);
  });
});
