import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { BINARY_SEARCH_CODE } from '../shared/algorithms/searching.ts';
import { probeSteps } from './model.ts';

const Algorithm = z.enum(['linear', 'binary']);
const SIZES = [8, 16, 32, 64, 128, 256, 512, 1024];

const Authored = z.strictObject({
  algorithms: z.array(Algorithm).min(1).max(2),
  size: z
    .strictObject({
      min: z
        .number()
        .int()
        .refine((n) => SIZES.includes(n), 'sizes are powers of two from 8 to 1024'),
      max: z
        .number()
        .int()
        .refine((n) => SIZES.includes(n), 'sizes are powers of two from 8 to 1024'),
      default: z
        .number()
        .int()
        .refine((n) => SIZES.includes(n), 'sizes are powers of two from 8 to 1024'),
    })
    .default({ min: 8, max: 1024, default: 32 }),
  target: z.enum(['random-present', 'random-missing']).default('random-present'),
  controls: z
    .array(z.enum(['size', 'target', 'speed', 'step']))
    .default(['size', 'target', 'speed', 'step']),
  showComplexity: z.boolean().default(true),
});

type AuthoredProps = z.infer<typeof Authored>;

export interface SearchRaceProps extends AuthoredProps {
  sizes: number[];
  /** Highlighted binary search code for step mode (compiled at build time). */
  binaryCodeLines: string[];
}

const TraceProps = z
  .strictObject({
    algorithm: Algorithm,
    array: z.array(z.number()).min(1).max(32),
    target: z.number(),
  })
  .refine((p) => p.array.every((v, i) => i === 0 || (p.array[i - 1] as number) <= v), {
    message: 'searching needs a sorted array',
  });

export type SearchTraceProps = z.infer<typeof TraceProps>;

export default {
  id: 'search-race',
  props: Authored,
  compile: (props, ctx) => ({
    ...props,
    sizes: SIZES.filter((n) => n >= props.size.min && n <= props.size.max),
    binaryCodeLines: ctx.highlightLines(BINARY_SEARCH_CODE, 'js'),
  }),
  trace: {
    props: TraceProps,
    // A trace step is the index the algorithm checks next.
    steps: (p) => probeSteps(p.algorithm, p.array, p.target),
  },
} satisfies VisualizerBuild<AuthoredProps, SearchTraceProps, SearchRaceProps>;
