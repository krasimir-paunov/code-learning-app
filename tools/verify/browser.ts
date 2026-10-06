/**
 * Headless Chromium for build-time checks: runs pages inside the real sandbox document
 * (same harness, loop guard and finisher as the app) and collects the run result.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from '@playwright/test';
import type {
  ConsoleEntry,
  Diagnostic,
  RunRequest,
  RunResult,
  TestResult,
} from '../../src/engine/runners/contract.ts';
import {
  buildSandboxDocument,
  locateError,
} from '../../src/engine/runners/web-sandbox/document.ts';

const HARNESS = fs.readFileSync(
  path.resolve(import.meta.dirname, '../../src/engine/test-harness/harness.js'),
  'utf8',
);

/** Stands in for the MessageChannel port the app would hand to sandbox.html. */
const PORT_SHIM =
  '<script>window.__port={postMessage:function(m){(window.__messages=window.__messages||[]).push(m)}};</script>';

let browser: Promise<Browser> | undefined;

export function getBrowser(): Promise<Browser> {
  browser ??= chromium.launch();
  return browser;
}

export async function closeBrowser() {
  if (browser) await (await browser).close();
  browser = undefined;
}

type Message =
  | { type: 'console'; level: ConsoleEntry['level']; text: string }
  | { type: 'error'; message: string; stack: string; line?: number }
  | { type: 'done'; tests: TestResult[]; measurements?: RunResult['measurements'] };

export async function runInBrowser(request: RunRequest): Promise<RunResult> {
  const started = performance.now();
  const built = buildSandboxDocument(request, HARNESS);
  if (!built.ok) {
    return {
      status: 'compile-error',
      stdout: [],
      diagnostics: built.diagnostics,
      tests: [],
      durationMs: 0,
    };
  }
  const page = await (
    await getBrowser()
  ).newPage({ viewport: request.viewport ?? { width: 640, height: 480 } });
  try {
    await page.setContent(built.html.replace(/^<!doctype html>/i, `<!doctype html>${PORT_SHIM}`));
    const timeout = request.timeoutMs ?? 5000;
    const finished = await page
      .waitForFunction(
        () =>
          (window as unknown as { __messages?: { type: string }[] }).__messages?.some(
            (m) => m.type === 'done',
          ),
        undefined,
        { timeout },
      )
      .then(
        () => true,
        () => false,
      );
    const messages = (await page.evaluate(
      () => (window as unknown as { __messages?: unknown[] }).__messages ?? [],
    )) as Message[];
    const stdout: ConsoleEntry[] = [];
    const diagnostics: Diagnostic[] = [];
    let done: Extract<Message, { type: 'done' }> | undefined;
    for (const m of messages) {
      if (m.type === 'console') stdout.push({ level: m.level, text: m.text });
      else if (m.type === 'error') {
        const where = locateError(m.stack, Object.keys(request.files));
        diagnostics.push({
          message: m.message,
          severity: 'error',
          ...(where && { line: where.line }),
        });
      } else done = m;
    }
    return {
      status: !finished ? 'timeout' : diagnostics.length ? 'runtime-error' : 'ok',
      stdout,
      diagnostics,
      tests: done?.tests ?? [],
      measurements: done?.measurements,
      durationMs: performance.now() - started,
    };
  } finally {
    await page.close();
  }
}
