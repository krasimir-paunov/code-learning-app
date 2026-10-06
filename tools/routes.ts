import { stripBackticks } from '../src/engine/content/text.ts';
import { formatIssues, loadContent } from './content/index.ts';

export interface StaticRoute {
  path: string;
  title: string;
  description: string;
  /** Vite manifest keys of lazy chunks this route needs right away (modulepreloaded). */
  preload?: string[];
}

const PAGES = {
  landing: 'src/features/landing/LandingPage.tsx',
  map: 'src/features/map/MapPage.tsx',
  lesson: 'src/features/lesson/LessonPage.tsx',
  sheets: 'src/features/cheatsheets/CheatSheetsPage.tsx',
  profile: 'src/features/profile/ProfilePage.tsx',
};

/** Every route the static host must answer with 200 (one shell per lesson and module). */
export async function listRoutes(options: { fixtures?: boolean } = {}): Promise<StaticRoute[]> {
  const { manifest, sheets, issues } = await loadContent(options);
  if (issues.length) throw new Error(`Content problems:\n${formatIssues(issues)}`);
  const routes: StaticRoute[] = [
    {
      path: '/',
      title: 'Learn to code by doing',
      description: 'Interactive lessons from HTML to .NET.',
      preload: [PAGES.landing],
    },
    {
      path: '/map/',
      title: 'Skill map',
      description: 'Every lesson on one map.',
      preload: [PAGES.map],
    },
    {
      path: '/profile/',
      title: 'Profile',
      description: 'XP, streaks, settings and backups.',
      preload: [PAGES.profile],
    },
  ];
  routes.push({
    path: '/cheatsheets/',
    title: 'Cheat sheets',
    description: 'Searchable, printable cheat sheets for every track.',
    preload: [PAGES.sheets],
  });
  for (const sheet of sheets) {
    routes.push({
      path: `/cheatsheets/${sheet.compiled.track}/`,
      title: `${sheet.compiled.title} cheat sheet`,
      description: `${sheet.compiled.title} at a glance: verified snippets with one-line explanations.`,
      preload: [PAGES.sheets],
    });
  }
  for (const module of Object.values(manifest.modules)) {
    routes.push({
      path: `/map/${module.id}/`,
      title: `${module.title} · Skill map`,
      description: `Lessons in ${module.title}.`,
      preload: [PAGES.map],
    });
  }
  for (const id of manifest.order) {
    const node = manifest.nodes[id];
    if (!node) continue;
    routes.push({
      path: `/learn/${id}/`,
      title: stripBackticks(node.title),
      description: stripBackticks(node.summary ?? node.objective),
      // Published lessons also preload their content chunk (the lesson's main text).
      preload: [PAGES.lesson, ...(node.published ? [`virtual:content/lesson/${id}/data`] : [])],
    });
  }
  return routes;
}
