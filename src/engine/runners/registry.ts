import type { RunnerRegistry } from '../challenges/contract.ts';
import type { Runner } from './contract.ts';

/** Runners are discovered (runners/<id>/runner.ts exporting `runner`) and loaded on first use. */
const loaders = import.meta.glob<{ runner: Runner }>('./*/runner.ts');

export const runners: RunnerRegistry = {
  async get(id) {
    const load = loaders[`./${id}/runner.ts`];
    return load ? (await load()).runner : undefined;
  },
};
