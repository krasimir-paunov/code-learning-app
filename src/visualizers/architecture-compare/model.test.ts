import { describe, expect, it } from 'vitest';
import { changedLines, diffLines } from './model.ts';

describe('diffLines', () => {
  it('marks unchanged, added and removed lines', () => {
    expect(diffLines('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'del', text: 'b' },
      { kind: 'add', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'add', text: 'd' },
    ]);
  });

  it('finds nothing to change in identical text', () => {
    expect(changedLines(diffLines('x\ny', 'x\ny'))).toBe(0);
  });

  it('handles an empty starting file', () => {
    expect(diffLines('', 'new').map((l) => l.kind)).toEqual(['del', 'add']);
  });
});
