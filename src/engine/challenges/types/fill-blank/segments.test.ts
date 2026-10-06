import { describe, expect, it } from 'vitest';
import { sentinel, splitLine } from './segments.ts';

describe('splitLine', () => {
  it('splits inside a colored span and keeps both halves balanced', () => {
    const html = `<span style="c:1">width: </span><span style="c:2">${sentinel('w')};</span>`;
    expect(splitLine(html, ['w'])).toEqual([
      { html: '<span style="c:1">width: </span>' },
      { blank: 'w' },
      { html: '<span style="c:2">;</span>' },
    ]);
  });

  it('handles several blanks on one line, including mid-span text', () => {
    const html = `<span style="a">x ${sentinel('one')} y ${sentinel('two-b')} z</span>`;
    expect(splitLine(html, ['one', 'two-b'])).toEqual([
      { html: '<span style="a">x </span>' },
      { blank: 'one' },
      { html: '<span style="a"> y </span>' },
      { blank: 'two-b' },
      { html: '<span style="a"> z</span>' },
    ]);
  });

  it('leaves lines without blanks untouched', () => {
    expect(splitLine('<span style="a">plain</span>', ['w'])).toEqual([
      { html: '<span style="a">plain</span>' },
    ]);
  });
});
