/** Compiles content/cheatsheets/*.yaml: validates, highlights, resolves Learn links, collects claims. */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { OutputClaim } from '../../src/engine/challenges/build-contract.ts';
import { CheatSheetSchema } from '../../src/engine/content/cheatsheet-schema.ts';
import type { CompiledEntry, CompiledSheet } from '../../src/engine/content/cheatsheet-types.ts';
import type { SkillManifest } from '../../src/engine/skilltree/types.ts';
import type { Highlighter } from './highlight.ts';
import { CONTENT_DIR, formatZodIssues, relative, type ContentIssue } from './load.ts';
import type { MarkdownRenderer } from './markdown.ts';
import { STATIC_OK, staticCheckPage } from '../verify/static-check.ts';

export interface SheetBuild {
  file: string;
  compiled: CompiledSheet;
  claims: OutputClaim[];
}

const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

export function compileSheets(
  manifest: SkillManifest,
  tools: { highlighter: Highlighter; markdown: MarkdownRenderer },
  issues: ContentIssue[],
): SheetBuild[] {
  const dir = path.join(CONTENT_DIR, 'cheatsheets');
  if (!fs.existsSync(dir)) return [];
  const seen = new Set<string>();
  const out: SheetBuild[] = [];
  const order = manifest.tracks.map((t) => t.id);

  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
    const full = path.join(dir, name);
    const file = relative(full);
    let raw: unknown;
    try {
      raw = parse(fs.readFileSync(full, 'utf8'));
    } catch (error) {
      issues.push({ file, message: `Invalid YAML: ${String(error)}` });
      continue;
    }
    const result = CheatSheetSchema.safeParse(raw);
    if (!result.success) {
      for (const message of formatZodIssues(result.error)) issues.push({ file, message });
      continue;
    }
    const sheet = result.data;
    if (`${sheet.track}.yaml` !== name)
      issues.push({ file, message: `track "${sheet.track}" must match the file name` });
    if (!order.includes(sheet.track))
      issues.push({ file, message: `unknown track "${sheet.track}"` });

    const claims: OutputClaim[] = [];
    const sections = sheet.sections.map((section) => ({
      id: section.id,
      title: section.title,
      entries: section.entries.map((entry): CompiledEntry => {
        const where = `${section.id} / ${entry.id}`;
        if (seen.has(entry.id)) issues.push({ file, message: `${where}: duplicate entry id` });
        seen.add(entry.id);
        if (!entry.id.startsWith(`${sheet.track}.sheet.`)) {
          issues.push({
            file,
            message: `${where}: ids in this sheet start with "${sheet.track}.sheet."`,
          });
        }
        let learn: CompiledEntry['learn'];
        if (entry.learn) {
          const node = manifest.nodes[entry.learn];
          if (!node)
            issues.push({ file, message: `${where}: learn: unknown lesson "${entry.learn}"` });
          // Planned lessons stay hidden until they are published.
          else if (node.published) learn = { id: node.id, title: node.title };
        }
        let explainHtml = '';
        try {
          explainHtml = tools.markdown.inline(entry.explain);
        } catch (error) {
          issues.push({ file, message: `${where}: ${String(error)}` });
        }
        const base = {
          id: entry.id,
          title: entry.title,
          explainHtml,
          explainText: stripTags(explainHtml),
          usage: entry.usage,
          legacy: entry.legacy,
          tags: entry.tags,
          ...(learn && { learn }),
        };
        if (entry.kind === 'table') {
          return {
            ...base,
            kind: 'table',
            columns: entry.columns,
            rows: entry.rows.map((row) => row.map((cell) => tools.markdown.inline(cell))),
            notesHtml: entry.notes.map((n) => tools.markdown.inline(n)),
          };
        }
        const verify = entry.verify;
        const buildOnly = verify === 'dotnet-build' || verify === 'tsc';
        const { inline, lang } = entry.code;
        if (verify && verify !== 'none' && (entry.output !== undefined || buildOnly)) {
          // CSS can't print: its `check` is a page that the stylesheet is applied to.
          claims.push(
            lang === 'css'
              ? {
                  code: `<style>\n${inline}\n</style>\n${entry.check ?? ''}`,
                  lang: 'html',
                  verify,
                  expected: entry.output ?? '',
                  where,
                }
              : {
                  code: entry.check ? `${inline}\n${entry.check}` : inline,
                  lang,
                  verify,
                  expected: entry.output ?? '',
                  where,
                },
          );
        }
        if ((lang === 'css' || lang === 'html') && verify !== 'none') {
          claims.push({
            code: staticCheckPage(inline, lang),
            lang: 'html',
            verify: 'browser',
            expected: STATIC_OK,
            where: `${where} (static check)`,
          });
        }
        return {
          ...base,
          kind: 'code',
          code: {
            tabs: [
              {
                lang: entry.code.lang,
                source: entry.code.inline,
                html: tools.highlighter.block(entry.code.inline, entry.code.lang),
                ...(entry.output !== undefined && { output: entry.output.replace(/\n$/, '') }),
              },
            ],
          },
        };
      }),
    }));

    out.push({
      file: full,
      claims,
      compiled: {
        track: sheet.track,
        title: sheet.title,
        ...(sheet.intro && { introHtml: tools.markdown.inline(sheet.intro) }),
        sections,
      },
    });
  }
  return out.sort((a, b) => order.indexOf(a.compiled.track) - order.indexOf(b.compiled.track));
}
