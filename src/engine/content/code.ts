export const CODE_LANGS = ['html', 'css', 'js', 'ts', 'cs', 'json', 'sql', 'bash', 'text'] as const;
export type CodeLang = (typeof CODE_LANGS)[number];

export const LANG_LABELS: Record<CodeLang, string> = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
  ts: 'TypeScript',
  cs: 'C#',
  json: 'JSON',
  sql: 'SQL',
  bash: 'Shell',
  text: 'Text',
};

/** A code tab after the build: raw source (for copying) plus pre-highlighted HTML. */
export interface CompiledCodeTab {
  lang: CodeLang;
  source: string;
  /** Shiki output, generated at build time from trusted content. */
  html: string;
  /** Verified output (verify:snippets proved the source prints exactly this). */
  output?: string;
}

export interface CompiledCodeBlock {
  caption?: string;
  tabs: CompiledCodeTab[];
}
