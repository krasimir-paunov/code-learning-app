/**
 * Build-time half of a challenge plugin (challenges/types/<type>/build.ts). Runs in Node during
 * the content build, content:check and verify:snippets; never bundled into the app.
 */
import type { ZodType } from 'zod';
import type { CompiledCodeBlock } from '../content/code.ts';
import type { ChallengeBase, CodeBlock, VerifyKind } from '../content/lesson-schema.ts';
import type { RunResult } from '../runners/contract.ts';

export interface CompileContext {
  /** Reads a snippet relative to the lesson folder (throws a located error if missing). */
  read(file: string): string;
  /** Resolves { file } | { inline } to source text. */
  source(code: { file?: string; inline?: string }): string;
  markdown(md: string): string;
  /** Inline Markdown without the wrapping <p>. */
  inlineMarkdown(md: string): string;
  /** Whole-block highlighting. */
  highlight(code: string, lang: string): string;
  /** One highlighted HTML string per source line (for clickable/inline-editable code). */
  highlightLines(code: string, lang: string): string[];
  codeBlock(block: CodeBlock): CompiledCodeBlock;
  /** Looks up a visualizer's build plugin (for trace challenges). */
  visualizer(id: string): VisualizerBuild | undefined;
}

export interface BuildCheckContext extends CompileContext {
  /** Runs JS + tests in node:vm with the shared harness (same as the browser sandbox). */
  runJs(files: Record<string, string>, tests?: string): Promise<RunResult>;
  /** Runs a full page in headless Chromium inside the real sandbox document. */
  runInBrowser(request: {
    files: Record<string, string>;
    tests?: string;
    measure?: { selectors: string[]; properties?: string[] };
    viewport?: { width: number; height: number };
  }): Promise<RunResult>;
  /** Executes a snippet with a verify kind and returns stdout (for output claims). */
  execute(code: string, lang: string, verify: VerifyKind): Promise<string>;
}

/** A claim the build must prove by execution (see verify:snippets). */
export interface OutputClaim {
  code: string;
  lang: string;
  verify: VerifyKind;
  expected: string;
  where: string;
}

export interface ChallengeBuild<Authored extends ChallengeBase = ChallengeBase, Spec = unknown> {
  type: string;
  defaultXp: number;
  /** Validates the whole authored challenge (base fields included). */
  schema: ZodType<Authored>;
  compile(challenge: Authored, ctx: CompileContext): Spec;
  /** HTML shown by "Show solution". */
  solution(challenge: Authored, ctx: CompileContext): string;
  /** Output claims to verify by execution (predict-output answers, fill-blank checks...). */
  claims?(challenge: Authored, ctx: CompileContext): OutputClaim[];
  /** Proves the challenge is sound: the answer works, distractors fail. Returns problems. */
  buildCheck?(challenge: Authored, ctx: BuildCheckContext): Promise<string[]>;
}

export interface VisualizerBuild<Props = unknown, TraceProps = unknown, Compiled = Props> {
  id: string;
  /** Validates `playground.props` of lessons using this visualizer. */
  props: ZodType<Props>;
  /** Turns authored props into what the view receives (e.g. inlining snippet files). */
  compile?(props: Props, ctx: CompileContext): Compiled;
  /** Learner-drives mode for `trace` challenges: the visualizer's own step list. */
  trace?: {
    props: ZodType<TraceProps>;
    steps(props: TraceProps): unknown[];
  };
}
