import type { Measurement } from '../../../runners/contract.ts';
import { defineChallengeType, type GradeDetail, type GradeResult } from '../../contract.ts';

export interface VisualMatchSpec {
  html: string;
  starterCss: string;
  targetCss: string;
  compare: { selectors: string[]; tolerancePx: number; properties: string[] };
  viewport: { width: number; height: number };
}

/** The learner's CSS. */
export type VisualMatchAnswer = string;

const BOX_KEYS = ['width', 'height', 'x', 'y'] as const;
const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Compares element boxes (getBoundingClientRect) within a tolerance and listed computed styles.
 * No pixel diffs: fonts and antialiasing make those flaky.
 */
export function compareLayouts(
  target: Record<string, Measurement>,
  learner: Record<string, Measurement>,
  compare: VisualMatchSpec['compare'],
): GradeResult {
  const details: GradeDetail[] = compare.selectors.map((selector) => {
    const want = target[selector];
    const got = learner[selector];
    if (!got?.found || !got.box) return { label: selector, passed: false, message: 'is missing' };
    if (!want?.box)
      return { label: selector, passed: false, message: 'is missing from the target' };
    const problems: string[] = [];
    for (const key of BOX_KEYS) {
      const a = got.box[key];
      const b = want.box[key];
      if (Math.abs(a - b) > compare.tolerancePx) {
        problems.push(
          `${key === 'x' ? 'left edge' : key === 'y' ? 'top edge' : key} is ${round(a)}px, target ${round(b)}px`,
        );
      }
    }
    for (const property of compare.properties) {
      const a = got.styles?.[property]?.trim();
      const b = want.styles?.[property]?.trim();
      if (a !== b) problems.push(`${property} is ${a || '(none)'}, target ${b || '(none)'}`);
    }
    return problems.length
      ? { label: selector, passed: false, message: problems.join('; ') }
      : { label: selector, passed: true };
  });
  const failing = details.filter((d) => !d.passed);
  if (failing.length === 0) return { passed: true, feedback: 'Matches the target.', details };
  const first = failing[0] as GradeDetail;
  return {
    passed: false,
    feedback: `${details.length - failing.length} of ${details.length} elements match. \`${first.label}\`: ${first.message}.`,
    details,
  };
}

export default defineChallengeType<VisualMatchSpec, VisualMatchAnswer>({
  type: 'visual-match',
  label: 'Match the design',
  defaultXp: 20,
  async grade(spec, css, ctx) {
    const runner = await ctx.runners.get('web-sandbox');
    if (!runner) return { passed: false, feedback: 'The web sandbox is not available.' };
    const measure = { selectors: spec.compare.selectors, properties: spec.compare.properties };
    const page = (style: string) => ({
      files: { 'index.html': spec.html, 'style.css': style },
      measure,
      viewport: spec.viewport,
    });
    const [target, learner] = await Promise.all([
      runner.run(page(spec.targetCss)),
      runner.run(page(css)),
    ]);
    return compareLayouts(target.measurements ?? {}, learner.measurements ?? {}, spec.compare);
  },
  View: () => import('./View.tsx'),
});
