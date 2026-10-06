/**
 * npm run verify:snippets — executes every output claim (Node, Chromium, dotnet, tsc) and every
 * challenge build check (solution passes, starter fails, distractors fail, traces match).
 * Successes are cached by content hash in .cache/verify.json; set VERIFY_ALL=1 to ignore it.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { BuildCheckContext } from '../src/engine/challenges/build-contract.ts';
import { normalizeOutput } from '../src/engine/challenges/shared/normalize.ts';
import type { CodeBlock } from '../src/engine/content/lesson-schema.ts';
import { formatIssues, loadContent } from './content/index.ts';
import { relative, ROOT } from './content/load.ts';
import { runInNode } from './content/node-runner.ts';
import { closeBrowser, runInBrowser } from './verify/browser.ts';
import { execute, toolVersions } from './verify/execute.ts';

const CACHE_FILE = path.join(ROOT, '.cache', 'verify.json');
const useCache = process.env.VERIFY_ALL !== '1';
const cache: Record<string, string> =
  useCache && fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const versions = await toolVersions();

const bundle = await loadContent();
if (bundle.issues.length) {
  console.error(`Content has problems; run content:check first:\n${formatIssues(bundle.issues)}`);
  process.exit(1);
}

const hash = (...parts: unknown[]) =>
  crypto
    .createHash('sha256')
    .update(JSON.stringify([versions, ...parts]))
    .digest('hex');

let passed = 0;
let cached = 0;
const failures: string[] = [];
const unverified: string[] = [];

async function verify(key: string, label: string, check: () => Promise<string[]>) {
  if (cache[key]) {
    cached++;
    return;
  }
  try {
    const problems = await check();
    if (problems.length) failures.push(...problems.map((p) => `${label}: ${p}`));
    else {
      passed++;
      cache[key] = new Date().toISOString();
    }
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const lesson of bundle.lessons) {
  const file = relative(lesson.file);

  // `verify: none` is allowed only with a reason, and always listed for human review.
  const blocks: [string, CodeBlock | undefined][] = [
    ['concept.code', lesson.authored.concept.code],
    ...lesson.authored.production.map((p, i): [string, CodeBlock | undefined] => [
      `production[${i}].code`,
      p.code,
    ]),
    ['mistake.bad', lesson.authored.mistake.bad],
    ['mistake.good', lesson.authored.mistake.good],
  ];
  for (const [where, block] of blocks) {
    block?.tabs.forEach((tab, i) => {
      if (tab.verify === 'none') unverified.push(`${file} ${where}.tabs[${i}]: ${tab.why}`);
    });
  }

  for (const claim of lesson.claims) {
    const label = `${file} ${claim.where} [${claim.verify}]`;
    await verify(
      hash('claim', claim.code, claim.lang, claim.verify, claim.expected),
      label,
      async () => {
        const actual = await execute(claim.code, claim.lang, claim.verify);
        return normalizeOutput(actual) === normalizeOutput(claim.expected)
          ? []
          : [
              `expected output\n${claim.expected.trimEnd()}\n  but the code printed\n${actual.trimEnd()}`,
            ];
      },
    );
  }

  const ctx: BuildCheckContext = {
    ...lesson.ctx,
    runJs: (files, tests) => runInNode({ files, tests }),
    runInBrowser,
    execute,
  };
  for (const { plugin, data } of lesson.challenges) {
    if (!plugin.buildCheck) continue;
    const label = `${file} challenge "${data.id}" (${data.type})`;
    // Snippet contents are part of the key: editing a test or solution re-runs the check.
    const files = fs.readdirSync(lesson.dir, { recursive: true }).map(String).sort();
    const contents = files.map((f) => {
      const full = path.join(lesson.dir, f);
      return fs.statSync(full).isFile() ? fs.readFileSync(full, 'utf8') : '';
    });
    await verify(
      hash('check', data, contents),
      label,
      () => plugin.buildCheck?.(data, ctx) ?? Promise.resolve([]),
    );
  }
}

await closeBrowser();
fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

console.log(
  `verify:snippets: ${passed} verified, ${cached} unchanged (cached), ${failures.length} failed.`,
);
if (unverified.length)
  console.log(`\nNot executed (verify: none), for review:\n- ${unverified.join('\n- ')}`);
if (failures.length) {
  console.error(`\n${failures.map((f) => `✕ ${f}`).join('\n\n')}`);
  process.exit(1);
}
