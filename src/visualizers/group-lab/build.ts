import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const GroupLabPropsSchema = z.strictObject({
  /** The radio group's question, which becomes the legend. */
  question: z.string().min(1),
  name: z.string().regex(/^[a-z][\w-]*$/),
  options: z.array(z.string().min(1)).min(2).max(5),
  select: z.strictObject({ label: z.string().min(1), options: z.array(z.string().min(1)).min(2) }),
  textarea: z.strictObject({ label: z.string().min(1) }),
});

export type GroupLabProps = z.infer<typeof GroupLabPropsSchema>;

export default {
  id: 'group-lab',
  props: GroupLabPropsSchema,
} satisfies VisualizerBuild<GroupLabProps>;
