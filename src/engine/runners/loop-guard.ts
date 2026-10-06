import { parse, type Node } from 'acorn';

export interface Diagnostic {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export type GuardResult = { ok: true; code: string } | { ok: false; diagnostic: Diagnostic };

interface Insertion {
  pos: number;
  text: string;
  /** Closing braces must come before openings at the same position. */
  closing: boolean;
  /** Nesting depth: outer openings first, inner closings first. */
  depth: number;
}

type AnyNode = Node & Record<string, unknown>;
const LOOPS = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

function lineOf(code: string, pos: number): number {
  let line = 1;
  for (let i = 0; i < pos; i++) if (code.charCodeAt(i) === 10) line++;
  return line;
}

/**
 * Makes every loop stoppable: each loop gets `__lgEnter(n)` before it and `__lgTick(n, line)`
 * at the top of its body, so a loop that runs too long throws a clear error instead of
 * freezing the page. Formatting and line numbers are preserved (insertions only, no newlines).
 * Syntax errors are reported as diagnostics without running anything.
 */
export function guardLoops(code: string): GuardResult {
  let ast: Node;
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  } catch (error) {
    const e = error as SyntaxError & { loc?: { line: number; column: number } };
    return {
      ok: false,
      diagnostic: {
        message: e.message.replace(/\s*\(\d+:\d+\)$/, ''),
        line: e.loc?.line,
        column: e.loc === undefined ? undefined : e.loc.column + 1,
        severity: 'error',
      },
    };
  }

  const insertions: Insertion[] = [];
  let next = 0;

  function visit(node: AnyNode, depth: number, label?: AnyNode) {
    if (LOOPS.has(node.type)) {
      const id = next++;
      const outer = label ?? node;
      const body = node.body as AnyNode;
      const line = lineOf(code, node.start);
      insertions.push({ pos: outer.start, text: `{__lgEnter(${id});`, closing: false, depth });
      insertions.push({ pos: outer.end, text: '}', closing: true, depth });
      if (body.type === 'BlockStatement') {
        insertions.push({
          pos: body.start + 1,
          text: `__lgTick(${id},${line});`,
          closing: false,
          depth: depth + 1,
        });
      } else {
        insertions.push({
          pos: body.start,
          text: `{__lgTick(${id},${line});`,
          closing: false,
          depth: depth + 0.5,
        });
        insertions.push({ pos: body.end, text: '}', closing: true, depth: depth + 0.5 });
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof (child as AnyNode).type === 'string')
            visit(child as AnyNode, depth + 1);
        }
      } else if (
        value &&
        typeof value === 'object' &&
        typeof (value as AnyNode).type === 'string'
      ) {
        const child = value as AnyNode;
        visit(child, depth + 1, node.type === 'LabeledStatement' ? node : undefined);
      }
    }
  }
  visit(ast as AnyNode, 0);

  insertions.sort((a, b) => {
    if (a.pos !== b.pos) return b.pos - a.pos;
    // Same position, applied right-to-left, so the text that must end up first goes last.
    if (a.closing !== b.closing) return a.closing ? 1 : -1;
    return a.closing ? a.depth - b.depth : b.depth - a.depth;
  });
  let out = code;
  for (const insertion of insertions) {
    out = out.slice(0, insertion.pos) + insertion.text + out.slice(insertion.pos);
  }
  return { ok: true, code: out };
}
