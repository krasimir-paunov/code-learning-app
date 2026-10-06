// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseFormula, table } from './model.ts';

describe('parseFormula', () => {
  it.each([
    ['odd', { a: 2, b: 1 }],
    ['even', { a: 2, b: 0 }],
    ['3', { a: 0, b: 3 }],
    ['2n', { a: 2, b: 0 }],
    ['2n+1', { a: 2, b: 1 }],
    [' 3n - 2 ', { a: 3, b: -2 }],
    ['n+4', { a: 1, b: 4 }],
    ['-n+3', { a: -1, b: 3 }],
  ])('%s', (text, expected) => {
    expect(parseFormula(text)).toEqual(expected);
  });

  it('rejects anything else', () => {
    expect(parseFormula('2x')).toBeNull();
    expect(parseFormula('n+')).toBeNull();
  });
});

describe('table', () => {
  document.body.innerHTML = `<ul>${'<li></li>'.repeat(12)}</ul>`;
  const items: Element[] = Array.from(document.querySelectorAll('li'));

  it.each(['odd', 'even', '3', '2n', '2n+1', '3n-2', 'n+4', '-n+3', '0n+5', '-2n+7'])(
    '%s agrees with the selector engine',
    (text) => {
      const formula = parseFormula(text);
      if (!formula) throw new Error('unparsed');
      const expected = Array.from(document.querySelectorAll(`li:nth-child(${text})`)).map(
        (li) => items.indexOf(li) + 1,
      );
      const selected = table(formula, 12)
        .filter((row) => row.selects)
        .map((row) => row.value)
        .sort((x, y) => x - y);
      expect(selected).toEqual(expected);
    },
  );
});

describe('table rows', () => {
  it('shows n, the value and whether it lands on an item', () => {
    expect(table({ a: -1, b: 3 }, 10)).toEqual([
      { n: 0, value: 3, selects: true },
      { n: 1, value: 2, selects: true },
      { n: 2, value: 1, selects: true },
      { n: 3, value: 0, selects: false },
    ]);
    expect(table({ a: 0, b: 4 }, 10)).toEqual([{ n: 0, value: 4, selects: true }]);
  });
});
