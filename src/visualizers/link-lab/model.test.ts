import { describe, expect, it } from 'vitest';
import { analyzeLink, toMarkup, type LinkInput } from './model.ts';

const PAGE = 'https://shop.example/products/shoes.html';
const link = (over: Partial<LinkInput>): LinkInput => ({
  href: '',
  text: 'Trail shoes',
  newTab: false,
  download: false,
  ...over,
});

describe('analyzeLink', () => {
  it('resolves absolute and relative pages', () => {
    expect(analyzeLink(link({ href: 'https://example.org/docs' }), PAGE)).toMatchObject({
      kind: 'page',
      resolved: 'https://example.org/docs',
    });
    expect(analyzeLink(link({ href: 'bags.html' }), PAGE).resolved).toBe(
      'https://shop.example/products/bags.html',
    );
  });

  it('recognises fragments on the same page', () => {
    const out = analyzeLink(link({ href: '#reviews' }), PAGE);
    expect(out.kind).toBe('fragment');
    expect(out.steps[0]).toContain('id="reviews"');
    expect(analyzeLink(link({ href: '#prices' }), PAGE, ['reviews']).steps[0]).toContain(
      'No element has id="prices"',
    );
  });

  it('reads mailto addresses and subjects', () => {
    const out = analyzeLink(link({ href: 'mailto:help@shop.example?subject=Order%2042' }), PAGE);
    expect(out.kind).toBe('email');
    expect(out.steps.join(' ')).toContain('help@shop.example');
    expect(out.steps.join(' ')).toContain('"Order 42"');
  });

  it('explains noopener for new tabs and the same-origin rule for downloads', () => {
    expect(analyzeLink(link({ href: '/sale', newTab: true }), PAGE).steps.join(' ')).toContain(
      'rel="noopener"',
    );
    expect(
      analyzeLink(link({ href: '/files/size-guide.pdf', download: true }), PAGE).steps[0],
    ).toContain('Saves size-guide.pdf');
    expect(
      analyzeLink(link({ href: 'https://cdn.example/guide.pdf', download: true }), PAGE)
        .warnings[0],
    ).toContain('same-origin');
  });

  it('warns about missing schemes and vague text', () => {
    const out = analyzeLink(link({ href: 'www.example.com', text: 'click here' }), PAGE);
    expect(out.resolved).toBe('https://shop.example/products/www.example.com');
    expect(out.warnings).toHaveLength(2);
    expect(analyzeLink(link({}), PAGE).kind).toBe('none');
  });
});

describe('toMarkup', () => {
  it('writes only the attributes in use', () => {
    expect(toMarkup(link({ href: '/a', newTab: true }))).toBe(
      '<a href="/a" target="_blank">Trail shoes</a>',
    );
  });
});
