import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ChallengeRuntime, ChallengeViewProps } from './contract.ts';

/**
 * Discovered, not listed: adding challenges/types/<type>/index.ts registers a type.
 * The pure part is eager (small); each View stays a lazy chunk.
 */
const modules = import.meta.glob<{ default: ChallengeRuntime<unknown, unknown> }>(
  './types/*/index.ts',
  { eager: true },
);

export const challengeTypes: Readonly<Record<string, ChallengeRuntime<unknown, unknown>>> =
  Object.fromEntries(Object.values(modules).map((m) => [m.default.type, m.default]));

/** Lazy views created once at load (never during render). */
export const challengeViews: Readonly<
  Record<string, LazyExoticComponent<ComponentType<ChallengeViewProps<unknown, unknown>>>>
> = Object.fromEntries(Object.entries(challengeTypes).map(([type, t]) => [type, lazy(t.View)]));
