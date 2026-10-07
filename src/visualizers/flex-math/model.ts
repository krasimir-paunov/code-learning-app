/**
 * Resolving flexible lengths (CSS Flexbox §9.7) for one line of items in a row: start from each
 * item's flex-basis, then share the free space out by flex-grow, or take the overflow back
 * weighted by flex-shrink × basis. Items that hit their minimum (or maximum) are frozen there
 * and the rest is shared again.
 */

export interface FlexItem {
  grow: number;
  shrink: number;
  /** Outer flex-basis in px. */
  basis: number;
  /** The smallest the item may get: its min-content width with `min-width: auto`, else 0. */
  min: number;
  max?: number;
}

export interface Resolved {
  size: number;
  /** Positive when the item grew, negative when it shrank. */
  change: number;
  /** Stopped by its minimum or maximum. */
  clamped: 'min' | 'max' | null;
}

export interface Distribution {
  items: Resolved[];
  /** Container size minus the bases and gaps: what grow or shrink shares out. */
  freeSpace: number;
  mode: 'grow' | 'shrink' | 'none';
}

const clampTo = (item: FlexItem, size: number) =>
  Math.min(item.max ?? Infinity, Math.max(item.min, size));

export function distribute(items: readonly FlexItem[], container: number, gap = 0): Distribution {
  const gaps = gap * Math.max(0, items.length - 1);
  // Grow or shrink is decided on the hypothetical sizes: each basis clamped by min and max.
  const hypothetical = items.map((item) => clampTo(item, item.basis));
  const overflow = container - gaps - hypothetical.reduce((sum, size) => sum + size, 0);
  const mode = overflow > 0 ? 'grow' : overflow < 0 ? 'shrink' : 'none';
  const growing = mode === 'grow';

  const size = [...hypothetical];
  const clamped: ('min' | 'max' | null)[] = items.map((item, i) =>
    (hypothetical[i] ?? 0) > item.basis
      ? 'min'
      : (hypothetical[i] ?? 0) < item.basis
        ? 'max'
        : null,
  );
  // Inflexible items, and items already clamped on the side they'd move towards, stay put.
  const frozen = items.map(
    (item, i) =>
      mode === 'none' ||
      (growing ? item.grow === 0 : item.shrink === 0) ||
      (growing ? clamped[i] === 'max' : clamped[i] === 'min'),
  );
  // The initial free space counts frozen items at their clamped size, flexible ones at their basis.
  const freeSpace =
    container -
    gaps -
    items.reduce((sum, item, i) => sum + (frozen[i] ? (size[i] ?? 0) : item.basis), 0);

  // Flexible items are only "clamped" if they hit a limit while being resolved.
  items.forEach((_, i) => {
    if (!frozen[i]) clamped[i] = null;
  });

  for (let round = 0; round < items.length + 1 && frozen.includes(false); round++) {
    const open = items.map((_, i) => i).filter((i) => !frozen[i]);
    const used = items.reduce((sum, item, i) => sum + (frozen[i] ? (size[i] ?? 0) : item.basis), 0);
    let remaining = container - gaps - used;
    const factorSum = open.reduce(
      (sum, i) => sum + (growing ? (items[i]?.grow ?? 0) : (items[i]?.shrink ?? 0)),
      0,
    );
    // Factors that add up to less than 1 only use that fraction of the free space.
    if (factorSum < 1) {
      const initial = freeSpace * factorSum;
      if (Math.abs(initial) < Math.abs(remaining)) remaining = initial;
    }

    const target = items.map((_, i) => size[i] ?? 0);
    if (growing) {
      for (const i of open) {
        const item = items[i];
        if (item) target[i] = item.basis + (remaining * item.grow) / factorSum;
      }
    } else {
      const scaledSum = open.reduce(
        (sum, i) => sum + (items[i]?.shrink ?? 0) * (items[i]?.basis ?? 0),
        0,
      );
      for (const i of open) {
        const item = items[i];
        if (item)
          target[i] =
            item.basis + (scaledSum ? (remaining * item.shrink * item.basis) / scaledSum : 0);
      }
    }

    let violation = 0;
    const fixed = target.map((value, i) => {
      const item = items[i];
      if (!item || frozen[i]) return value;
      const limited = clampTo(item, value);
      violation += limited - value;
      return limited;
    });
    for (const i of open) {
      const item = items[i];
      const value = fixed[i] ?? 0;
      const hitMin = value > (target[i] ?? 0);
      const hitMax = value < (target[i] ?? 0);
      const freeze = violation === 0 || (violation > 0 && hitMin) || (violation < 0 && hitMax);
      size[i] = value;
      if (freeze) {
        frozen[i] = true;
        if (item && hitMin) clamped[i] = 'min';
        if (item && hitMax) clamped[i] = 'max';
      }
    }
  }

  return {
    freeSpace,
    mode,
    items: items.map((item, i) => ({
      size: size[i] ?? item.basis,
      change: (size[i] ?? item.basis) - item.basis,
      clamped: clamped[i] ?? null,
    })),
  };
}
