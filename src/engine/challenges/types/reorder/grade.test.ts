import { describe, expect, it } from 'vitest';
import { shuffledOrder } from './build.ts';
import { gradeReorder, type ReorderSpec } from './index.ts';

const spec: ReorderSpec = {
  items: [],
  orders: [
    ['a', 'b', 'c', 'd'],
    ['a', 'c', 'b', 'd'],
  ],
  distractors: ['x'],
  code: false,
};

describe('reorder grading', () => {
  it('accepts the order and any listed alternative', () => {
    expect(gradeReorder(spec, { order: ['a', 'b', 'x', 'c', 'd'], excluded: ['x'] }).passed).toBe(
      true,
    );
    expect(gradeReorder(spec, { order: ['x', 'a', 'c', 'b', 'd'], excluded: ['x'] }).passed).toBe(
      true,
    );
  });

  it('counts correct positions against the closest accepted order', () => {
    expect(gradeReorder(spec, { order: ['a', 'd', 'b', 'c', 'x'], excluded: ['x'] })).toMatchObject(
      {
        passed: false,
        feedback: '2 of 4 are in the right place. The first one out of place is highlighted.',
        highlight: { ids: ['d'] },
      },
    );
  });

  it('requires distractors to be marked "not needed" and nothing else', () => {
    expect(
      gradeReorder(spec, { order: ['a', 'b', 'c', 'd', 'x'], excluded: [] }).feedback,
    ).toContain('does not belong');
    expect(
      gradeReorder(spec, { order: ['a', 'b', 'c', 'd', 'x'], excluded: ['x', 'b'] }).feedback,
    ).toContain('part of the answer');
  });
});

describe('shuffledOrder', () => {
  it('is deterministic and never starts solved', () => {
    const ids = ['a', 'b', 'c'];
    const once = shuffledOrder(ids, 'layers', [ids]);
    expect(shuffledOrder(ids, 'layers', [ids])).toEqual(once);
    expect(once).not.toEqual(ids);
    expect([...once].sort()).toEqual(ids);
  });
});
