import { describe, expect, it } from 'vitest';
import { lineCount, patternCss } from './model.ts';

describe('patternCss', () => {
  it('adds only the switched-on declarations after the base', () => {
    const toggles = [
      { selector: '.nav', declaration: 'flex-wrap: wrap', without: '' },
      { selector: '.cta', declaration: 'margin-inline-start: auto', without: '' },
    ];
    expect(patternCss('.nav { display: flex; }', toggles, new Set([1]))).toBe(
      '.nav { display: flex; }\n.cta { margin-inline-start: auto; }',
    );
  });
});

describe('lineCount', () => {
  it('groups items whose tops line up', () => {
    expect(lineCount([0, 0, 1, 40, 41, 80])).toBe(3);
    expect(lineCount([])).toBe(0);
  });
});
