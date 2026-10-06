export interface StaticRoute {
  path: string;
  title: string;
  description: string;
}

/** Every route the static host must answer with 200. */
export async function listRoutes(): Promise<StaticRoute[]> {
  return [
    { path: '/map/', title: 'Skill map', description: 'Every lesson on one map.' },
    { path: '/profile/', title: 'Profile', description: 'XP, streaks, settings and backups.' },
  ];
}
