import { useEffect, type ReactNode } from 'react';
import {
  MotionContext,
  resolveEffects,
  useSystemReducedMotion,
  type EffectsSetting,
} from './motion.ts';

/** Resolves the effects setting and mirrors it on <html data-effects> for CSS. */
export function MotionProvider({
  setting,
  children,
}: {
  setting: EffectsSetting;
  children: ReactNode;
}) {
  const level = resolveEffects(setting, useSystemReducedMotion());

  useEffect(() => {
    document.documentElement.dataset.effects = level;
  }, [level]);

  return <MotionContext value={level}>{children}</MotionContext>;
}
