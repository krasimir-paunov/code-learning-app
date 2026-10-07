import { describe, expect, it } from 'vitest';
import { distribute, type FlexItem } from './model.ts';

const item = (
  grow: number,
  shrink: number,
  basis: number,
  extra: Partial<FlexItem> = {},
): FlexItem => ({
  grow,
  shrink,
  basis,
  min: 0,
  ...extra,
});
const sizes = (items: FlexItem[], container: number, gap = 0) =>
  distribute(items, container, gap).items.map((r) => Math.round(r.size * 100) / 100);

// Every expected list is what Chromium rendered for the same flex items.
describe('distribute', () => {
  it('shares free space by flex-grow', () => {
    expect(sizes([item(1, 1, 100), item(2, 1, 100), item(0, 1, 100)], 500)).toEqual([
      166.67, 233.33, 100,
    ]);
  });

  it('subtracts gaps before sharing', () => {
    expect(sizes([item(1, 1, 100), item(2, 1, 100), item(0, 1, 100)], 500, 10)).toEqual([
      160, 220, 100,
    ]);
  });

  it('shrinks equal items equally', () => {
    expect(sizes([item(0, 1, 200), item(0, 1, 200)], 300)).toEqual([150, 150]);
  });

  it('weights shrinking by flex-basis', () => {
    expect(sizes([item(0, 1, 300), item(0, 1, 100)], 300)).toEqual([225, 75]);
  });

  it('freezes an item at its minimum and shrinks the others more', () => {
    const result = distribute([item(0, 1, 200), item(0, 1, 200, { min: 180 })], 200);
    expect(result.items.map((r) => r.size)).toEqual([20, 180]);
    expect(result.items[1]?.clamped).toBe('min');
  });

  it('uses only part of the free space when grow factors add up to less than 1', () => {
    expect(sizes([item(0.25, 1, 100), item(0.25, 1, 100)], 400)).toEqual([150, 150]);
  });

  it('caps an item at its maximum and gives the rest to the others', () => {
    expect(sizes([item(1, 1, 100, { max: 150 }), item(1, 1, 100)], 500)).toEqual([150, 350]);
  });

  it('never shrinks an item with flex-shrink 0', () => {
    expect(sizes([item(0, 0, 200), item(0, 1, 200)], 300)).toEqual([200, 100]);
  });

  it('holds an inflexible item at a minimum above its basis and shares only the rest', () => {
    // Chromium: 138.9, 177.8 and 183.4 for a long word whose min-content beats its 120px basis.
    const result = distribute(
      [item(1, 1, 100), item(2, 1, 100), item(0, 1, 120, { min: 183.4 })],
      500,
    );
    expect(result.freeSpace).toBeCloseTo(116.6);
    expect(result.items.map((r) => Math.round(r.size * 10) / 10)).toEqual([138.9, 177.7, 183.4]);
    expect(result.items[2]?.clamped).toBe('min');
  });

  it('reports the free space and the mode', () => {
    expect(distribute([item(1, 1, 100)], 300)).toMatchObject({ freeSpace: 200, mode: 'grow' });
    expect(distribute([item(1, 1, 400)], 300)).toMatchObject({ freeSpace: -100, mode: 'shrink' });
  });
});
