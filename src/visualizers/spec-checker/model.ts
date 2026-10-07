/**
 * A spec as a list of checks run against live markup: something exists, appears a set number
 * of times, has an accessible name, carries an attribute, or must be absent.
 */
import { accessibleName } from '../shared/a11y/a11y.ts';

export type Check =
  | { kind: 'exists'; label: string; selector: string }
  | { kind: 'count'; label: string; selector: string; count: number }
  | { kind: 'named'; label: string; selector: string }
  | { kind: 'labelled'; label: string; selector: string }
  | { kind: 'attr'; label: string; selector: string; attr: string; value?: string }
  | { kind: 'absent'; label: string; selector: string };

export interface Outcome {
  label: string;
  pass: boolean;
  /** Why it fails, in a few words. */
  detail?: string;
}

function safeQuery(root: ParentNode, selector: string): Element[] {
  try {
    return [...root.querySelectorAll(selector)];
  } catch {
    return [];
  }
}

export function runCheck(root: ParentNode, check: Check): Outcome {
  const found = safeQuery(root, check.selector);
  const fail = (detail: string): Outcome => ({ label: check.label, pass: false, detail });
  const ok: Outcome = { label: check.label, pass: true };
  switch (check.kind) {
    case 'exists':
      return found.length > 0 ? ok : fail('not found');
    case 'count':
      return found.length === check.count
        ? ok
        : fail(`found ${found.length}, expected ${check.count}`);
    case 'absent':
      return found.length === 0 ? ok : fail(`found ${found.length}`);
    case 'named': {
      if (found.length === 0) return fail('not found');
      const unnamed = found.filter((el) => !accessibleName(el)).length;
      return unnamed === 0 ? ok : fail(`${unnamed} without a name`);
    }
    case 'labelled': {
      if (found.length === 0) return fail('not found');
      // A real <label>, not just a name from aria-label or a placeholder.
      const bare = found.filter((el) => !((el as HTMLInputElement).labels?.length ?? 0)).length;
      return bare === 0 ? ok : fail(`${bare} without a <label>`);
    }
    case 'attr': {
      if (found.length === 0) return fail('not found');
      const wrong = found.filter((el) =>
        check.value === undefined
          ? !el.hasAttribute(check.attr)
          : el.getAttribute(check.attr) !== check.value,
      ).length;
      return wrong === 0
        ? ok
        : fail(
            check.value === undefined
              ? `missing ${check.attr}`
              : `${check.attr} isn't "${check.value}"`,
          );
    }
  }
}

export function runChecks(root: ParentNode, checks: readonly Check[]): Outcome[] {
  return checks.map((check) => runCheck(root, check));
}
