import { describe, expect, it } from 'vitest';
import { parseRules } from './rules.ts';
import { compareSpecificity, specificity, splitSelectorList } from './specificity.ts';

describe('specificity', () => {
  it.each([
    ['*', [0, 0, 0]],
    ['p', [0, 0, 1]],
    ['.price', [0, 1, 0]],
    ['#cart', [1, 0, 0]],
    ['.card .price', [0, 2, 0]],
    ['article > p.price', [0, 1, 2]],
    ['a[href^="https"]:hover', [0, 2, 1]],
    ['ul li:nth-child(2n + 1)', [0, 1, 2]],
    ['p::first-line', [0, 0, 2]],
    ['p:first-line', [0, 0, 2]],
    ['#nav .item a', [1, 1, 1]],
    [':is(#a, .b) p', [1, 0, 1]],
    [':where(#a, .b) p', [0, 0, 1]],
    ['.card:not(.featured, #hero)', [1, 1, 0]],
    ['li:nth-child(odd of .item)', [0, 2, 1]],
    ['.card:has(> img)', [0, 1, 1]],
  ] as const)('%s is %j', (selector, expected) => {
    expect(specificity(selector)).toEqual(expected);
  });

  it('compares a then b then c', () => {
    expect(compareSpecificity([1, 0, 0], [0, 9, 9])).toBeGreaterThan(0);
    expect(compareSpecificity([0, 1, 0], [0, 0, 12])).toBeGreaterThan(0);
    expect(compareSpecificity([0, 1, 1], [0, 1, 1])).toBe(0);
  });

  it('splits selector lists only at top-level commas', () => {
    expect(splitSelectorList('h1, :is(h2, h3), a[title="a,b"]')).toEqual([
      'h1',
      ':is(h2, h3)',
      'a[title="a,b"]',
    ]);
  });
});

describe('parseRules', () => {
  it('keeps declarations as written, shorthands and !important included', () => {
    const rules = parseRules(`
      /* card */
      .card { padding: 8px 16px; border: 1px solid #333 }
      .card .price{color:#ffb454 !important;}
    `);
    expect(rules).toEqual([
      {
        selector: '.card',
        declarations: [
          { property: 'padding', value: '8px 16px', important: false },
          { property: 'border', value: '1px solid #333', important: false },
        ],
      },
      {
        selector: '.card .price',
        declarations: [{ property: 'color', value: '#ffb454', important: true }],
      },
    ]);
  });
});
