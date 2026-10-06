/**
 * npm run content:check — schemas, ids, prerequisite graph, references, anatomy rules and
 * parity between content/curriculum.yaml and docs/CURRICULUM.md. Exits 1 on any problem.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseCurriculumMd } from './content/curriculum-md.ts';
import { formatIssues, loadContent } from './content/index.ts';
import { readCurriculum, ROOT, type ContentIssue } from './content/load.ts';
import { checkParity } from './content/parity.ts';

const bundle = await loadContent();
const issues: ContentIssue[] = [...bundle.issues];

const curriculum = readCurriculum([]);
if (curriculum) {
  const md = parseCurriculumMd(fs.readFileSync(path.join(ROOT, 'docs', 'CURRICULUM.md'), 'utf8'));
  for (const message of checkParity(md, curriculum, bundle.manifest)) {
    issues.push({ file: 'docs/CURRICULUM.md ↔ content/curriculum.yaml', message });
  }
}

const nodes = Object.values(bundle.manifest.nodes);
const published = nodes.filter((n) => n.published);
console.log(
  `content:check: ${nodes.length} lessons (${nodes.filter((n) => n.tier === 'core').length} Core), ` +
    `${published.length} published: ${published.map((n) => n.id).join(', ') || 'none'}`,
);
if (issues.length) {
  console.error(`\n${issues.length} problem(s):\n${formatIssues(issues)}`);
  process.exit(1);
}
console.log('content:check: OK');
