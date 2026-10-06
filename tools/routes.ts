import { stripBackticks } from '../src/engine/content/text.ts';
import { formatIssues, loadContent } from './content/index.ts';

export interface StaticRoute {
  path: string;
  title: string;
  description: string;
}

/** Every route the static host must answer with 200 (one shell per lesson and module). */
export async function listRoutes(options: { fixtures?: boolean } = {}): Promise<StaticRoute[]> {
  const { manifest, sheets, issues } = await loadContent(options);
  if (issues.length) throw new Error(`Content problems:\n${formatIssues(issues)}`);
  const routes: StaticRoute[] = [
    { path: '/map/', title: 'Skill map', description: 'Every lesson on one map.' },
    { path: '/profile/', title: 'Profile', description: 'XP, streaks, settings and backups.' },
  ];
  routes.push({
    path: '/cheatsheets/',
    title: 'Cheat sheets',
    description: 'Searchable, printable cheat sheets for every track.',
  });
  for (const sheet of sheets) {
    routes.push({
      path: `/cheatsheets/${sheet.compiled.track}/`,
      title: `${sheet.compiled.title} cheat sheet`,
      description: `${sheet.compiled.title} at a glance: verified snippets with one-line explanations.`,
    });
  }
  for (const module of Object.values(manifest.modules)) {
    routes.push({
      path: `/map/${module.id}/`,
      title: `${module.title} · Skill map`,
      description: `Lessons in ${module.title}.`,
    });
  }
  for (const id of manifest.order) {
    const node = manifest.nodes[id];
    if (!node) continue;
    routes.push({
      path: `/learn/${id}/`,
      title: stripBackticks(node.title),
      description: stripBackticks(node.summary ?? node.objective),
    });
  }
  return routes;
}
