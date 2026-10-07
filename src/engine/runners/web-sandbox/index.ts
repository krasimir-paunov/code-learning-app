import harness from '../../test-harness/harness.js?raw';
import type {
  ConsoleEntry,
  Diagnostic,
  RunRequest,
  RunResult,
  Runner,
  TestResult,
} from '../contract.ts';

const DEFAULT_TIMEOUT_MS = 3000;
const SANDBOX_URL = `${import.meta.env.BASE_URL}sandbox.html`;

type SandboxMessage =
  | { type: 'console'; level: ConsoleEntry['level']; text: string }
  | { type: 'error'; message: string; stack: string; line?: number; column?: number }
  | { type: 'done'; tests: TestResult[]; measurements?: RunResult['measurements'] };

export interface SandboxHandle {
  frame: HTMLIFrameElement;
  /** Settles once the code finished, failed to compile, or timed out. */
  result: Promise<RunResult>;
  dispose(): void;
}

export interface MountOptions {
  /** Accessible name of the frame when it is visible (e.g. "Preview"). */
  title?: string;
  className?: string;
  /** Streamed console output, for live consoles. */
  onConsole?: (entry: ConsoleEntry) => void;
  signal?: AbortSignal;
}

/**
 * Renders and runs code in a fresh sandboxed iframe inside `host`. Every run gets a new
 * realm. A watchdog removes the frame after the timeout (the loop guard usually stops
 * runaway loops first, with a clearer message).
 */
export function mountSandbox(
  host: HTMLElement,
  request: RunRequest,
  options: MountOptions = {},
): SandboxHandle {
  const started = performance.now();
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.title = options.title ?? 'Code sandbox';
  if (options.className) frame.className = options.className;
  if (request.viewport) {
    frame.style.width = `${request.viewport.width}px`;
    frame.style.height = `${request.viewport.height}px`;
    // An exact viewport is the point: the base iframe cap would shrink grading frames to their
    // 1px off-screen host, so pages were measured at the wrong width.
    frame.style.maxInlineSize = 'none';
    frame.style.border = '0';
  }

  const stdout: ConsoleEntry[] = [];
  const diagnostics: Diagnostic[] = [];
  const fileNames = Object.keys(request.files);
  let settle: (result: RunResult) => void = () => {};
  const result = new Promise<RunResult>((resolve) => {
    settle = resolve;
  });
  let done = false;
  const finish = (status: RunResult['status'], extra: Partial<RunResult> = {}) => {
    if (done) return;
    done = true;
    clearTimeout(watchdog);
    channel.port1.close();
    settle({
      status,
      stdout,
      diagnostics,
      tests: [],
      durationMs: performance.now() - started,
      ...extra,
    });
  };

  const channel = new MessageChannel();
  const watchdog = setTimeout(() => {
    frame.remove();
    diagnostics.push({
      message: `Stopped after ${(request.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000} s without finishing.`,
      severity: 'error',
    });
    finish('timeout');
  }, request.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  // The document builder (with the acorn-based loop guard) is its own lazy chunk, so views
  // that embed a sandbox stay small until code actually runs.
  void import('./document.ts').then(({ buildSandboxDocument, locateError }) => {
    if (done) return;
    const built = buildSandboxDocument(request, harness);
    if (!built.ok) {
      diagnostics.push(...built.diagnostics);
      finish('compile-error');
      return;
    }
    channel.port1.onmessage = (event: MessageEvent<SandboxMessage>) => {
      const message = event.data;
      if (message.type === 'console') {
        stdout.push({ level: message.level, text: message.text });
        options.onConsole?.({ level: message.level, text: message.text });
      } else if (message.type === 'error') {
        const where = locateError(message.stack, fileNames);
        diagnostics.push({
          message: message.message,
          severity: 'error',
          ...(where && {
            line: where.line,
            column: where.column,
            message: `${where.file}:${where.line} ${message.message}`,
          }),
        });
      } else if (message.type === 'done') {
        finish(diagnostics.length ? 'runtime-error' : 'ok', {
          tests: message.tests,
          measurements: message.measurements,
        });
      }
    };
    frame.addEventListener(
      'load',
      () =>
        frame.contentWindow?.postMessage({ type: 'run', html: built.html }, '*', [channel.port2]),
      { once: true },
    );
    frame.src = SANDBOX_URL;
    host.append(frame);
  });

  const dispose = () => {
    finish('timeout');
    frame.remove();
  };
  options.signal?.addEventListener('abort', dispose, { once: true });
  return { frame, result, dispose };
}

/** Grading runs happen in an off-screen frame of a fixed size. */
function hiddenHost(): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  });
  document.body.append(host);
  return host;
}

export const webSandbox: Runner = {
  id: 'web-sandbox',
  languages: ['html', 'css', 'js'],
  prepare: async () => {},
  async run(request, signal) {
    const host = hiddenHost();
    const handle = mountSandbox(
      host,
      { viewport: { width: 640, height: 480 }, ...request },
      { signal },
    );
    try {
      return await handle.result;
    } finally {
      handle.dispose();
      host.remove();
    }
  },
};
