/** Pure playback arithmetic for StepPlayer (kept out of the component so it is testable). */

export interface AdvanceResult {
  index: number;
  /** Leftover time (ms) carried into the next frame so speed stays exact. */
  carry: number;
  finished: boolean;
}

/**
 * Advances playback by elapsed time. Speeds above the frame rate take several steps per frame,
 * which is how a 1,000-bar race can run thousands of steps per second.
 */
export function advance(
  index: number,
  elapsedMs: number,
  stepsPerSecond: number,
  length: number,
): AdvanceResult {
  const msPerStep = 1000 / stepsPerSecond;
  const steps = Math.floor(elapsedMs / msPerStep);
  const next = Math.min(length, index + steps);
  return {
    index: next,
    carry: next === length ? 0 : elapsedMs - steps * msPerStep,
    finished: next >= length,
  };
}

export function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length, Math.round(index)));
}

/** Live-region pacing: while playing, announce at most once per interval. */
export function shouldAnnounce(
  now: number,
  lastAnnounced: number,
  playing: boolean,
  intervalMs = 1500,
) {
  return !playing || now - lastAnnounced >= intervalMs;
}
