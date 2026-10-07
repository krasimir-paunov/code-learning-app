import { sheetIndex, sheetLoaders } from 'virtual:content/cheatsheets';
import type { CompiledSheet } from '../../engine/content/cheatsheet-types.ts';
import { createSheetSearch } from './search.ts';

export interface SheetLibrary {
  sheets: CompiledSheet[];
  search: ReturnType<typeof createSheetSearch>;
}

let library: SheetLibrary | undefined;
let pending: Promise<SheetLibrary> | undefined;

/**
 * Loads every sheet's chunk in parallel, once, and builds the search index over all of them
 * (search always spans every sheet). A failed load is retried on the next call.
 */
export function loadSheets(): Promise<SheetLibrary> {
  if (library) return Promise.resolve(library);
  pending ??= Promise.all(
    sheetIndex.map(async ({ track }) => {
      const load = sheetLoaders[track];
      if (!load) throw new Error(`No chunk for the ${track} cheat sheet`);
      return (await load()).default;
    }),
  ).then(
    (sheets) => (library = { sheets, search: createSheetSearch(sheets) }),
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}

/** The sheets if they are already loaded (so the page can render without a loading state). */
export function cachedSheets(): SheetLibrary | undefined {
  return library;
}
