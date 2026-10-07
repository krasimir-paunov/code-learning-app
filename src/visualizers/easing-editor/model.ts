/**
 * cubic-bezier(x1, y1, x2, y2) easing: x is time, y is progress. To read progress at a time,
 * solve the curve's x for the parameter, then read y (Newton steps with a bisection fallback,
 * as browsers do).
 */

export type Curve = [number, number, number, number];

export const PRESETS: Record<string, Curve> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

const bezier = (p1: number, p2: number) => (s: number) =>
  3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;

const slope = (p1: number, p2: number) => (s: number) =>
  3 * (1 - s) * (1 - s) * p1 + 6 * (1 - s) * s * (p2 - p1) + 3 * s * s * (1 - p2);

/** Progress (0 to 1, may overshoot) at a moment `t` between 0 and 1. */
export function progressAt([x1, y1, x2, y2]: Curve, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const x = bezier(x1, x2);
  const dx = slope(x1, x2);
  let s = t;
  for (let i = 0; i < 8; i++) {
    const err = x(s) - t;
    if (Math.abs(err) < 1e-7) return bezier(y1, y2)(s);
    const d = dx(s);
    if (Math.abs(d) < 1e-6) break;
    s -= err / d;
  }
  let [lo, hi] = [0, 1];
  s = t;
  while (hi - lo > 1e-7) {
    if (x(s) < t) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
  }
  return bezier(y1, y2)(s);
}

export function presetName(curve: Curve): string | null {
  const found = Object.entries(PRESETS).find(([, c]) =>
    c.every((v, i) => Math.abs(v - (curve[i] ?? 0)) < 1e-9),
  );
  return found ? found[0] : null;
}

/** The CSS for a curve: a keyword when there is one. */
export function toCss(curve: Curve): string {
  return (
    presetName(curve) ?? `cubic-bezier(${curve.map((v) => Math.round(v * 100) / 100).join(', ')})`
  );
}

/** Progress at evenly spaced moments, for a filmstrip. */
export function filmstrip(curve: Curve, frames = 11): number[] {
  return Array.from({ length: frames }, (_, i) => progressAt(curve, i / (frames - 1)));
}
