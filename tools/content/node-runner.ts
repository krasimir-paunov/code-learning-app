/**
 * Build-time twin of the web sandbox: runs learner-style JS plus tests in node:vm with the
 * same test harness and loop guard, so content checks prove "solution passes, starter fails"
 * with exactly the code the browser runs.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import type { ConsoleEntry, RunResult, TestResult } from '../../src/engine/runners/contract.ts';
import { guardLoops } from '../../src/engine/runners/loop-guard.ts';

const HARNESS = fs.readFileSync(
  path.resolve(import.meta.dirname, '../../src/engine/test-harness/harness.js'),
  'utf8',
);

export interface NodeRunRequest {
  /** JavaScript files, run in order as classic scripts sharing one global scope. */
  files: Record<string, string>;
  tests?: string;
  timeoutMs?: number;
}

function stringify(value: unknown, format: (v: unknown) => string): string {
  return typeof value === 'string' ? value : format(value);
}

export async function runInNode({
  files,
  tests,
  timeoutMs = 3000,
}: NodeRunRequest): Promise<RunResult> {
  const started = performance.now();
  const stdout: ConsoleEntry[] = [];
  const context = vm.createContext({ setTimeout, clearTimeout, queueMicrotask });
  vm.runInContext(HARNESS, context, { filename: 'harness.js' });
  const harness = context.__harness as {
    run(): Promise<TestResult[]>;
    format(value: unknown): string;
  };
  const log =
    (level: ConsoleEntry['level']) =>
    (...args: unknown[]) =>
      stdout.push({ level, text: args.map((a) => stringify(a, harness.format)).join(' ') });
  context.console = { log: log('log'), info: log('info'), warn: log('warn'), error: log('error') };

  const result = (status: RunResult['status'], extra: Partial<RunResult> = {}): RunResult => ({
    status,
    stdout,
    diagnostics: [],
    tests: [],
    durationMs: performance.now() - started,
    ...extra,
  });

  const sources = Object.entries(files);
  if (tests !== undefined) sources.push(['tests.js', tests]);
  for (const [filename, source] of sources) {
    const guarded = guardLoops(source);
    if (!guarded.ok)
      return result('compile-error', {
        diagnostics: [
          { ...guarded.diagnostic, message: `${filename}: ${guarded.diagnostic.message}` },
        ],
      });
    try {
      vm.runInContext(guarded.code, context, { filename, timeout: timeoutMs });
    } catch (error) {
      const e = error as Error;
      const timedOut = /Script execution timed out/.test(e.message);
      return result(timedOut ? 'timeout' : 'runtime-error', {
        diagnostics: [{ message: `${e.name}: ${e.message}`, severity: 'error' }],
      });
    }
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const testResults = await Promise.race([
    harness.run(),
    new Promise<TestResult[]>((resolve) => {
      timer = setTimeout(
        () => resolve([{ name: 'tests', passed: false, message: 'Tests timed out' }]),
        timeoutMs,
      );
    }),
  ]);
  clearTimeout(timer);
  return result('ok', { tests: testResults });
}
