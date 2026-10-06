import { loadLesson } from '../features/lesson/lesson-data.ts';
import { lazyRoute } from './lazy-route.tsx';

export const landing = lazyRoute(
  () => import('../features/landing/LandingPage.tsx'),
  'LandingPage',
);
export const map = lazyRoute(() => import('../features/map/MapPage.tsx'), 'MapPage');
export const lesson = lazyRoute(() => import('../features/lesson/LessonPage.tsx'), 'LessonPage');
export const sheets = lazyRoute(
  () => import('../features/cheatsheets/CheatSheetsPage.tsx'),
  'CheatSheetsPage',
);
export const profile = lazyRoute(
  () => import('../features/profile/ProfilePage.tsx'),
  'ProfilePage',
);
export const notFound = lazyRoute(() => import('./NotFoundPage.tsx'), 'NotFoundPage');

/**
 * Loads what the first screen needs before the first render (route module and, for a lesson,
 * its content), so the initial page never suspends. `path` is relative to the base URL.
 */
export async function preloadRoute(path: string): Promise<void> {
  const [, first = '', second] = path.split('/');
  const route =
    { '': landing, map, learn: lesson, cheatsheets: sheets, profile }[first] ?? notFound;
  await Promise.all([
    route.preload(),
    first === 'learn' && second ? loadLesson(second) : undefined,
  ]);
}
