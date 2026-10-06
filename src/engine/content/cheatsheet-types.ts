import type { CompiledCodeBlock } from './code.ts';

export const USAGE = ['daily', 'common', 'rare'] as const;
export type Usage = (typeof USAGE)[number];

interface CompiledEntryBase {
  id: string;
  title: string;
  /** Inline HTML (restricted Markdown). */
  explainHtml: string;
  /** Plain text for search. */
  explainText: string;
  usage: Usage;
  /** Only set when the lesson is published (hidden for planned lessons). */
  learn?: { id: string; title: string };
  legacy: boolean;
  tags: string[];
}

export interface CompiledCodeEntry extends CompiledEntryBase {
  kind: 'code';
  code: CompiledCodeBlock;
}

export interface CompiledTableEntry extends CompiledEntryBase {
  kind: 'table';
  columns: string[];
  /** Cells as inline HTML. */
  rows: string[][];
  notesHtml: string[];
}

export type CompiledEntry = CompiledCodeEntry | CompiledTableEntry;

export interface CompiledSheet {
  track: string;
  title: string;
  introHtml?: string;
  sections: { id: string; title: string; entries: CompiledEntry[] }[];
}
