import { Shuffle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/Button.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ArrayView } from '../shared/ArrayView.tsx';
import { SEARCH_COMPLEXITY } from '../shared/algorithms/searching.ts';
import { ComplexityTag, MetricCounter } from '../shared/Metrics.tsx';
import { StepPlayer } from '../shared/StepPlayer.tsx';
import { raceFrames, raceLength, TraceCursor, type Race } from '../shared/trace.ts';
import { useStepPlayer } from '../shared/use-step-player.ts';
import { StepTracerPanel } from '../step-tracer/StepTracerPanel.tsx';
import type { SearchRaceProps } from './build.ts';
import { raceInput, SEARCH_TITLES, SEARCHES, type TargetMode } from './model.ts';
import styles from './View.module.css';

/** Linear vs binary search on the same sorted array, advanced in lockstep by one player. */
export default function SearchRaceView({ props }: VisualizerViewProps<SearchRaceProps>) {
  const [sizeIndex, setSizeIndex] = useState(Math.max(0, props.sizes.indexOf(props.size.default)));
  const [mode, setMode] = useState<TargetMode>(
    props.target === 'random-missing' ? 'missing' : 'present',
  );
  const [seed, setSeed] = useState(1);
  const [showCode, setShowCode] = useState(false);
  const n = props.sizes[sizeIndex] ?? props.size.default;
  const { array, target } = useMemo(() => raceInput(n, mode, seed), [n, mode, seed]);
  const race: Race = useMemo(
    () => ({
      lanes: props.algorithms.map((a) => new TraceCursor(array, (xs) => SEARCHES[a](xs, target))),
    }),
    [props.algorithms, array, target],
  );
  const player = useStepPlayer(raceLength(race), n > 128 ? 8 : 2);
  const frames = raceFrames(race, player.index);
  const controls = new Set(props.controls);
  const binaryLane = props.algorithms.indexOf('binary');

  const narration = props.algorithms
    .map((algorithm, i) => {
      const lane = race.lanes[i];
      const frame = frames[i];
      if (!lane || !frame) return '';
      const finished = player.index >= lane.length;
      return `${SEARCH_TITLES[algorithm]}: ${finished && player.index > lane.length ? 'finished.' : frame.note}`;
    })
    .join(' ');

  return (
    <div className={styles.race}>
      <div className={styles.setup}>
        {controls.has('size') && (
          <Slider
            label="Array size"
            min={0}
            max={props.sizes.length - 1}
            value={sizeIndex}
            onChange={setSizeIndex}
            format={(i) => `${(props.sizes[i] ?? n).toLocaleString('en')} items`}
          />
        )}
        {controls.has('target') && (
          <div className={styles.targetRow}>
            <SegmentedControl<TargetMode>
              label="Target"
              size="sm"
              options={[
                { value: 'present', label: 'In the array' },
                { value: 'missing', label: 'Missing' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <Button
              size="sm"
              variant="ghost"
              icon={<Shuffle />}
              onClick={() => setSeed((s) => s + 1)}
            >
              New target
            </Button>
          </div>
        )}
        <p className={styles.target}>
          Looking for <strong>{target}</strong> in {n.toLocaleString('en')} sorted numbers
        </p>
      </div>

      {props.algorithms.map((algorithm, i) => {
        const lane = race.lanes[i];
        const frame = frames[i];
        if (!lane || !frame) return null;
        const finished = player.index >= lane.length;
        const result = lane.result ?? -1;
        return (
          <section key={algorithm} className={styles.lane} aria-label={SEARCH_TITLES[algorithm]}>
            <header className={styles.laneHeader}>
              <h3>{SEARCH_TITLES[algorithm]}</h3>
              {props.showComplexity && (
                <ComplexityTag label="worst case" value={SEARCH_COMPLEXITY[algorithm].worst} />
              )}
            </header>
            <ArrayView
              frame={frame}
              mode={n > 64 ? 'bars' : 'cells'}
              label={`${SEARCH_TITLES[algorithm]} over ${n} numbers`}
              showIndices={n <= 16}
            />
            <div className={styles.laneFooter}>
              <MetricCounter label="Checks" value={frame.counters.probes} />
              <p className={styles.status} data-finished={finished || undefined}>
                {finished
                  ? result === -1
                    ? `Not found after ${lane.length} checks`
                    : `Found at index ${result} after ${lane.length} checks`
                  : 'Searching…'}
              </p>
            </div>
          </section>
        );
      })}

      {controls.has('step') && binaryLane !== -1 && (
        <div className={styles.stepMode}>
          <Toggle
            label="Step mode: show the binary search code"
            checked={showCode}
            onChange={setShowCode}
            description="Step forward to watch lo, mid and hi move line by line."
          />
          {showCode && frames[binaryLane] && (
            <StepTracerPanel
              codeLines={props.binaryCodeLines}
              line={frames[binaryLane].line}
              vars={frames[binaryLane].vars}
              label="Binary search code"
            />
          )}
        </div>
      )}

      <StepPlayer
        player={player}
        narration={narration}
        speeds={controls.has('speed') ? [1, 2, 4, 8, 32, 128] : [2]}
      />
    </div>
  );
}
