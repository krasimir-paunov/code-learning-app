/**
 * Lesson prose is a restricted Markdown subset: emphasis, inline code, links, lists, fenced
 * code. Raw HTML, headings, images, tables and quotes are rejected at build time so content
 * can never break the fixed lesson anatomy or inject markup.
 */
import MarkdownIt from 'markdown-it';
import type { Highlighter } from './highlight.ts';

const ALLOWED_BLOCK = new Set([
  'paragraph_open',
  'paragraph_close',
  'inline',
  'bullet_list_open',
  'bullet_list_close',
  'ordered_list_open',
  'ordered_list_close',
  'list_item_open',
  'list_item_close',
  'fence',
  'softbreak',
  'hardbreak',
]);
const ALLOWED_INLINE = new Set([
  'text',
  'code_inline',
  'em_open',
  'em_close',
  'strong_open',
  'strong_close',
  'link_open',
  'link_close',
  'softbreak',
  'hardbreak',
  's_open',
  's_close',
]);

export interface MarkdownRenderer {
  /** Throws an Error describing the first disallowed construct. */
  block(source: string): string;
  inline(source: string): string;
}

export function createMarkdown(highlighter: Highlighter): MarkdownRenderer {
  // html: true only so raw HTML is *detected* (and rejected) instead of silently escaped.
  const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
  md.set({
    highlight: (code, lang) => {
      if (!lang) throw new Error('Fenced code needs a language (```js, ```css, ```cs...)');
      return highlighter.block(code, lang);
    },
  });
  const defaultLink =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = String(token?.attrGet('href') ?? '');
    if (/^https?:\/\//.test(href)) token?.attrSet('rel', 'noopener noreferrer');
    return defaultLink(tokens, idx, options, env, self);
  };

  function validate(source: string, inline: boolean) {
    const tokens = inline ? md.parseInline(source, {}) : md.parse(source, {});
    for (const token of tokens) {
      if (!inline && !ALLOWED_BLOCK.has(token.type)) {
        throw new Error(`Markdown "${token.type}" is not allowed in lesson prose`);
      }
      for (const child of token.children ?? []) {
        if (!ALLOWED_INLINE.has(child.type)) {
          throw new Error(`Markdown "${child.type}" is not allowed in lesson prose`);
        }
        if (child.type === 'link_open') {
          const href = String(child.attrGet('href') ?? '');
          if (!/^(https:\/\/|\/|#)/.test(href))
            throw new Error(`Link "${href}" must be https://, / or #`);
        }
      }
    }
  }

  return {
    block(source) {
      validate(source, false);
      return md.render(source).trim();
    },
    inline(source) {
      validate(source, true);
      return md.renderInline(source).trim();
    },
  };
}
