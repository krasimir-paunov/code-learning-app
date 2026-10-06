import { describe, expect, it } from 'vitest';
import type { RunResult } from '../../../runners/contract.ts';
import type { RunnerRegistry } from '../../contract.ts';
import liveCode, { evaluateRun, type LiveCodeSpec } from './index.ts';

const base: RunResult = { status: 'ok', stdout: [], diagnostics: [], tests: [], durationMs: 1 };

describe('live-code grading', () => {
  it('passes only when there are tests and all pass', () => {
    expect(
      evaluateRun({
        ...base,
        tests: [
          { name: 'a', passed: true },
          { name: 'b', passed: true },
        ],
      }),
    ).toMatchObject({ passed: true, feedback: 'All 2 tests passed.' });
    expect(evaluateRun(base).passed).toBe(false);
  });

  it('names the first failing test and its assertion', () => {
    const result = evaluateRun({
      ...base,
      tests: [
        { name: 'finds 7', passed: true },
        { name: 'returns -1 when missing', passed: false, message: 'Expected -1, received 2' },
      ],
    });
    expect(result.feedback).toBe(
      '1 of 2 tests passed. First failure, "returns -1 when missing": Expected -1, received 2.',
    );
    expect(result.details).toHaveLength(2);
  });

  it('explains syntax errors, runtime errors and timeouts', () => {
    expect(
      evaluateRun({
        ...base,
        status: 'compile-error',
        diagnostics: [{ message: 'main.js: Unexpected token', severity: 'error', line: 3 }],
      }).feedback,
    ).toBe('Your code has a syntax error: main.js: Unexpected token.');
    expect(evaluateRun({ ...base, status: 'timeout' }).feedback).toContain('did not finish');
    expect(
      evaluateRun({
        ...base,
        status: 'runtime-error',
        diagnostics: [{ message: 'TypeError: x is undefined', severity: 'error' }],
        tests: [{ name: 't', passed: false, message: 'boom' }],
      }).feedback,
    ).toContain('Your code threw: TypeError: x is undefined');
  });

  it('runs the learner files plus the tests through the named runner', async () => {
    const calls: unknown[] = [];
    const runners: RunnerRegistry = {
      get: async () => ({
        id: 'web-sandbox',
        languages: ['js'],
        prepare: async () => {},
        run: async (request) => {
          calls.push(request);
          return { ...base, tests: [{ name: 't', passed: true }] };
        },
      }),
    };
    const spec: LiveCodeSpec = {
      runner: 'web-sandbox',
      files: {},
      editable: [],
      tests: 'TESTS',
      preview: false,
    };
    const result = await liveCode.grade(spec, { 'main.js': 'code' }, { runners });
    expect(result.passed).toBe(true);
    expect(calls).toEqual([{ files: { 'main.js': 'code' }, tests: 'TESTS' }]);
  });
});
