import { z } from 'zod';

/** "2026-10-06" in the learner's local time zone. */
export const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const Timestamp = z.iso.datetime({ offset: true });

export const ChallengeProgressSchema = z.object({
  attempts: z.number().int().min(0),
  hintsUsed: z.number().int().min(0),
  revealed: z.boolean(),
  passedAt: Timestamp.optional(),
  /** Snapshot at award time: rule changes are never retroactive. */
  xp: z.number().int().min(0),
});

export const LessonProgressSchema = z.object({
  startedAt: Timestamp,
  completedAt: Timestamp.optional(),
  /** lesson.version when completed. */
  contentVersion: z.number().int().min(0),
  /** Awarded once, on completion. */
  completionXp: z.number().int().min(0),
  challenges: z.record(z.string(), ChallengeProgressSchema),
});

export const SettingsSchema = z.object({
  freeRoam: z.boolean(),
  effects: z.enum(['system', 'full', 'reduced', 'off']),
  preferredCodeTab: z.enum(['js', 'cs']),
  editorFontSize: z.number().int().min(12).max(24),
});

export const ProgressV1Schema = z.object({
  schemaVersion: z.literal(1),
  createdAt: Timestamp,
  lessons: z.record(z.string(), LessonProgressSchema),
  activity: z.record(
    LocalDateSchema,
    z.object({ xp: z.number().int().min(0), passed: z.number().int().min(0) }),
  ),
  /** The level-up moment plays once per level. */
  lastCelebratedLevel: z.number().int().min(1),
  /** Tracks whose "Recommended path" banner was skipped. */
  skippedRecommendations: z.array(z.string()),
  settings: SettingsSchema,
});

export type ProgressV1 = z.infer<typeof ProgressV1Schema>;
export type Progress = ProgressV1;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type ChallengeProgress = z.infer<typeof ChallengeProgressSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  freeRoam: false,
  effects: 'system',
  preferredCodeTab: 'js',
  editorFontSize: 15,
};

export function createEmptyProgress(now: Date): Progress {
  return {
    schemaVersion: 1,
    createdAt: now.toISOString(),
    lessons: {},
    activity: {},
    lastCelebratedLevel: 1,
    skippedRecommendations: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
