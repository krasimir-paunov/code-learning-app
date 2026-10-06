import type { Diagnostic } from './loop-guard.ts';

export type { Diagnostic };

export interface LoadProgress {
  /** 0–1 when known. */
  fraction?: number;
  message: string;
}

export interface RunRequest {
  /** File name → source, e.g. { 'index.html': …, 'style.css': …, 'main.js': … }. */
  files: Record<string, string>;
  /** Test code run after the learner's code, in the same realm. */
  tests?: string;
  timeoutMs?: number;
  /** Collect element boxes and computed styles after layout (visual-match). */
  measure?: { selectors: string[]; properties?: string[] };
  /** Layout viewport for measurement runs. */
  viewport?: { width: number; height: number };
}

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface ConsoleEntry {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export interface Measurement {
  found: boolean;
  box?: { x: number; y: number; width: number; height: number };
  styles?: Record<string, string>;
}

export interface RunResult {
  status: 'ok' | 'compile-error' | 'runtime-error' | 'timeout';
  /** Console output, in order. */
  stdout: ConsoleEntry[];
  diagnostics: Diagnostic[];
  tests: TestResult[];
  measurements?: Record<string, Measurement>;
  durationMs: number;
}

/**
 * A code runner plugin (ARCHITECTURE §8). `web-sandbox` runs HTML/CSS/JS in an isolated iframe;
 * a future `dotnet-wasm` runner implements the same interface for C#.
 */
export interface Runner {
  id: string;
  languages: string[];
  /** Lazy download/boot (a no-op for the web sandbox; large for a .NET runtime). */
  prepare(onProgress?: (progress: LoadProgress) => void): Promise<void>;
  run(request: RunRequest, signal?: AbortSignal): Promise<RunResult>;
}
