import { describe, expect, it } from 'vitest';
import { frMath, linePositions, parseTrack } from './model.ts';

const tracks = (text: string) => text.split(' ').map(parseTrack);
const sizes = (text: string, width: number, gap = 0) => frMath(tracks(text), width, gap).sizes;

describe('parseTrack', () => {
  it('reads px and fr, and leaves everything else to the browser', () => {
    expect(parseTrack('200px')).toEqual({ kind: 'px', px: 200 });
    expect(parseTrack('1.5fr')).toEqual({ kind: 'fr', fr: 1.5 });
    expect(parseTrack('auto')).toEqual({ kind: 'other', text: 'auto' });
  });
});

// Expected sizes are Chromium's (it rounds to 1/64px, hence the tolerance).
describe('frMath', () => {
  it('gives fixed tracks their size and splits the rest by fr', () => {
    const [a, b, c] = sizes('200px 1fr 2fr', 600);
    expect(a).toBe(200);
    expect(b).toBeCloseTo(133.33, 1);
    expect(c).toBeCloseTo(266.67, 1);
  });

  it('takes the gaps off before sharing', () => {
    expect(sizes('200px 1fr 2fr', 600, 20)).toEqual([200, 120, 240]);
  });

  it('only shares part of the space when the fr values add up to less than 1', () => {
    expect(sizes('0.25fr 0.25fr', 400)).toEqual([100, 100]);
  });

  it('marks content-sized tracks for the browser to fill in', () => {
    expect(sizes('auto 1fr', 400)[0]).toBeNull();
  });

  it('reports the numbers behind the split', () => {
    expect(frMath(tracks('200px 1fr 2fr'), 600, 20)).toMatchObject({
      fixed: 200,
      gaps: 40,
      free: 360,
      totalFr: 3,
      perFr: 120,
    });
  });
});

describe('linePositions', () => {
  it('puts lines at both edges and through the middle of each gap', () => {
    expect(linePositions([200, 120, 240], 20)).toEqual([0, 210, 350, 600]);
  });
});
