import { describe, expect, it } from 'vitest';
import { buildTree, traceSteps, walk } from './model.ts';

const PAGE = 'https://site.example/blog/2026/spring-trails.html';

describe('walk', () => {
  it.each([
    'map.png',
    './map.png',
    '../images/map.png',
    '../../index.html',
    '../../../../index.html',
    '/images/logo.svg',
    'images/',
    'photos/trail.jpg?size=large#top',
  ])('%s ends where new URL() resolves', (href) => {
    const result = walk(href, PAGE);
    const expected = new URL(href, PAGE);
    const end = result.steps.at(-1)?.path ?? result.start;
    expect(`https://site.example${end}`).toBe(expected.origin + expected.pathname);
    expect(result.resolved?.href).toBe(expected.href);
  });

  it('starts beside the page for relative links and at the root for /', () => {
    expect(walk('map.png', PAGE).start).toBe('/blog/2026/');
    expect(walk('/images/logo.svg', PAGE)).toMatchObject({ kind: 'root', start: '/' });
  });

  it('explains each step and stops at the root', () => {
    expect(walk('../images/map.png', PAGE).steps.map((s) => s.path)).toEqual([
      '/blog/',
      '/blog/images/',
      '/blog/images/map.png',
    ]);
    expect(walk('../../../index.html', PAGE).steps[2]?.note).toContain('no higher');
  });

  it('recognises other sites and fragments', () => {
    expect(walk('https://cdn.example/a.js', PAGE).kind).toBe('other-site');
    expect(walk('//cdn.example/a.js', PAGE).kind).toBe('other-site');
    expect(walk('#comments', PAGE).kind).toBe('fragment');
  });
});

describe('buildTree', () => {
  it('nests files in folders, folders first', () => {
    const tree = buildTree(['/index.html', '/blog/a.html', '/blog/img/x.png', '/about.html']);
    expect(tree.children.map((c) => c.path)).toEqual(['/blog/', '/about.html', '/index.html']);
    expect(tree.children[0]?.children.map((c) => c.path)).toEqual(['/blog/img/', '/blog/a.html']);
  });
});

describe('traceSteps', () => {
  it('lists the folders and file to click', () => {
    expect(traceSteps('../../css/site.css', PAGE)).toEqual([
      '/blog/',
      '/',
      '/css/',
      '/css/site.css',
    ]);
  });
});
