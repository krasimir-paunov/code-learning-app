/**
 * Compiles one lesson.yaml into the JSON chunk the app loads: validates the anatomy and every
 * challenge against its type's schema, inlines snippet files, renders Markdown, highlights code
 * and collects every output claim for verify:snippets.
 */
import fs from 'node:fs';
import path from 'node:path';
import type {
  ChallengeBuild,
  CompileContext,
  OutputClaim,
  VisualizerBuild,
} from '../../src/engine/challenges/build-contract.ts';
import type { CompiledCodeBlock } from '../../src/engine/content/code.ts';
import {
  LessonSchema,
  type ChallengeBase,
  type CodeBlock,
  type Lesson,
} from '../../src/engine/content/lesson-schema.ts';
import type { CompiledChallenge, CompiledLesson } from '../../src/engine/content/lesson-types.ts';
import type { Highlighter } from './highlight.ts';
import { formatZodIssues, relative, type ContentIssue, type LessonSource } from './load.ts';
import type { MarkdownRenderer } from './markdown.ts';
import type { Plugins } from './plugins.ts';

export interface AuthoredChallenge {
  plugin: ChallengeBuild;
  data: ChallengeBase;
}

/** The playground's parsed props, kept for visualizers that prove them at verify time. */
export interface AuthoredPlayground {
  plugin: VisualizerBuild;
  props: unknown;
}

export interface LessonBuild {
  id: string;
  file: string;
  dir: string;
  authored: Lesson;
  playground: AuthoredPlayground;
  challenges: AuthoredChallenge[];
  claims: OutputClaim[];
  compiled: CompiledLesson;
  ctx: CompileContext;
}

export interface CompileTools {
  plugins: Plugins;
  highlighter: Highlighter;
  markdown: MarkdownRenderer;
}

/** Thrown inside compile steps; carries where in the lesson it happened. */
class LocatedError extends Error {}

export function compileLesson(
  source: LessonSource,
  { plugins, highlighter, markdown }: CompileTools,
  issues: ContentIssue[],
): LessonBuild | undefined {
  const file = relative(source.file);
  const report = (where: string, message: string) =>
    issues.push({ file, message: where ? `${where}: ${message}` : message });

  const parsed = LessonSchema.safeParse(source.data);
  if (!parsed.success) {
    for (const message of formatZodIssues(parsed.error)) report('', message);
    return undefined;
  }
  const lesson = parsed.data;
  const claims: OutputClaim[] = [];
  let where = '';

  const read = (name: string) => {
    const full = path.resolve(source.dir, name);
    if (!full.startsWith(source.dir + path.sep))
      throw new LocatedError(`snippet "${name}" is outside the lesson folder`);
    if (!fs.existsSync(full)) throw new LocatedError(`snippet "${name}" does not exist`);
    return fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
  };
  const sourceOf = (code: { file?: string; inline?: string }) =>
    code.file !== undefined ? read(code.file) : (code.inline ?? '');

  const codeBlock = (block: CodeBlock, at: string): CompiledCodeBlock => ({
    ...(block.caption !== undefined && { caption: block.caption }),
    tabs: block.tabs.map((tab, i) => {
      const code = sourceOf(tab);
      if (tab.output !== undefined && tab.verify !== undefined && tab.verify !== 'none') {
        claims.push({
          code,
          lang: tab.lang,
          verify: tab.verify,
          expected: tab.output,
          where: `${at}.tabs[${i}]${tab.file ? ` (${tab.file})` : ''}`,
        });
      }
      return {
        lang: tab.lang,
        source: code,
        html: highlighter.block(code, tab.lang),
        ...(tab.output !== undefined && { output: tab.output.replace(/\n$/, '') }),
      };
    }),
  });

  const ctx: CompileContext = {
    read,
    source: sourceOf,
    markdown: markdown.block,
    inlineMarkdown: markdown.inline,
    highlight: highlighter.block,
    highlightLines: highlighter.lines,
    codeBlock: (block) => codeBlock(block, where),
    visualizer: (id) => plugins.visualizers.get(id),
  };

  function step<T>(at: string, fn: () => T): T | undefined {
    where = at;
    try {
      return fn();
    } catch (error) {
      report(at, error instanceof Error ? error.message : String(error));
      return undefined;
    }
  }

  const before = issues.length;
  const concept = step('concept', () => ({
    title: lesson.concept.title,
    html: markdown.block(lesson.concept.body),
    ...(lesson.concept.code && { code: codeBlock(lesson.concept.code, 'concept.code') }),
  }));

  let authoredPlayground: AuthoredPlayground | undefined;
  const playground = step('playground', () => {
    const visualizer = plugins.visualizers.get(lesson.playground.visualizer);
    if (!visualizer) {
      throw new LocatedError(
        `unknown visualizer "${lesson.playground.visualizer}" (known: ${[...plugins.visualizers.keys()].join(', ')})`,
      );
    }
    const props = visualizer.props.safeParse(lesson.playground.props);
    if (!props.success) throw new LocatedError(`props: ${formatZodIssues(props.error).join('; ')}`);
    authoredPlayground = { plugin: visualizer, props: props.data };
    return {
      visualizer: visualizer.id,
      props: visualizer.compile ? visualizer.compile(props.data, ctx) : props.data,
      promptHtml: markdown.block(lesson.playground.prompt),
      exploreHtml: lesson.playground.explore.map((e) => markdown.inline(e)),
    };
  });

  const challenges: CompiledChallenge[] = [];
  const authoredChallenges: AuthoredChallenge[] = [];
  const ids = new Set<string>();
  lesson.challenges.forEach((raw, index) => {
    const at = `challenges[${index}] (${raw.id})`;
    if (ids.has(raw.id)) report(at, `duplicate challenge id "${raw.id}"`);
    ids.add(raw.id);
    const plugin = plugins.challenges.get(raw.type);
    if (!plugin) {
      report(
        at,
        `unknown challenge type "${raw.type}" (known: ${[...plugins.challenges.keys()].join(', ')})`,
      );
      return;
    }
    const result = plugin.schema.safeParse(raw);
    if (!result.success) {
      for (const message of formatZodIssues(result.error)) report(at, message);
      return;
    }
    const data = result.data;
    const compiled = step(at, () => ({
      id: data.id,
      type: data.type,
      xp: data.xp ?? plugin.defaultXp,
      promptHtml: markdown.block(data.prompt),
      hintsHtml: data.hints.map((h) => markdown.block(h)),
      explanationHtml: markdown.block(data.explanation),
      solutionHtml: plugin.solution(data, ctx),
      spec: plugin.compile(data, ctx),
    }));
    if (!compiled) return;
    const typeClaims = step(at, () => plugin.claims?.(data, ctx) ?? []);
    claims.push(
      ...(typeClaims ?? []).map((c) => ({ ...c, where: `${at}${c.where ? `.${c.where}` : ''}` })),
    );
    challenges.push(compiled);
    authoredChallenges.push({ plugin, data });
  });

  const production = lesson.production.map(
    (p, i) =>
      step(`production[${i}]`, () => ({
        title: p.title,
        html: markdown.block(p.body),
        ...(p.code && { code: codeBlock(p.code, `production[${i}].code`) }),
      })) ?? { title: p.title, html: '' },
  );

  const mistake = step('mistake', () => ({
    title: lesson.mistake.title,
    html: markdown.block(lesson.mistake.body),
    ...(lesson.mistake.bad && { bad: codeBlock(lesson.mistake.bad, 'mistake.bad') }),
    fixHtml: markdown.block(lesson.mistake.fix),
    ...(lesson.mistake.good && { good: codeBlock(lesson.mistake.good, 'mistake.good') }),
  }));
  const recapHtml = lesson.recap.map((r, i) => step(`recap[${i}]`, () => markdown.inline(r)) ?? '');

  if (issues.length > before || !concept || !playground || !authoredPlayground || !mistake)
    return undefined;

  return {
    id: lesson.id,
    file: source.file,
    dir: source.dir,
    authored: lesson,
    playground: authoredPlayground,
    challenges: authoredChallenges,
    claims,
    ctx,
    compiled: {
      id: lesson.id,
      version: lesson.version,
      title: lesson.title,
      summary: lesson.summary,
      minutes: lesson.minutes,
      tags: lesson.tags,
      concept,
      playground,
      challenges,
      production,
      mistake,
      recapHtml,
      related: lesson.related,
    },
  };
}
