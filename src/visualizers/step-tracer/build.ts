import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { TRACEABLE, TRACEABLE_IDS } from '../shared/algorithms/traceable.ts';

const Authored = z
  .strictObject({
    algorithm: z.enum(TRACEABLE_IDS),
    array: z.array(z.number()).min(1).max(40),
    target: z.number(),
  })
  .refine((p) => p.array.every((v, i) => i === 0 || (p.array[i - 1] as number) <= v), {
    message: 'searching needs a sorted array',
  });

type AuthoredProps = z.infer<typeof Authored>;

export interface StepTracerProps extends AuthoredProps {
  /** Highlighted reference code, one HTML line each (compiled at build time). */
  codeLines: string[];
}

export default {
  id: 'step-tracer',
  props: Authored,
  compile: (props, ctx) => ({
    ...props,
    codeLines: ctx.highlightLines(TRACEABLE[props.algorithm].code, 'js'),
  }),
} satisfies VisualizerBuild<AuthoredProps, never, StepTracerProps>;
