// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { addedElements, buildTree, countElements, hexBytes, tokenize } from './model.ts';

const parse = (source: string) => {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  return buildTree(doc, tokenize(source));
};

describe('tokenize', () => {
  it('splits source into start tags, end tags and text, in order', () => {
    expect(tokenize('<p class="x">Hi <b>there</b></p>').map((t) => t.type)).toEqual([
      'start',
      'text',
      'start',
      'text',
      'end',
      'end',
    ]);
  });

  it('recognises doctypes and comments', () => {
    const tokens = tokenize('<!doctype html><!-- note --><p>x</p>');
    expect(tokens[0]?.type).toBe('doctype');
    expect(tokens[1]?.type).toBe('comment');
  });
});

describe('buildTree', () => {
  it('flags the html, head and body the parser creates', () => {
    expect(addedElements(parse('<p>Hello</p>'))).toEqual(['html', 'head', 'body']);
    expect(addedElements(parse('<html><head></head><body><p>Hi</p></body></html>'))).toEqual([]);
  });

  it('shows how the parser repairs a block inside a paragraph', () => {
    const tree = parse('<p>Intro <div>Box</div> end</p>');
    // The paragraph closes before the div; the stray </p> creates a second, empty paragraph.
    expect(addedElements(tree)).toEqual(['html', 'head', 'body', 'p']);
    expect(countElements(tree)).toBe(6);
  });

  it('marks whitespace-only text nodes', () => {
    const body = parse('<ul>\n  <li>One</li>\n</ul>').children[0]?.children[1];
    const ul = body?.children[0];
    expect(ul?.children.map((c) => c.whitespace)).toEqual([true, false, true]);
  });
});

describe('hexBytes', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(hexBytes('é', 8)).toEqual({ hex: ['c3', 'a9'], total: 2 });
    expect(hexBytes('<p>', 2)).toEqual({ hex: ['3c', '70'], total: 3 });
  });
});
