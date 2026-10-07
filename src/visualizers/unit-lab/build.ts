import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const UNIT = z.enum(['px', 'rem', 'em', '%', 'ch', 'vw']);

export const UnitLabPropsSchema = z.strictObject({
  lengths: z
    .array(z.strictObject({ value: z.number().positive(), unit: UNIT }))
    .min(2)
    .max(8),
  /** Font used for em and ch (a system font, so measuring "0" is reliable). */
  fontFamily: z.string().default('Georgia, serif'),
  defaults: z
    .strictObject({
      rootFont: z.number().default(16),
      font: z.number().default(20),
      parentWidth: z.number().default(400),
      viewportWidth: z.number().default(1280),
    })
    .default({ rootFont: 16, font: 20, parentWidth: 400, viewportWidth: 1280 }),
});

export type UnitLabProps = z.infer<typeof UnitLabPropsSchema>;

export default {
  id: 'unit-lab',
  props: UnitLabPropsSchema,
} satisfies VisualizerBuild<UnitLabProps>;
