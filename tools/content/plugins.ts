/**
 * Build-time plugin discovery: challenges/types/<type>/build.ts and visualizers/<id>/build.ts.
 * Adding a folder adds a plugin; nothing here lists them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  ChallengeBuild,
  VisualizerBuild,
} from '../../src/engine/challenges/build-contract.ts';
import { ROOT } from './load.ts';

export interface Plugins {
  challenges: Map<string, ChallengeBuild>;
  visualizers: Map<string, VisualizerBuild>;
}

async function discover<T extends { type?: string; id?: string }>(dir: string): Promise<T[]> {
  const out: T[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, name, 'build.ts');
    if (!fs.existsSync(file)) continue;
    const mod = (await import(pathToFileURL(file).href)) as { default: T };
    out.push(mod.default);
  }
  return out;
}

let cached: Promise<Plugins> | undefined;

export function loadPlugins(): Promise<Plugins> {
  cached ??= (async () => {
    const challenges = await discover<ChallengeBuild>(
      path.join(ROOT, 'src/engine/challenges/types'),
    );
    const visualizers = await discover<VisualizerBuild>(path.join(ROOT, 'src/visualizers'));
    return {
      challenges: new Map(challenges.map((c) => [c.type, c])),
      visualizers: new Map(visualizers.map((v) => [v.id, v])),
    };
  })();
  return cached;
}
