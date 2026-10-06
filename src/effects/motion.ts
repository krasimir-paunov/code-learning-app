import { createContext, useContext, useSyncExternalStore } from 'react';

/** The learner's setting (DESIGN §4). 'system' follows prefers-reduced-motion. */
export type EffectsSetting = 'system' | 'full' | 'reduced' | 'off';
/** What actually applies after resolving 'system'. */
export type EffectsLevel = 'full' | 'reduced' | 'off';

export function resolveEffects(
  setting: EffectsSetting,
  systemPrefersReduced: boolean,
): EffectsLevel {
  if (setting === 'system') return systemPrefersReduced ? 'reduced' : 'full';
  return setting;
}

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export const MotionContext = createContext<EffectsLevel>('full');

/** The single motion switch every effect and visualizer reads. */
export function useMotionPreference(): EffectsLevel {
  return useContext(MotionContext);
}
