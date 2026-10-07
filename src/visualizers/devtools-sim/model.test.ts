// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseRules } from '../shared/css/rules.ts';
import { keyOf, matchedRules } from '../shared/css/matched.ts';
import { elementLabel } from './model.ts';

document.body.innerHTML =
  '<article class="card"><p class="price" id="cost">€89</p><button class="buy">Add</button></article>';
const price = document.querySelector('.price') as Element;
const rules = parseRules(`
  .price { color: gray; font-weight: 700; }
  p { margin: 0; color: black; }
  .card .price { color: orange; }
  .buy, #cost { padding: 4px; }
`);

describe('matchedRules', () => {
  it('lists matching rules most specific first and crosses out losers', () => {
    const matched = matchedRules(price, rules, new Map(), new Set());
    expect(matched.map((r) => r.selector)).toEqual(['.buy, #cost', '.card .price', '.price', 'p']);
    expect(matched[0]?.specificity).toEqual([1, 0, 0]);
    const color = (selector: string) =>
      matched
        .find((r) => r.selector === selector)
        ?.declarations.find((d) => d.property === 'color');
    expect(color('.card .price')?.overridden).toBe(false);
    expect(color('.price')?.overridden).toBe(true);
    expect(color('p')?.overridden).toBe(true);
  });

  it('lets the next rule win when the winner is disabled, and shows edited values', () => {
    const matched = matchedRules(
      price,
      rules,
      new Map([[keyOf(0, 'color'), 'tomato']]),
      new Set([keyOf(2, 'color')]),
    );
    const byIndex = (i: number) => matched.find((r) => r.index === i)?.declarations[0];
    expect(byIndex(2)).toMatchObject({ enabled: false, overridden: false });
    expect(byIndex(0)).toMatchObject({ value: 'tomato', overridden: false });
  });

  it('ignores rules that do not match', () => {
    const button = document.querySelector('.buy') as Element;
    expect(matchedRules(button, rules, new Map(), new Set()).map((r) => r.selector)).toEqual([
      '.buy, #cost',
    ]);
  });
});

describe('elementLabel', () => {
  it('writes tag, id and classes like DevTools', () => {
    expect(elementLabel(price)).toBe('p#cost.price');
  });
});
