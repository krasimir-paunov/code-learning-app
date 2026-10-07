import { describe, expect, it } from 'vitest';
import { areaNames, brokenAreas, paint, templateAreas, type AreaMap } from './model.ts';

const page: AreaMap = [
  ['header', 'header'],
  ['nav', 'main'],
  ['footer', 'footer'],
];

describe('templateAreas', () => {
  it('writes one quoted string per row', () => {
    expect(templateAreas(page)).toBe('"header header"\n"nav main"\n"footer footer"');
  });
});

describe('areaNames', () => {
  it('lists each name once and skips empty cells', () => {
    expect(
      areaNames([
        ['a', '.'],
        ['a', 'b'],
      ]),
    ).toEqual(['a', 'b']);
  });
});

describe('brokenAreas', () => {
  it('accepts rectangles', () => {
    expect(brokenAreas(page)).toEqual([]);
  });

  it('rejects L shapes and split areas', () => {
    expect(
      brokenAreas([
        ['a', 'a'],
        ['a', 'b'],
      ]),
    ).toEqual(['a']);
    expect(brokenAreas([['a', 'b', 'a']])).toEqual(['a']);
  });
});

describe('paint', () => {
  it('changes one cell and leaves the original map alone', () => {
    const next = paint(page, 1, 0, 'main');
    expect(next[1]).toEqual(['main', 'main']);
    expect(page[1]).toEqual(['nav', 'main']);
  });
});
