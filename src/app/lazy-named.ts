import { lazy, type ComponentType } from 'react';

/**
 * React.lazy for modules with named exports, so route modules keep the project's
 * named-export convention (only visualizer/challenge View.tsx files export default).
 */
export function lazyNamed<M extends Record<K, ComponentType>, K extends keyof M & string>(
  loader: () => Promise<M>,
  name: K,
) {
  return lazy(async () => ({ default: (await loader())[name] }));
}
