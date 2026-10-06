import type { CompiledCodeBlock } from './code.ts';

/**
 * A lesson as shipped to the browser: Markdown already rendered to (restricted) HTML, code
 * already highlighted, snippet files inlined, each challenge compiled by its own type.
 * One lazy JSON chunk per lesson.
 */
export interface CompiledLesson {
  id: string;
  version: number;
  title: string;
  summary: string;
  minutes: number;
  tags: string[];
  concept: { title: string; html: string; code?: CompiledCodeBlock };
  playground: {
    visualizer: string;
    props: unknown;
    promptHtml: string;
    exploreHtml: string[];
  };
  challenges: CompiledChallenge[];
  production: { title: string; html: string; code?: CompiledCodeBlock }[];
  mistake: {
    title: string;
    html: string;
    bad?: CompiledCodeBlock;
    fixHtml: string;
    good?: CompiledCodeBlock;
  };
  recapHtml: string[];
  related: string[];
}

export interface CompiledChallenge<Spec = unknown> {
  id: string;
  type: string;
  /** Effective XP base: the spec's override or the type's default. */
  xp: number;
  promptHtml: string;
  hintsHtml: string[];
  explanationHtml: string;
  /** Shown after "Show solution"; the learner still submits the answer once. */
  solutionHtml: string;
  /** The type's runtime spec (compiled by the type's build plugin). */
  spec: Spec;
}
