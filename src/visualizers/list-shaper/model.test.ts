// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { indent, maxDepthAt, move, summarize, toHtml, type Item } from './model.ts';

const menu: Item[] = [
  { text: 'Home', depth: 0, href: '/' },
  { text: 'Shop', depth: 0, href: '/shop' },
  { text: 'Shoes', depth: 1, href: '/shop/shoes' },
  { text: 'Bags', depth: 1, href: '/shop/bags' },
  { text: 'About', depth: 0, href: '/about' },
];

describe('toHtml', () => {
  it('puts a nested list inside the li it belongs to', () => {
    const html = toHtml(menu, 'ul', 'ul');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('ul > ul')).toHaveLength(0);
    expect(doc.querySelectorAll('body > ul > li')).toHaveLength(3);
    const nested = doc.querySelector('li > ul');
    expect(nested?.parentElement?.firstElementChild?.textContent).toBe('Shop');
    expect(nested?.querySelectorAll('li')).toHaveLength(2);
  });

  it('writes ol at the chosen levels and a flat dl of terms and descriptions', () => {
    expect(toHtml(menu.slice(1, 3), 'ol', 'ul').startsWith('<ol>')).toBe(true);
    expect(toHtml(menu.slice(1, 3), 'ul', 'ol')).toContain('    <ol>');
    expect(
      toHtml(
        [
          { text: 'HTML', depth: 0 },
          { text: 'Structure', depth: 1 },
        ],
        'dl',
        'ul',
      ),
    ).toBe('<dl>\n  <dt>HTML</dt>\n  <dd>Structure</dd>\n</dl>');
  });
});

describe('editing', () => {
  it('never indents more than one level below the item above, nor the first item', () => {
    expect(maxDepthAt(menu, 0, 'ul')).toBe(0);
    expect(indent(menu, 0, 1, 'ul')[0]?.depth).toBe(0);
    expect(indent(menu, 1, 1, 'ul')[1]?.depth).toBe(1);
    expect(maxDepthAt(menu, 3, 'dl')).toBe(1);
  });

  it('keeps depths valid after a move', () => {
    const moved = move(menu, 2, -1, 'ul');
    expect(moved.map((i) => [i.text, i.depth])).toEqual([
      ['Home', 0],
      ['Shoes', 1],
      ['Shop', 0],
      ['Bags', 1],
      ['About', 0],
    ]);
  });
});

describe('summarize', () => {
  it('counts items per list, as assistive technology announces them', () => {
    expect(summarize(menu, 'ul', 'ul')).toEqual({
      kind: 'list',
      items: 3,
      nested: [{ parent: 'Shop', summary: { kind: 'list', items: 2, nested: [] } }],
    });
    expect(summarize(menu, 'ol', 'ol').kind).toBe('numbered list');
  });
});
