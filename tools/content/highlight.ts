/**
 * Build-time syntax highlighting (Shiki). Colors are the app's semantic code tokens
 * (var(--code-*)), so highlighting follows the theme and the print stylesheet.
 */
import { createHighlighter, type HighlighterGeneric, type ThemeRegistration } from 'shiki';

const LANGS: Record<string, string> = {
  html: 'html',
  css: 'css',
  js: 'javascript',
  ts: 'typescript',
  cs: 'csharp',
  json: 'json',
  sql: 'sql',
  bash: 'bash',
  text: 'text',
};

const v = (name: string) => `var(--code-${name})`;

const theme: ThemeRegistration = {
  name: 'neon',
  type: 'dark',
  colors: { 'editor.foreground': v('fg'), 'editor.background': v('bg') },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: v('comment'), fontStyle: 'italic' },
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.operator.new',
        'keyword.operator.expression',
        'variable.language',
        'keyword.control',
      ],
      settings: { foreground: v('keyword') },
    },
    {
      scope: ['string', 'punctuation.definition.string', 'string.template'],
      settings: { foreground: v('string') },
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'keyword.other.unit',
        'constant.other.color',
        'support.constant.property-value',
        'support.constant',
      ],
      settings: { foreground: v('number') },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call.generic'],
      settings: { foreground: v('function') },
    },
    {
      scope: [
        'support.type.property-name',
        'variable.other.property',
        'variable.other.object.property',
        'meta.object-literal.key',
      ],
      settings: { foreground: v('property') },
    },
    {
      scope: ['entity.name.tag', 'punctuation.definition.tag'],
      settings: { foreground: v('tag') },
    },
    {
      scope: [
        'entity.other.attribute-name',
        'entity.other.attribute-name.class',
        'entity.other.attribute-name.id',
        'entity.other.attribute-name.pseudo-class',
      ],
      settings: { foreground: v('attribute') },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.class',
        'support.type.primitive',
        'storage.type.cs',
        'keyword.type',
      ],
      settings: { foreground: v('type') },
    },
    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator'],
      settings: { foreground: v('punctuation') },
    },
  ],
};

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export interface Highlighter {
  lines(code: string, lang: string): string[];
  block(code: string, lang: string): string;
}

let pending: Promise<HighlighterGeneric<string, string>> | undefined;

export async function createCodeHighlighter(): Promise<Highlighter> {
  pending ??= createHighlighter({
    themes: [theme],
    langs: Object.values(LANGS).filter((l) => l !== 'text'),
  }) as Promise<HighlighterGeneric<string, string>>;
  const shiki = await pending;

  function lines(code: string, lang: string): string[] {
    const shikiLang = LANGS[lang];
    if (!shikiLang) throw new Error(`Unknown code language "${lang}"`);
    const source = code.replace(/\r\n/g, '\n').replace(/\n$/, '');
    if (shikiLang === 'text') return source.split('\n').map(escape);
    const { tokens } = shiki.codeToTokens(source, { lang: shikiLang, theme: 'neon' });
    return tokens.map((line) => {
      // Adjacent tokens with the same style become one span (smaller lesson chunks).
      const runs: { style: string; text: string }[] = [];
      for (const token of line) {
        const italic = token.fontStyle !== undefined && (token.fontStyle & 1) === 1;
        const style = `color:${token.color ?? v('fg')}${italic ? ';font-style:italic' : ''}`;
        const last = runs.at(-1);
        if (last && last.style === style) last.text += token.content;
        else runs.push({ style, text: token.content });
      }
      return runs.map((run) => `<span style="${run.style}">${escape(run.text)}</span>`).join('');
    });
  }

  return {
    lines,
    block: (code, lang) =>
      `<pre class="shiki"><code>${lines(code, lang)
        .map((line) => `<span class="line">${line}</span>`)
        .join('\n')}</code></pre>`,
  };
}
