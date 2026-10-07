import { describe, expect, it } from 'vitest';
import { addEntry, BEHAVIOR } from './model.ts';

describe('BEHAVIOR', () => {
  it('keeps divs out of the Tab order', () => {
    expect(BEHAVIOR.div.tab).toBe(false);
    expect(BEHAVIOR.button.tab).toBe(true);
  });

  it('activates links with Enter only', () => {
    expect(BEHAVIOR.link.space).toMatch(/^nothing/);
  });
});

describe('addEntry', () => {
  it('keeps the latest entries in the order they happened', () => {
    let log = addEntry([], 'a', 2);
    log = addEntry(log, 'b', 2);
    log = addEntry(log, 'c', 2);
    expect(log.map((e) => e.text)).toEqual(['b', 'c']);
    expect(log.at(-1)?.id).toBe(3);
  });
});
