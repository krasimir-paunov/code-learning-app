// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  accessibleName,
  announce,
  axTree,
  headingOutline,
  implicitRole,
  landmarks,
  role,
  states,
} from './a11y.ts';

const html = (source: string) => {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  return doc.body;
};
const first = (source: string, selector: string) => {
  const element = html(source).querySelector(selector);
  if (!element) throw new Error(`no ${selector}`);
  return element;
};

describe('roles', () => {
  it.each([
    ['<a href="/">x</a>', 'a', 'link'],
    ['<a>x</a>', 'a', 'generic'],
    ['<img src="a.png" alt="">', 'img', 'presentation'],
    ['<img src="a.png" alt="Logo">', 'img', 'img'],
    ['<input type="email">', 'input', 'textbox'],
    ['<input type="checkbox">', 'input', 'checkbox'],
    ['<input>', 'input', 'textbox'],
    ['<select><option>a</option></select>', 'select', 'combobox'],
    ['<select multiple><option>a</option></select>', 'select', 'listbox'],
    ['<header>x</header>', 'header', 'banner'],
    ['<article><header>x</header></article>', 'header', 'generic'],
    ['<section>x</section>', 'section', 'generic'],
    ['<section aria-label="News">x</section>', 'section', 'region'],
    ['<table><tr><th scope="row">a</th></tr></table>', 'th', 'rowheader'],
    ['<table><tr><th>a</th></tr></table>', 'th', 'columnheader'],
    ['<div>x</div>', 'div', 'generic'],
  ])('%s → %s is %s', (source, selector, expected) => {
    expect(implicitRole(first(source, selector))).toBe(expected);
  });

  it('lets an explicit role win', () => {
    expect(role(first('<div role="button tab">x</div>', 'div'))).toBe('button');
  });
});

describe('accessibleName', () => {
  it.each([
    ['<label for="e">Email</label><input id="e">', 'input', 'Email'],
    ['<label>Name <input></label>', 'input', 'Name'],
    ['<input aria-label="Search">', 'input', 'Search'],
    [
      '<span id="a">Ship</span><span id="b">to</span><input aria-labelledby="a b">',
      'input',
      'Ship to',
    ],
    ['<button><img src="x.svg" alt="Close"></button>', 'button', 'Close'],
    ['<button aria-label="Close">×</button>', 'button', 'Close'],
    ['<a href="/">Read <b>more</b></a>', 'a', 'Read more'],
    ['<input type="submit">', 'input', 'Submit'],
    ['<input type="submit" value="Send">', 'input', 'Send'],
    ['<fieldset><legend>Delivery</legend></fieldset>', 'fieldset', 'Delivery'],
    ['<table><caption>Prices</caption></table>', 'table', 'Prices'],
    ['<img src="a.png" alt="A cat">', 'img', 'A cat'],
    ['<div title="Tip">x</div>', 'div', 'Tip'],
    ['<p>Some text</p>', 'p', ''],
  ])('%s', (source, selector, expected) => {
    expect(accessibleName(first(source, selector))).toBe(expected);
  });
});

describe('states', () => {
  it('reports checked, expanded, required and disabled', () => {
    expect(states(first('<input type="checkbox" checked required>', 'input'))).toEqual([
      'checked',
      'required',
    ]);
    expect(states(first('<button aria-expanded="false" disabled>x</button>', 'button'))).toEqual([
      'collapsed',
      'unavailable',
    ]);
  });
});

describe('axTree', () => {
  it('skips generic wrappers and hidden content, keeps text', () => {
    const tree = axTree(
      html('<div><nav><a href="/">Home</a></nav><span aria-hidden="true">★</span><p>Hi</p></div>'),
    );
    expect(tree.map((n) => n.role)).toEqual(['navigation', 'paragraph']);
    expect(tree[0]?.children[0]).toMatchObject({ role: 'link', name: 'Home' });
    expect(tree[1]?.children[0]).toMatchObject({ role: 'text', name: 'Hi' });
  });

  it('announces name, role and states', () => {
    const [node] = axTree(html('<input type="checkbox" aria-label="Agree" required>'));
    expect(node && announce(node)).toBe('Agree, checkbox, not checked, required');
    const [heading] = axTree(html('<h2>Prices</h2>'));
    expect(heading && announce(heading)).toBe('Prices, heading level 2');
  });
});

describe('headingOutline', () => {
  it('flags skipped levels and a missing or doubled h1', () => {
    const outline = headingOutline(html('<h1>Shop</h1><h3>Shoes</h3><h2>Bags</h2>'));
    expect(outline.headings.map((h) => h.level)).toEqual([1, 3, 2]);
    expect(outline.headings[1]?.issues[0]?.kind).toBe('skipped');
    expect(outline.issues).toEqual([]);
    expect(headingOutline(html('<h2>A</h2>')).issues[0]?.kind).toBe('no-h1');
    expect(headingOutline(html('<h1>A</h1><h1>B</h1>')).issues[0]?.kind).toBe('multiple-h1');
  });
});

describe('landmarks', () => {
  it('lists landmarks in order, regions only when named', () => {
    const page = html(`
      <header>Logo</header>
      <nav aria-label="Main"><a href="/">Home</a></nav>
      <main><section>Unnamed</section><section aria-label="Offers">Named</section></main>
      <aside>Ads</aside>
      <footer>©</footer>`);
    expect(landmarks(page)).toEqual([
      { role: 'banner', name: '' },
      { role: 'navigation', name: 'Main' },
      { role: 'main', name: '' },
      { role: 'region', name: 'Offers' },
      { role: 'complementary', name: '' },
      { role: 'contentinfo', name: '' },
    ]);
  });
});
