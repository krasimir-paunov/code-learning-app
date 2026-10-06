/**
 * Serves validated content as virtual modules:
 * - virtual:content/manifest     → the skill graph with build-time layout (small, shared)
 * - virtual:content/lessons      → { [lessonId]: () => import(lesson chunk) }
 * - virtual:content/cheatsheets  → every compiled sheet (loaded by the cheat-sheet route)
 * - virtual:content/lesson/<id>/data → one compiled lesson (lazy JSON chunk). The /data suffix
 *   keeps ids like `js.json` from looking like a .json file to Vite.
 * The content tooling is loaded through tsx so it shares the app's TypeScript schemas.
 * Any content error fails the build (and shows the dev overlay) with file and path.
 */
import path from 'node:path';
import { tsImport } from 'tsx/esm/api';
import type { Plugin, ViteDevServer } from 'vite';
import type * as ContentTools from '../content/index.ts';

type ContentModule = typeof ContentTools;
type Bundle = Awaited<ReturnType<ContentModule['loadContent']>>;

const PREFIX = 'virtual:content/';

/** Planned lessons are never opened in the app, so their objectives stay out of the bundle. */
function runtimeManifest(manifest: Bundle['manifest']): Bundle['manifest'] {
  const nodes = Object.fromEntries(
    Object.entries(manifest.nodes).map(([id, node]) => [
      id,
      node.published ? node : { ...node, objective: '' },
    ]),
  );
  return { ...manifest, nodes };
}
const RESOLVED = `\0${PREFIX}`;

export function contentPlugin({ fixtures = false }: { fixtures?: boolean } = {}): Plugin {
  let pending: Promise<Bundle> | undefined;
  let tools: Promise<ContentModule> | undefined;

  const getTools = () =>
    (tools ??= tsImport('../content/index.ts', import.meta.url) as Promise<ContentModule>);
  const load = () => (pending ??= getTools().then((m) => m.loadContent({ fixtures })));

  function invalidate(server: ViteDevServer) {
    pending = undefined;
    for (const mod of server.moduleGraph.idToModuleMap.values()) {
      if (mod.id?.startsWith(RESOLVED)) server.moduleGraph.invalidateModule(mod);
    }
    server.ws.send({ type: 'full-reload' });
  }

  return {
    name: 'content',
    resolveId(id) {
      if (id.startsWith(PREFIX)) return `\0${id}`;
    },
    async load(id) {
      if (!id.startsWith(RESOLVED)) return;
      const bundle = await load();
      if (bundle.issues.length) {
        const { formatIssues } = await getTools();
        this.error(
          `Content has ${bundle.issues.length} problem(s):\n${formatIssues(bundle.issues)}`,
        );
      }
      const name = id.slice(RESOLVED.length);
      if (name === 'manifest') {
        return `export default ${JSON.stringify(runtimeManifest(bundle.manifest))};`;
      }
      if (name === 'cheatsheets') {
        return `export default ${JSON.stringify(bundle.sheets.map((s) => s.compiled))};`;
      }
      if (name === 'lessons') {
        // One lazy chunk per lesson, keyed by id.
        const entries = bundle.lessons.map(
          (l) =>
            `${JSON.stringify(l.id)}: () => import(${JSON.stringify(`${PREFIX}lesson/${l.id}/data`)})`,
        );
        return `export const lessonLoaders = {${entries.join(',')}};`;
      }
      const lessonId = /^lesson\/(.+)\/data$/.exec(name)?.[1];
      if (lessonId) {
        const lesson = bundle.lessons.find((l) => l.id === lessonId);
        if (lesson) return `export default ${JSON.stringify(lesson.compiled)};`;
      }
      this.error(`Unknown content module "${name}"`);
    },
    configureServer(server) {
      const contentDirs = [path.resolve('content'), path.resolve('tests/fixtures/content')];
      server.watcher.add(contentDirs);
      const onChange = (file: string) => {
        if (contentDirs.some((dir) => path.resolve(file).startsWith(dir))) invalidate(server);
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
