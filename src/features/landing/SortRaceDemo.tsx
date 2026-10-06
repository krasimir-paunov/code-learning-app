import { Pause, Play, RotateCcw, Shuffle, StepForward } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button.tsx';
import { useMotionPreference } from '../../effects/motion.ts';
import { ArrayView } from '../../visualizers/shared/ArrayView.tsx';
import {
  SORT_COMPLEXITY,
  SORT_METRIC,
  SORTS,
  type SortAlgorithm,
} from '../../visualizers/shared/algorithms/sorting.ts';
import { MetricCounter } from '../../visualizers/shared/Metrics.tsx';
import { advance } from '../../visualizers/shared/player-math.ts';
import {
  raceFrames,
  raceLength,
  raceStandings,
  TraceCursor,
} from '../../visualizers/shared/trace.ts';
import { seeded, shuffledRange } from '../../visualizers/shared/random.ts';
import styles from './SortRaceDemo.module.css';

const LANES: SortAlgorithm[] = ['bubble', 'merge', 'quick'];
const TITLES: Record<SortAlgorithm, string> = {
  bubble: 'Bubble sort',
  selection: 'Selection sort',
  insertion: 'Insertion sort',
  merge: 'Merge sort',
  quick: 'Quicksort',
  heap: 'Heap sort',
};
const METRIC_LABEL = { swaps: 'Swaps', writes: 'Writes' } as const;
const SIZE = 28;
const STEPS_PER_SECOND = 24;

/**
 * A taste of the Algorithms track's sort race, built on the same step generators: three sorts
 * on the same shuffled bars, one shared tick, live counters. With full effects it starts when it
 * scrolls into view and pauses off screen; with reduced motion it waits for Play.
 */
export function SortRaceDemo() {
  const motion = useMotionPreference();
  const root = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
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
  const finished = tick >= length;
  const running =
    !finished && (mode === 'playing' || (mode === 'auto' && motion === 'full' && visible));

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

  // Back to the first step. A paused race stays paused (so it can be stepped from the start);
  // a finished one plays again.
  function restart() {
    setTick(0);
    if (finished) setMode('playing');
  }

  function newArray() {
    setSeed((s) => s + 1);
    restart();
  }

  function step() {
    setMode('paused');
    const next = Math.min(length, tick + 1);
    setTick(next);
    // The Step button leaves when the race ends; keep focus on the button that replaces Play.
    if (next >= length) controls.current?.querySelector('button')?.focus();
  }

  const frames = raceFrames(race, tick);
  const winner = raceStandings(race)[0];

  return (
    <div className={styles.demo} ref={root}>
      <div className={styles.lanes}>
        {LANES.map((algorithm, i) => {
          const frame = frames[i];
          const lane = race.lanes[i];
          if (!frame || !lane) return null;
          const metric = SORT_METRIC[algorithm];
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
                <MetricCounter label={METRIC_LABEL[metric]} value={frame.counters[metric]} />
                <span className={styles.done}>{tick >= lane.length ? 'Done' : ''}</span>
              </div>
            </section>
          );
        })}
      </div>

      <ul className={styles.legend} aria-label="Colors">
        <li data-op="compare">Compare</li>
        <li data-op="swap">Swap</li>
        <li data-op="write">Write</li>
        <li data-op="sorted">Sorted</li>
      </ul>

      <div className={styles.footer}>
        <div className={styles.controls} ref={controls}>
          {finished ? (
            <Button key="main" size="sm" variant="primary" icon={<RotateCcw />} onClick={restart}>
              Restart
            </Button>
          ) : (
            <Button
              key="main"
              size="sm"
              variant="primary"
              icon={running ? <Pause /> : <Play />}
              onClick={() => setMode(running ? 'paused' : 'playing')}
            >
              {running ? 'Pause' : 'Play'}
            </Button>
          )}
          {!finished && (
            <>
              <Button size="sm" icon={<StepForward />} onClick={step}>
                Step
              </Button>
              <Button size="sm" icon={<RotateCcw />} onClick={restart}>
                Restart
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" icon={<Shuffle />} onClick={newArray}>
            New array
          </Button>
        </div>
        <p className={styles.status} role="status">
          {finished && winner
            ? `Finished. ${TITLES[LANES[winner.lane] as SortAlgorithm]} needed the fewest steps (${winner.steps.toLocaleString('en')}).`
            : ''}
        </p>
      </div>
    </div>
  );
}
