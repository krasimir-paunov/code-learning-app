/** A line diff (longest common subsequence), enough to show what a change touches. */

export type DiffLine = { kind: 'same' | 'add' | 'del'; text: string };

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  // lcs[i][j]: length of the common subsequence of a[i..] and b[j..].
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = lcs[i] as number[];
      row[j] =
        a[i] === b[j]
          ? (lcs[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(lcs[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  const out: DiffLine[] = [];
  let [i, j] = [0, 0];
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] ?? '' });
      i++;
      j++;
    } else if ((lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0)) {
      out.push({ kind: 'del', text: a[i++] ?? '' });
    } else {
      out.push({ kind: 'add', text: b[j++] ?? '' });
    }
  }
  while (i < a.length) out.push({ kind: 'del', text: a[i++] ?? '' });
  while (j < b.length) out.push({ kind: 'add', text: b[j++] ?? '' });
  return out;
}

export function changedLines(diff: readonly DiffLine[]): number {
  return diff.filter((l) => l.kind !== 'same').length;
}
