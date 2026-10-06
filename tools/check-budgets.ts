/**
 * Enforces the bundle budgets from ARCHITECTURE §12 (gzip sizes) against the Vite manifest.
 *
 * Usage: tsx tools/check-budgets.ts [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

interface ManifestChunk {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
}

const KB = 1024;
const BUDGETS = {
  initialRouteJs: 150 * KB,
  lessonJson: 30 * KB,
  visualizer: 60 * KB,
};

const outDir = path.resolve(process.argv[2] ?? 'dist');
const manifest = JSON.parse(
  fs.readFileSync(path.join(outDir, '.vite', 'manifest.json'), 'utf8'),
) as Record<string, ManifestChunk>;

const gzCache = new Map<string, number>();
function gzipSize(file: string): number {
  let size = gzCache.get(file);
  if (size === undefined) {
    size = zlib.gzipSync(fs.readFileSync(path.join(outDir, file)), { level: 9 }).length;
    gzCache.set(file, size);
  }
  return size;
}

/** Files loaded statically when `key` loads (the chunk itself plus its static imports). */
function staticGraph(key: string, seen = new Set<string>()): Set<string> {
  const chunk = manifest[key];
  if (!chunk || seen.has(chunk.file)) return seen;
  seen.add(chunk.file);
  for (const dep of chunk.imports ?? []) staticGraph(dep, seen);
  return seen;
}

const total = (files: Iterable<string>) => [...files].reduce((sum, f) => sum + gzipSize(f), 0);
const fmt = (bytes: number) => `${(bytes / KB).toFixed(1)} KB`;

const entryKey = Object.keys(manifest).find((k) => manifest[k]?.isEntry);
if (!entryKey) throw new Error('No entry chunk in the Vite manifest');
const initial = staticGraph(entryKey);

const failures: string[] = [];
const report: string[] = [];
function check(label: string, size: number, budget: number) {
  report.push(`${size > budget ? '✕' : '✓'} ${label}: ${fmt(size)} / ${fmt(budget)}`);
  if (size > budget) failures.push(`${label} is ${fmt(size)}, budget ${fmt(budget)}`);
}

check('shell (entry)', total(initial), BUDGETS.initialRouteJs);

for (const [key, chunk] of Object.entries(manifest)) {
  if (!chunk.isDynamicEntry || !chunk.src) continue;
  const own = [...staticGraph(key)].filter((f) => !initial.has(f));
  if (/^src\/features\/[^/]+\/[A-Z]\w*Page\.tsx$/.test(chunk.src)) {
    check(`route ${chunk.src}`, total(initial) + total(own), BUDGETS.initialRouteJs);
  } else if (/^src\/visualizers\/[^/]+\/View\.tsx$/.test(chunk.src)) {
    check(`visualizer ${chunk.src}`, total(own), BUDGETS.visualizer);
  } else if (chunk.src.includes('virtual:content/lesson/')) {
    check(`lesson ${chunk.src.split('/').at(-2)}`, gzipSize(chunk.file), BUDGETS.lessonJson);
  }
}

console.log(report.join('\n'));
if (failures.length) {
  console.error(`\nBundle budget exceeded:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
