/**
 * Relative URL resolution as a walk through folders: where it starts, each step, where it ends.
 * The end point always equals what `new URL(href, page)` gives; the walk explains it.
 */

export interface Walk {
  kind: 'relative' | 'root' | 'other-site' | 'fragment' | 'invalid';
  /** Folder the walk starts in (relative links start beside the current page). */
  start: string;
  steps: { segment: string; path: string; note: string }[];
  /** The resolved URL as the browser computes it. */
  resolved?: URL;
}

const dirOf = (pathname: string) => pathname.replace(/[^/]*$/, '');

export function walk(href: string, pageUrl: string): Walk {
  const page = new URL(pageUrl);
  let resolved: URL;
  try {
    resolved = new URL(href, page);
  } catch {
    return { kind: 'invalid', start: dirOf(page.pathname), steps: [] };
  }
  if (resolved.origin !== page.origin) {
    return { kind: 'other-site', start: '/', steps: [], resolved };
  }
  if (href.startsWith('#') || href.startsWith('?')) {
    return { kind: 'fragment', start: page.pathname, steps: [], resolved };
  }
  const fromRoot = href.startsWith('/');
  const pathPart = href.split(/[?#]/)[0] ?? '';
  const segments = pathPart.split('/');
  if (fromRoot) segments.shift();
  let dir = fromRoot ? '/' : dirOf(page.pathname);
  const start = dir;
  const steps: Walk['steps'] = [];
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1;
    if (segment === '..') {
      const up = dir === '/' ? '/' : dir.replace(/[^/]+\/$/, '');
      steps.push({
        segment,
        path: up,
        note: dir === '/' ? 'Already at the root: .. goes no higher.' : `Up one folder to ${up}`,
      });
      dir = up;
    } else if (segment === '.') {
      steps.push({ segment, path: dir, note: `Stay in ${dir}` });
    } else if (segment === '') {
      // A trailing slash: the path names a folder (servers usually answer with its index page).
    } else if (last) {
      steps.push({ segment, path: dir + segment, note: `Take the file ${segment}` });
    } else {
      dir = `${dir}${segment}/`;
      steps.push({ segment, path: dir, note: `Into the folder ${dir}` });
    }
  });
  return { kind: fromRoot ? 'root' : 'relative', start, steps, resolved };
}

export interface TreeNode {
  name: string;
  path: string;
  folder: boolean;
  children: TreeNode[];
}

/** A folder tree from file paths such as "/blog/2026/spring.html". */
export function buildTree(files: readonly string[]): TreeNode {
  const root: TreeNode = { name: '/', path: '/', folder: true, children: [] };
  for (const file of files) {
    const parts = file.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const folder = i < parts.length - 1;
      const path = `${node.path}${part}${folder ? '/' : ''}`;
      let child = node.children.find((c) => c.path === path);
      if (!child) {
        child = { name: part, path, folder, children: [] };
        node.children.push(child);
      }
      node = child;
    });
  }
  const sort = (n: TreeNode) => {
    n.children.sort((a, b) => Number(b.folder) - Number(a.folder) || a.name.localeCompare(b.name));
    n.children.forEach(sort);
  };
  sort(root);
  return root;
}

/** The folders and file a learner clicks, in order, when tracing a relative link. */
export function traceSteps(href: string, pageUrl: string): string[] {
  return walk(href, pageUrl).steps.map((s) => s.path);
}
