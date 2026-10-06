import { CURRENT_SCHEMA_VERSION, ProgressV1Schema, type Progress } from '../schema.ts';

export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * MIGRATIONS[n] upgrades data from schemaVersion n to n + 1. When ProgressV2 exists, add
 * `v1-to-v2.ts` (with fixture tests) and register it as MIGRATIONS[1]. Saved progress is
 * never discarded: old data is always upgraded, step by step.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export type MigrateResult = { ok: true; progress: Progress } | { ok: false; error: string };

function describeIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

export function migrate(
  raw: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = CURRENT_SCHEMA_VERSION,
): MigrateResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Progress data must be an object.' };
  }
  let data = raw as Record<string, unknown>;
  let version = data.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    return { ok: false, error: 'Progress data has no valid schemaVersion.' };
  }
  if (version > target) {
    return {
      ok: false,
      error: `This progress was saved by a newer version of the app (schema ${version}). Update the app and try again.`,
    };
  }
  while (version < target) {
    const step = migrations[version];
    if (!step) return { ok: false, error: `No migration from schema ${version}.` };
    data = step(data);
    version += 1;
    data = { ...data, schemaVersion: version };
  }
  const parsed = ProgressV1Schema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: `Progress data is damaged: ${describeIssues(parsed.error)}.` };
  }
  return { ok: true, progress: parsed.data };
}
