import { describe, expect, it } from 'vitest';
import { decide, ruleSpecificity, type Contender } from './model.ts';

const rule = (selector: string, order: number, important = false): Contender => ({
  label: selector,
  specificity: ruleSpecificity(selector),
  important,
  order,
});
const inline = (important = false): Contender => ({
  label: 'style attribute',
  specificity: null,
  important,
  order: 99,
});

describe('ruleSpecificity', () => {
  it('counts only the selectors in a list that match', () => {
    expect(ruleSpecificity('#nope, .btn', (s) => s === '.btn')).toEqual([0, 1, 0]);
    expect(ruleSpecificity('#nope, .btn')).toEqual([1, 0, 0]);
  });
});

describe('decide', () => {
  it('higher specificity wins regardless of order', () => {
    expect(decide([rule('.card .btn', 0), rule('.btn', 1)])).toMatchObject({
      winner: 0,
      decider: 'classes',
    });
    expect(decide([rule('#buy', 0), rule('.card .btn.primary', 1)])).toMatchObject({
      winner: 0,
      decider: 'ids',
    });
  });

  it('a type selector loses to one class even with ten types', () => {
    expect(
      decide([rule('html body div main section article div p button', 0), rule('.btn', 1)]),
    ).toMatchObject({ winner: 1, decider: 'classes' });
  });

  it('ties go to the later rule', () => {
    expect(decide([rule('.btn', 0), rule('.primary', 1)])).toMatchObject({
      winner: 1,
      decider: 'order',
    });
  });

  it('!important beats specificity, and then specificity decides between important rules', () => {
    expect(decide([rule('#buy', 0), rule('button', 1, true)])).toMatchObject({
      winner: 1,
      decider: 'important',
    });
    expect(decide([rule('#buy', 0, true), rule('.btn', 1, true)])).toMatchObject({
      winner: 0,
      decider: 'ids',
    });
  });

  it('inline styles beat selectors, but lose to !important rules', () => {
    expect(decide([rule('#buy', 0), inline()])).toMatchObject({ winner: 1, decider: 'inline' });
    expect(decide([rule('.btn', 0, true), inline()])).toMatchObject({
      winner: 0,
      decider: 'important',
    });
    expect(decide([rule('#buy', 0, true), inline(true)])).toMatchObject({
      winner: 1,
      decider: 'inline',
    });
  });

  it(':where() counts nothing', () => {
    expect(decide([rule(':where(#buy)', 1), rule('button', 0)])).toMatchObject({
      winner: 1,
      decider: 'types',
    });
  });
});
