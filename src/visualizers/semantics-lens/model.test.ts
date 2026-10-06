// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { axTree, flatten } from '../shared/a11y/a11y.ts';
import { ADDS, INLINE_TAGS, phrases, toHtml, type Part } from './model.ts';

const paragraphs: Part[][] = [
  [
    { text: 'Warning:', want: 'strong', why: 'w' },
    ' unplug ',
    { text: '14 March', want: 'time', why: 'd', datetime: '2026-03-14' },
    ' & ',
    { text: 'HTML', want: 'abbr', why: 'a', title: 'HyperText Markup Language' },
  ],
];

describe('toHtml', () => {
  it('wraps each phrase in the chosen element, with time and abbr data', () => {
    expect(toHtml(paragraphs, ['strong', 'time', 'abbr'])).toBe(
      '<p><strong>Warning:</strong> unplug <time datetime="2026-03-14">14 March</time> &amp; <abbr title="HyperText Markup Language">HTML</abbr></p>',
    );
  });

  it('falls back to span and omits data for other elements', () => {
    expect(toHtml(paragraphs, ['b'])).toBe(
      '<p><b>Warning:</b> unplug <span>14 March</span> &amp; <span>HTML</span></p>',
    );
  });

  it('lists phrases in order', () => {
    expect(phrases(paragraphs).map((p) => p.want)).toEqual(['strong', 'time', 'abbr']);
  });
});

describe('ADDS', () => {
  it('matches the roles the shared accessibility model computes', () => {
    for (const tag of INLINE_TAGS) {
      const body = new DOMParser().parseFromString(`<${tag}>x</${tag}>`, 'text/html').body;
      const roles = flatten(axTree(body))
        .map((n) => n.role)
        .filter((r) => r !== 'text');
      expect(roles[0] ?? null, tag).toBe(ADDS[tag].role);
    }
  });
});
