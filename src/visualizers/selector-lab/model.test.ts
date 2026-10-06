import { describe, expect, it } from 'vitest';
import { describeSelector } from './model.ts';

describe('describeSelector', () => {
  it.each([
    ['p', 'Every p.'],
    ['.price', 'Every element with class price.'],
    ['#cart', 'Every element with id cart.'],
    ['article p', 'Every p inside an article.'],
    ['article > p.intro', 'Every p with class intro that is a direct child of an article.'],
    ['h2 + p', 'Every p that comes right after an h2 (same parent).'],
    ['h2 ~ p', 'Every p that comes somewhere after an h2 (same parent).'],
    ['a[href^="https"]', 'Every a whose href starts with "https".'],
    ['a[href$=".pdf"]', 'Every a whose href ends with ".pdf".'],
    ['input[required]', 'Every input that has a required attribute.'],
    ['ul li > a', 'Every a that is a direct child of an li inside a ul.'],
    ['.post.featured h2', 'Every h2 inside an element with class post and featured.'],
    ['h1, h2', 'Every h1, and also every h2.'],
    ['a:hover', 'Every a that is :hover.'],
    ['p::first-line', 'The ::first-line of every p.'],
  ])('%s', (selector, expected) => {
    expect(describeSelector(selector)).toBe(expected);
  });

  it('gives up on syntax it does not cover', () => {
    expect(describeSelector('p >')).toBeNull();
    expect(describeSelector('p!')).toBeNull();
  });
});
