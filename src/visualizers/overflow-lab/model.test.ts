import { describe as group, expect, it } from 'vitest';
import { describe, ellipsisMissing, ellipsisResult, FACTS, OVERFLOWS } from './model.ts';

group('FACTS', () => {
  it('lets only visible content escape the box', () => {
    expect(OVERFLOWS.filter((o) => !FACTS[o].clips)).toEqual(['visible']);
  });

  it('separates clip from hidden by scrollability', () => {
    expect(FACTS.hidden.scrollContainer).toBe(true);
    expect(FACTS.clip.scrollContainer).toBe(false);
    expect(FACTS.hidden.userScroll).toBe(false);
  });

  it('lets users scroll only scroll and auto', () => {
    expect(OVERFLOWS.filter((o) => FACTS[o].userScroll)).toEqual(['scroll', 'auto']);
  });
});

group('describe', () => {
  it('asks for a smaller box when nothing overflows', () => {
    expect(describe('hidden', false)).toMatch(/Make the box smaller/);
  });

  it('notes that scroll reserves scrollbars even when content fits', () => {
    expect(describe('scroll', false)).toMatch(/reserves room/);
  });

  it('explains spilling for visible overflow', () => {
    expect(describe('visible', true)).toMatch(/spills out/);
  });
});

group('ellipsis', () => {
  const all = { nowrap: true, hidden: true, ellipsis: true };

  it('needs all three declarations', () => {
    expect(ellipsisMissing(all)).toEqual([]);
    expect(ellipsisMissing({ ...all, nowrap: false, ellipsis: false })).toEqual([
      'white-space: nowrap',
      'text-overflow: ellipsis',
    ]);
  });

  it('explains the first missing piece', () => {
    expect(ellipsisResult({ ...all, nowrap: false })).toMatch(/wraps/);
    expect(ellipsisResult({ ...all, hidden: false })).toMatch(/spills out/);
    expect(ellipsisResult({ ...all, ellipsis: false })).toMatch(/no sign/);
    expect(ellipsisResult(all)).toMatch(/…/);
  });
});
