/**
 * GitHub Pages has no SPA rewrites, so every known route gets its own index.html copy
 * (with a route-specific <title> and description). Deep links return 200 and share well.
 * Anything else falls back to 404.html, which boots the same app.
 *
 * Usage: tsx tools/route-shells.ts [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { APP_NAME } from '../src/config/app.ts';
import { listRoutes } from './routes.ts';

const outDir = path.resolve(process.argv[2] ?? 'dist');
const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function shell(title: string, description: string): string {
  return template
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(title)} · ${escapeHtml(APP_NAME)}</title>`,
    )
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    );
}

const routes = await listRoutes({ fixtures: process.argv[2] === 'dist-e2e' });
for (const route of routes) {
  const dir = path.join(outDir, ...route.path.split('/').filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell(route.title, route.description));
}
fs.writeFileSync(path.join(outDir, '404.html'), shell('Not found', 'This page does not exist.'));
// Pages would otherwise run Jekyll and drop folders that start with an underscore.
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

console.log(`route-shells: wrote ${routes.length} route shells + 404.html to ${outDir}`);
