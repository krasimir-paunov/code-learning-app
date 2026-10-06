import { describe, expect, it } from 'vitest';
import { parseAnatomy, partsAt, segments, type Part } from './model.ts';

const text = (source: string, p: { start: number; end: number }) => source.slice(p.start, p.end);

function find(parts: Part[], predicate: (p: Part) => boolean): Part {
  const part = parts.find(predicate);
  if (!part) throw new Error('part not found');
  return part;
}

describe('parseAnatomy', () => {
  it('names every part of a link', () => {
    const source = '<a href="/docs" title="Guide">Read the docs</a>';
    const parts = parseAnatomy(source);
    const of = (kind: string) => parts.filter((p) => p.kind === kind).map((p) => text(source, p));
    expect(of('element')).toEqual([source]);
    expect(of('start-tag')).toEqual(['<a href="/docs" title="Guide">']);
    expect(of('end-tag')).toEqual(['</a>']);
    expect(of('tag-name')).toEqual(['a', 'a']);
    expect(of('attribute')).toEqual(['href="/docs"', 'title="Guide"']);
    expect(of('attribute-name')).toEqual(['href', 'title']);
    expect(of('attribute-value')).toEqual(['"/docs"', '"Guide"']);
    expect(of('content')).toEqual(['Read the docs']);
  });

  it('gives void elements no content and no end tag', () => {
    const source = '<img src="cat.jpg" alt="A cat">';
    const parts = parseAnatomy(source);
    expect(parts.some((p) => p.kind === 'end-tag' || p.kind === 'content')).toBe(false);
    expect(
      text(
        source,
        find(parts, (p) => p.kind === 'element'),
      ),
    ).toBe(source);
  });

  it('handles boolean attributes and nesting', () => {
    const source = '<p>Press <button disabled>Save</button> now</p>';
    const parts = parseAnatomy(source);
    const button = find(parts, (p) => p.kind === 'element' && p.tag === 'button');
    expect(text(source, button)).toBe('<button disabled>Save</button>');
    expect(parts[button.parent ?? -1]?.tag).toBe('p');
    const attribute = find(parts, (p) => p.kind === 'attribute');
    expect(text(source, attribute)).toBe('disabled');
    expect(parts.some((p) => p.kind === 'attribute-value')).toBe(false);
    const content = find(parts, (p) => p.kind === 'content' && p.tag === 'p');
    expect(text(source, content)).toBe('Press <button disabled>Save</button> now');
  });

  it('rejects malformed snippets instead of guessing', () => {
    expect(() => parseAnatomy('<p>Hi')).toThrow('never closed');
    expect(() => parseAnatomy('<p><b>Hi</p></b>')).toThrow('unexpected end tag');
    expect(() => parseAnatomy('<a href="/docs>Docs</a>')).toThrow('unclosed attribute value');
  });
});

describe('partsAt and segments', () => {
  const source = '<a href="/x">Go</a>';
  const parts = parseAnatomy(source);

  it('lists the parts under a character, outermost first', () => {
    const kinds = partsAt(parts, source.indexOf('href')).map((p) => p.kind);
    expect(kinds).toEqual(['element', 'start-tag', 'attribute', 'attribute-name']);
    expect(partsAt(parts, source.indexOf('Go')).map((p) => p.kind)).toEqual(['element', 'content']);
  });

  it('cuts the source wherever the covering parts change', () => {
    const cut = segments(source, parts).map((s) => source.slice(s.start, s.end));
    expect(cut.join('')).toBe(source);
    expect(cut).toContain('href');
    expect(cut).toContain('"/x"');
    expect(cut).toContain('Go');
  });
});
