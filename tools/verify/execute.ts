/**
 * Executes a snippet with its declared verify kind and returns stdout. Every "this prints X"
 * claim in the content goes through here.
 */
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { VerifyKind } from '../../src/engine/content/lesson-schema.ts';
import { runInBrowser } from './browser.ts';

const exec = promisify(execFile);
const WORK = path.join(os.tmpdir(), 'pneon-verify');

function workDir(code: string): string {
  const dir = path.join(WORK, crypto.createHash('sha256').update(code).digest('hex').slice(0, 16));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function run(command: string, args: string[], cwd: string, timeout: number) {
  try {
    const { stdout } = await exec(command, args, {
      cwd,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === 'win32',
    });
    return stdout;
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; message: string };
    throw new Error(
      `${command} ${args.join(' ')} failed: ${(e.stderr || e.stdout || e.message).trim().slice(0, 1500)}`,
    );
  }
}

/** Tool versions are part of the cache key: a new SDK re-verifies everything. */
export async function toolVersions(): Promise<Record<string, string>> {
  const dotnet = await run('dotnet', ['--version'], os.tmpdir(), 60_000).catch(() => 'missing');
  return { node: process.version, dotnet: dotnet.trim() };
}

export async function execute(code: string, lang: string, verify: VerifyKind): Promise<string> {
  switch (verify) {
    case 'node': {
      if (lang !== 'js') throw new Error(`verify: node needs a js snippet (got ${lang})`);
      const dir = workDir(code);
      // An ES module, so snippets can use top-level await like modern code does.
      fs.writeFileSync(path.join(dir, 'snippet.mjs'), code);
      return run('node', ['snippet.mjs'], dir, 20_000);
    }
    case 'browser': {
      const name = { html: 'index.html', js: 'main.js' }[lang];
      if (!name) throw new Error(`verify: browser needs an html or js snippet (got ${lang})`);
      const result = await runInBrowser({ files: { [name]: code }, timeoutMs: 10_000 });
      if (result.status !== 'ok') {
        throw new Error(
          `browser run ${result.status}: ${result.diagnostics.map((d) => d.message).join('; ')}`,
        );
      }
      return result.stdout.map((e) => e.text).join('\n');
    }
    case 'dotnet':
    case 'dotnet-build': {
      if (lang !== 'cs') throw new Error(`verify: ${verify} needs a cs snippet (got ${lang})`);
      const dir = workDir(code);
      fs.writeFileSync(path.join(dir, 'Snippet.cs'), code);
      // .NET 10 file-based apps: no project file needed.
      return verify === 'dotnet'
        ? run('dotnet', ['run', 'Snippet.cs'], dir, 300_000)
        : run('dotnet', ['build', 'Snippet.cs'], dir, 300_000).then(() => '');
    }
    case 'tsc': {
      if (lang !== 'ts') throw new Error(`verify: tsc needs a ts snippet (got ${lang})`);
      const dir = workDir(code);
      fs.writeFileSync(path.join(dir, 'snippet.ts'), code);
      const tsc = path.resolve(import.meta.dirname, '../../node_modules/typescript/bin/tsc');
      // Diagnostics are the output: learners see the compiler's own words.
      return run(
        'node',
        [tsc, '--noEmit', '--strict', '--target', 'es2023', 'snippet.ts'],
        dir,
        60_000,
      ).catch((error: Error) => error.message.replace(/^[\s\S]*?failed: /, ''));
    }
    case 'none':
      throw new Error('verify: none is never executed');
  }
}
