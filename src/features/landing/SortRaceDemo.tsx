import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button.tsx';
import { useMotionPreference } from '../../effects/motion.ts';
import { ArrayView } from '../../visualizers/shared/ArrayView.tsx';
import {
  SORT_COMPLEXITY,
  SORTS,
  type SortAlgorithm,
} from '../../visualizers/shared/algorithms/sorting.ts';
import { MetricCounter } from '../../visualizers/shared/Metrics.tsx';
import { advance } from '../../visualizers/shared/player-math.ts';
import { raceFrames, raceLength, TraceCursor } from '../../visualizers/shared/trace.ts';
import { seeded, shuffledRange } from '../../visualizers/shared/random.ts';
import styles from './SortRaceDemo.module.css';

const LANES: SortAlgorithm[] = ['bubble', 'insertion', 'quick'];
const TITLES: Record<SortAlgorithm, string> = {
  bubble: 'Bubble sort',
  selection: 'Selection sort',
  insertion: 'Insertion sort',
  merge: 'Merge sort',
  quick: 'Quicksort',
  heap: 'Heap sort',
};
const SIZE = 28;
const STEPS_PER_SECOND = 24;

/**
 * A taste of the Algorithms track's sort race, built on the same step generators: three sorts
 * on the same shuffled bars, one shared tick, live comparison and swap counters. It plays only
 * while on screen with full effects; otherwise it waits for Play.
 */
export function SortRaceDemo() {
  const motion = useMotionPreference();
  const root = useRef<HTMLDivElement>(null);
  const [seed, setSeed] = useState(3);
  const [tick, setTick] = useState(0);
  // 'auto' plays while on screen (full effects only); the buttons take over from there.
  const [mode, setMode] = useState<'auto' | 'playing' | 'paused'>('auto');
  const [visible, setVisible] = useState(false);
  const race = useMemo(() => {
    const input = shuffledRange(SIZE, seeded(seed));
    return { lanes: LANES.map((a) => new TraceCursor(input, SORTS[a])) };
  }, [seed]);
  const length = raceLength(race);
  const running =
    tick < length && (mode === 'playing' || (mode === 'auto' && motion === 'full' && visible));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running || document.hidden) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    let index = tick;
    const loop = (now: number) => {
      const step = advance(index, now - last + carry, STEPS_PER_SECOND, length);
      last = now;
      carry = step.carry;
      index = step.index;
      setTick(index);
      if (!step.finished) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // `tick` is read once when playback (re)starts; the loop owns it afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, length]);

  const frames = raceFrames(race, tick);
  const finishedAll = tick >= length;

  return (
    <div className={styles.demo} ref={root}>
      <div className={styles.lanes}>
        {LANES.map((algorithm, i) => {
          const frame = frames[i];
          const lane = race.lanes[i];
          if (!frame || !lane) return null;
          return (
            <section key={algorithm} className={styles.lane} aria-label={TITLES[algorithm]}>
              <h3 className={styles.title}>
                {TITLES[algorithm]} <code>{SORT_COMPLEXITY[algorithm].average}</code>
              </h3>
              <ArrayView
                frame={frame}
                mode="bars"
                label={`${TITLES[algorithm]} on ${SIZE} bars`}
                showIndices={false}
              />
              <div className={styles.metrics}>
                <MetricCounter label="Comparisons" value={frame.counters.comparisons} />
                <MetricCounter label="Swaps" value={frame.counters.swaps} />
                <span className={styles.done}>{tick >= lane.length ? 'Done' : ''}</span>
              </div>
            </section>
          );
        })}
      </div>
      <div className={styles.controls}>
        {finishedAll ? (
          <Button
            size="sm"
            icon={<RotateCcw />}
            onClick={() => {
              setSeed((s) => s + 1);
              setTick(0);
              setMode('playing');
            }}
          >
            New race
          </Button>
        ) : (
          <Button
            size="sm"
            icon={running ? <Pause /> : <Play />}
            onClick={() => setMode(running ? 'paused' : 'playing')}
            aria-pressed={running}
          >
            {running ? 'Pause' : 'Play'}
          </Button>
        )}
      </div>
    </div>
  );
}
