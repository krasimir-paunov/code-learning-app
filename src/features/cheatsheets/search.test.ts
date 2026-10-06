import { describe, expect, it } from 'vitest';
import type { CompiledEntry, CompiledSheet } from '../../engine/content/cheatsheet-types.ts';
import { createSheetSearch, groupByTrack, matchesUsage } from './search.ts';

const entry = (
  id: string,
  title: string,
  source: string,
  usage: CompiledEntry['usage'],
  tags: string[] = [],
): CompiledEntry => ({
  kind: 'code',
  id,
  title,
  explainHtml: '',
  explainText: `About ${title}`,
  usage,
  legacy: false,
  tags,
  code: { tabs: [{ lang: 'js', source, html: '' }] },
});

const sheets: CompiledSheet[] = [
  {
    track: 'js',
    title: 'JavaScript',
    sections: [
      {
        id: 'arrays',
        title: 'Arrays',
        entries: [
          entry('js.sheet.map', 'Transform every item', 'xs.map((x) => x * 2)', 'daily'),
          entry(
            'js.sheet.sorted',
            'Sort without mutating',
            'xs.toSorted((a, b) => a - b)',
            'common',
          ),
        ],
      },
    ],
  },
  {
    track: 'css',
    title: 'CSS',
    sections: [
      {
        id: 'layout',
        title: 'Layout',
        entries: [
          entry('css.sheet.center', 'Center anything', 'display: flex;', 'daily', ['flexbox']),
        ],
      },
    ],
  },
];

describe('cheat-sheet search', () => {
  const search = createSheetSearch(sheets);

  it('finds by title with prefix matching', () => {
    expect(search.search('transf').map((h) => h.entry.id)).toEqual(['js.sheet.map']);
  });

  it('finds by code tokens', () => {
    expect(search.search('toSorted').map((h) => h.entry.id)).toEqual(['js.sheet.sorted']);
  });

  it('tolerates typos and searches tags', () => {
    expect(search.search('centr')[0]?.entry.id).toBe('css.sheet.center');
    expect(search.search('flexbox')[0]?.entry.id).toBe('css.sheet.center');
  });

  it('returns nothing for an empty query', () => {
    expect(search.search('   ')).toEqual([]);
  });

  it('groups results by track in curriculum order', () => {
    const hits = [...search.search('center'), ...search.search('transform')];
    expect(groupByTrack(hits, ['html', 'css', 'js']).map(([track]) => track)).toEqual([
      'css',
      'js',
    ]);
  });

  it('filters by usage, showing everything when nothing is selected', () => {
    const daily = entry('x.sheet.a', 'A', '', 'daily');
    expect(matchesUsage(daily, new Set())).toBe(true);
    expect(matchesUsage(daily, new Set(['rare']))).toBe(false);
    expect(matchesUsage(daily, new Set(['daily', 'rare']))).toBe(true);
  });
});
