import { sheetIndex } from 'virtual:content/cheatsheets';
import { describe, expect, it } from 'vitest';
import { cachedSheets, loadSheets } from './sheet-data.ts';

describe('cheat sheet chunks', () => {
  it('loads every sheet once, in index order, with one search over all of them', async () => {
    expect(cachedSheets()).toBeUndefined();
    const library = await loadSheets();
    expect(library.sheets.map((s) => s.track)).toEqual(sheetIndex.map((s) => s.track));
    expect(cachedSheets()).toBe(library);
    expect(await loadSheets()).toBe(library);

    const tracks = new Set(library.search.search('grid').map((hit) => hit.track));
    expect(tracks.has('css')).toBe(true);
  });
});
