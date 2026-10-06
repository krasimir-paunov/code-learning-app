import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import { challengeShape, escapeHtml } from '../../shared/build-helpers.ts';
import type { TraceSpec } from './index.ts';

const schema = z.strictObject({
  ...challengeShape('trace'),
  visualizer: z.string().min(1),
  props: z.unknown(),
  /** Optional author expectation; the build checks it against the visualizer's own trace. */
  expect: z.array(z.unknown()).optional(),
});

type Authored = z.infer<typeof schema>;

/** The visualizer's own steps for these props, and the props with their defaults applied. */
function traceFor(
  c: Authored,
  ctx: Parameters<ChallengeBuild['compile']>[1],
): { props: unknown; steps: unknown[] } {
  const visualizer = ctx.visualizer(c.visualizer);
  if (!visualizer) throw new Error(`unknown visualizer "${c.visualizer}"`);
  if (!visualizer.trace) throw new Error(`visualizer "${c.visualizer}" has no trace mode`);
  const props = visualizer.trace.props.safeParse(c.props);
  if (!props.success)
    throw new Error(
      `props: ${props.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return { props: props.data, steps: visualizer.trace.steps(props.data) };
}

export default {
  type: 'trace',
  defaultXp: 10,
  schema,
  compile(c, ctx) {
    const { props, steps } = traceFor(c, ctx);
    if (steps.length === 0) throw new Error('the trace has no steps');
    // Cross-check: what the author wrote must be what the algorithm actually does.
    if (c.expect && JSON.stringify(c.expect) !== JSON.stringify(steps)) {
      throw new Error(
        `expect ${JSON.stringify(c.expect)} differs from the visualizer's trace ${JSON.stringify(steps)}`,
      );
    }
    // Parsed props: the trace view gets the same defaults the steps were computed with.
    return { visualizer: c.visualizer, props, steps } satisfies TraceSpec;
  },
  solution: (c, ctx) =>
    `<ol>${traceFor(c, ctx)
      .steps.map((s) => `<li><code>${escapeHtml(JSON.stringify(s))}</code></li>`)
      .join('')}</ol>`,
} satisfies ChallengeBuild<Authored, TraceSpec>;
