import { describe, expect, it } from 'vitest';
import { alignmentFor, placeOf, pushMargin } from './model.ts';

describe('alignmentFor', () => {
  it('maps horizontal to justify-content in a row', () => {
    expect(alignmentFor('row', 'end', 'center')).toEqual({
      justifyContent: 'end',
      alignItems: 'center',
    });
  });

  it('swaps the roles in a column', () => {
    expect(alignmentFor('column', 'end', 'center')).toEqual({
      justifyContent: 'center',
      alignItems: 'end',
    });
  });
});

describe('placeOf', () => {
  it('inverts alignmentFor', () => {
    for (const direction of ['row', 'column'] as const) {
      expect(placeOf(direction, alignmentFor(direction, 'start', 'end'))).toEqual({
        horizontal: 'start',
        vertical: 'end',
      });
    }
  });

  it('has no single place along the main axis when items are spread', () => {
    expect(placeOf('row', { justifyContent: 'space-between', alignItems: 'center' })).toEqual({
      horizontal: null,
      vertical: 'center',
    });
  });
});

describe('pushMargin', () => {
  it('uses the margin on the main-axis start side', () => {
    expect(pushMargin('row')).toBe('margin-inline-start');
    expect(pushMargin('column')).toBe('margin-block-start');
  });
});
