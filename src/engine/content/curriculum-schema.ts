import { z } from 'zod';

/** Ids are namespaced kebab-case: "track.slug". Permanent once shipped. */
export const IdSchema = z
  .string()
  .regex(/^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/, 'ids look like "track.kebab-slug"');

export const TierSchema = z.enum(['core', 'extended']);
export type Tier = z.infer<typeof TierSchema>;

const LessonEntrySchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  minutes: z.number().int().min(3).max(10),
  objective: z.string().min(1),
  tier: TierSchema.default('core'),
  /** Extra hard prerequisites (added to the implicit chain). */
  requires: z.array(IdSchema).default([]),
  /** Soft gates: "Recommended path" banner with one-click skip. */
  recommends: z.array(IdSchema).default([]),
  /** Dashed, never-blocking edges. */
  related: z.array(IdSchema).default([]),
});

const ModuleEntrySchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  /** Entry prerequisites; default: the last Core lesson of the previous module in the track. */
  requires: z.array(IdSchema).optional(),
  /** Soft gates applied to the module's first Core lesson. */
  recommends: z.array(IdSchema).default([]),
  boss: z.boolean().default(false),
  lessons: z.array(LessonEntrySchema).min(1),
});

const TrackEntrySchema = z.strictObject({
  id: z.string().regex(/^[a-z]+$/),
  title: z.string().min(1),
  short: z.string().min(1),
  /** A design token name, never a raw color. */
  color: z.string().regex(/^track-[a-z]+$/),
  modules: z.array(ModuleEntrySchema).min(1),
});

export const CurriculumSchema = z.strictObject({
  tracks: z.array(TrackEntrySchema).min(1),
});

export type Curriculum = z.infer<typeof CurriculumSchema>;
export type CurriculumTrack = Curriculum['tracks'][number];
export type CurriculumModule = CurriculumTrack['modules'][number];
export type CurriculumLesson = CurriculumModule['lessons'][number];
