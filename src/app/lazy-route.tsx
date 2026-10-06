import { createElement, lazy, type ComponentType } from 'react';

export interface LazyRoute {
  Component: ComponentType;
  /** Loads the module; afterwards the route renders without suspending. */
  preload(): Promise<void>;
}

/**
 * A lazily loaded route module (named export) that can be preloaded. Once loaded it renders the
 * real component directly. That matters on first load: a route that suspends makes React commit
 * the shell's fallback and then hold the reveal for its ~300 ms anti-flicker throttle, even when
 * the chunk was already in cache. Preloading the initial route before the first render avoids
 * suspending at all.
 */
export function lazyRoute<M extends Record<K, ComponentType>, K extends keyof M & string>(
  loader: () => Promise<M>,
  name: K,
): LazyRoute {
  let loaded: ComponentType | undefined;
  const load = async (): Promise<ComponentType> => {
    const component: ComponentType = (await loader())[name];
    loaded = component;
    return component;
  };
  const Lazy = lazy<ComponentType>(async () => ({ default: await load() }));

  function Component() {
    // createElement, not a capitalised alias in JSX: the React Compiler folds `const Loaded =
    // loaded` back into `loaded`, which JSX then treats as an intrinsic <loaded> element.
    return loaded ? createElement(loaded) : <Lazy />;
  }

  return {
    Component,
    preload: async () => {
      await load();
    },
  };
}
