import { useState } from 'react';
import { useDebounced } from './use-debounced.ts';

export interface EditableExample {
  label: string;
  source: string;
}

/**
 * Editable starting points: one source per example (edits survive switching back and forth),
 * plus the source once typing pauses, for views that parse it.
 */
export function useExampleSources(examples: readonly EditableExample[]) {
  const [example, setExample] = useState('0');
  const [sources, setSources] = useState(() => examples.map((e) => e.source));
  const source = sources[Number(example)] ?? '';
  const settled = useDebounced(source, 300);
  const setSource = (value: string) =>
    setSources((all) => all.map((s, i) => (i === Number(example) ? value : s)));
  return { example, setExample, source, setSource, settled };
}
