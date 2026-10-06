// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fakeHeadings } from './model.ts';

const body = (html: string) => new DOMParser().parseFromString(html, 'text/html').body;

describe('fakeHeadings', () => {
  it('finds bold paragraphs and title-classed elements that are not headings', () => {
    expect(
      fakeHeadings(
        body(`
          <h1>Shop</h1>
          <p><b>Shipping</b></p>
          <div class="section-title">Returns</div>
          <h2 class="title">Real heading</h2>
          <p>Normal <b>bold</b> text.</p>`),
      ),
    ).toEqual([
      { text: 'Shipping', tag: '<p>' },
      { text: 'Returns', tag: '<div class="section-title">' },
    ]);
  });
});
