import { describe, expect, it } from 'vitest';
import { recommend, verdict } from './model.ts';

const cards = {
  better: 'grid' as const,
  why: 'Columns line up.',
  instead: 'Lines lay out on their own.',
};

describe('verdict', () => {
  it('explains the better choice and what goes wrong with the other', () => {
    expect(verdict(cards, 'grid')).toEqual({ fits: true, text: 'Columns line up.' });
    expect(verdict(cards, 'flex')).toEqual({ fits: false, text: 'Lines lay out on their own.' });
  });
});

describe('recommend', () => {
  it('picks grid when items must line up in rows and columns', () => {
    expect(recommend({ twoDirections: true, sizeFromContent: true })).toBe('grid');
  });

  it('picks flex for a single line that sizes from its content', () => {
    expect(recommend({ twoDirections: false, sizeFromContent: true })).toBe('flex');
  });

  it('picks grid when the layout sets the sizes, even in one direction', () => {
    expect(recommend({ twoDirections: false, sizeFromContent: false })).toBe('grid');
  });
});
