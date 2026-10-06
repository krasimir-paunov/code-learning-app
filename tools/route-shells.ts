/**
 * GitHub Pages has no SPA rewrites, so every known route gets its own index.html copy
 * (with a route-specific <title> and description). Deep links return 200 and share well.
 * Anything else falls back to 404.html, which boots the same app.
 *
 * Each shell also modulepreloads the route's own lazy chunks (and, for lessons, the lesson's
 * data chunk) so they download in parallel with the entry instead of after it.
 *
 * Usage: tsx tools/route-shells.ts [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { APP_NAME } from '../src/config/app.ts';
import { listRoutes, type StaticRoute } from './routes.ts';

interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
}

const outDir = path.resolve(process.argv[2] ?? 'dist');
const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const manifest = JSON.parse(
  fs.readFileSync(path.join(outDir, '.vite', 'manifest.json'), 'utf8'),
) as Record<string, ManifestChunk>;
const entry = Object.values(manifest).find((c) => c.isEntry);
const base = new RegExp(`src="([^"]*)${entry?.file ?? '@@'}"`).exec(template)?.[1] ?? '/';

function staticGraph(key: string, seen = new Set<string>()): Set<string> {
  const chunk = manifest[key];
  if (!chunk || seen.has(chunk.file)) return seen;
  seen.add(chunk.file);
  for (const dep of chunk.imports ?? []) staticGraph(dep, seen);
  return seen;
}

const initial = staticGraph(Object.keys(manifest).find((k) => manifest[k]?.isEntry) ?? '');

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function shell(title: string, description: string, preload: readonly string[] = []): string {
  const files = new Set<string>();
  for (const key of preload)
    for (const file of staticGraph(key)) if (!initial.has(file)) files.add(file);
  const links = [...files].map(
    (file) => `<link rel="modulepreload" crossorigin href="${base}${file}">`,
  );
  return template
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(title)} · ${escapeHtml(APP_NAME)}</title>`,
    )
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    )
    .replace('</head>', `${links.join('\n    ')}\n  </head>`);
}

function write(route: StaticRoute) {
  const dir = path.join(outDir, ...route.path.split('/').filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    shell(route.title, route.description, route.preload),
  );
}

const routes = await listRoutes({ fixtures: process.argv[2] === 'dist-e2e' });
fs.writeFileSync(path.join(outDir, '404.html'), shell('Not found', 'This page does not exist.'));
for (const route of routes) write(route);
// Pages would otherwise run Jekyll and drop folders that start with an underscore.
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

console.log(`route-shells: wrote ${routes.length} route shells + 404.html to ${outDir}`);
