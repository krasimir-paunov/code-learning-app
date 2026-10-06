import MiniSearch from 'minisearch';
import type { CompiledEntry, CompiledSheet, Usage } from '../../engine/content/cheatsheet-types.ts';

export interface EntryHit {
  track: string;
  section: string;
  entry: CompiledEntry;
}

interface IndexedDoc {
  id: string;
  title: string;
  explain: string;
  code: string;
  section: string;
  tags: string;
}

function textOf(entry: CompiledEntry): string {
  return entry.kind === 'code'
    ? entry.code.tabs.map((t) => t.source).join('\n')
    : [entry.columns.join(' '), ...entry.rows.map((r) => r.join(' '))]
        .join(' ')
        .replace(/<[^>]+>/g, '');
}

/** One index over every sheet (title, explanation, code tokens, tags), prefix + fuzzy matching. */
export function createSheetSearch(sheets: readonly CompiledSheet[]) {
  const hits = new Map<string, EntryHit>();
  const docs: IndexedDoc[] = [];
  for (const sheet of sheets) {
    for (const section of sheet.sections) {
      for (const entry of section.entries) {
        hits.set(entry.id, { track: sheet.track, section: section.title, entry });
        docs.push({
          id: entry.id,
          title: entry.title,
          explain: entry.explainText,
          code: textOf(entry),
          section: section.title,
          tags: entry.tags.join(' '),
        });
      }
    }
  }
  const index = new MiniSearch<IndexedDoc>({
    fields: ['title', 'explain', 'code', 'section', 'tags'],
    // Code is full of punctuation; split on anything that is not a word character.
    tokenize: (text) => text.split(/[^\p{L}\p{N}_$#@.-]+|(?<=\w)\.(?=\w)/u).filter(Boolean),
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, tags: 2, explain: 1.5 },
      combineWith: 'AND',
    },
  });
  index.addAll(docs);

  return {
    /** Matching entries in relevance order. */
    search(query: string): EntryHit[] {
      const q = query.trim();
      if (!q) return [];
      return index
        .search(q)
        .map((r) => hits.get(String(r.id)))
        .filter((h): h is EntryHit => h !== undefined);
    },
  };
}

/** Usage filter: an empty selection shows everything. */
export function matchesUsage(entry: CompiledEntry, usage: ReadonlySet<Usage>): boolean {
  return usage.size === 0 || usage.has(entry.usage);
}

/** Groups hits by track in the given track order (search results are shown per track). */
export function groupByTrack(
  hits: readonly EntryHit[],
  order: readonly string[],
): [string, EntryHit[]][] {
  const groups = new Map<string, EntryHit[]>();
  for (const hit of hits) groups.set(hit.track, [...(groups.get(hit.track) ?? []), hit]);
  return [...groups.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
}
