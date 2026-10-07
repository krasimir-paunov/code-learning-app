import { describe, expect, it } from 'vitest';
import { position, radioGroups, tabStops, type Radio } from './model.ts';

const shared: Radio[] = [
  { name: 'speed', label: 'Standard' },
  { name: 'speed', label: 'Express' },
  { name: 'speed', label: 'Same day' },
];
const unnamed: Radio[] = shared.map((r) => ({ ...r, name: null }));

describe('radioGroups', () => {
  it('groups radios by name', () => {
    expect(radioGroups(shared)).toHaveLength(1);
  });

  it('keeps every unnamed radio on its own', () => {
    expect(radioGroups(unnamed)).toHaveLength(3);
  });
});

describe('tabStops', () => {
  it('is one stop for a named group, one per radio without names', () => {
    expect(tabStops(shared)).toBe(1);
    expect(tabStops(unnamed)).toBe(3);
  });
});

describe('position', () => {
  it('counts within the group', () => {
    expect(position(shared, 1)).toEqual({ pos: 2, size: 3 });
    expect(position(unnamed, 1)).toEqual({ pos: 1, size: 1 });
  });
});
