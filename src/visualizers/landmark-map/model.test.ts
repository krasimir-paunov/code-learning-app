// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { analyze, pageIssues, toHtml, type Region } from './model.ts';

const page: Region[] = [
  {
    id: 'top',
    label: 'Logo',
    want: ['header'],
    children: [{ id: 'menu', label: 'Menu', want: ['nav'] }],
  },
  {
    id: 'content',
    label: 'Content',
    want: ['main'],
    children: [
      {
        id: 'post',
        label: 'Post',
        want: ['article'],
        children: [{ id: 'post-head', label: 'Title', want: ['header'] }],
      },
    ],
  },
  { id: 'side', label: 'Related', want: ['aside'], side: true },
];

describe('toHtml', () => {
  it('nests the chosen elements with their labels', () => {
    expect(toHtml(page.slice(0, 1), { top: 'header', menu: 'nav' })).toBe(
      '<header data-region="top">\n  Logo\n  <nav data-region="menu">\n    Menu\n  </nav>\n</header>',
    );
  });
});

describe('analyze', () => {
  it('derives landmarks from position: a header inside an article is not a banner', () => {
    const results = analyze(page, {
      top: 'header',
      menu: 'nav',
      content: 'main',
      post: 'article',
      'post-head': 'header',
      side: 'aside',
    });
    const by = (id: string) => results.find((r) => r.id === id);
    expect(by('top')).toMatchObject({ role: 'banner', landmark: true, fits: true });
    expect(by('post-head')).toMatchObject({ role: 'generic', landmark: false, fits: true });
    expect(by('side')).toMatchObject({ role: 'complementary', landmark: true });
    expect(pageIssues(results)).toEqual([]);
  });

  it('treats unchosen regions as divs and flags a missing main', () => {
    const results = analyze(page, {});
    expect(results.every((r) => r.tag === 'div' && !r.landmark && !r.fits)).toBe(true);
    expect(pageIssues(results)[0]).toContain('No <main>');
  });
});
