import { ChevronFirst, ChevronLast, Pause, Play, StepBack, StepForward } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconButton } from '../../components/IconButton.tsx';
import { Slider } from '../../components/Slider.tsx';
import styles from './StepPlayer.module.css';
import { shouldAnnounce } from './player-math.ts';
import type { StepPlayerState } from './use-step-player.ts';

interface StepPlayerProps {
  player: StepPlayerState;
  /** Narration of the current step (plain text), announced politely. */
  narration: string;
  /** Offered playback speeds in steps per second. */
  speeds?: readonly number[];
  /** Extra controls (size, target...) shown in the same toolbar. */
  children?: ReactNode;
}

/**
 * Shared transport for every step-based visualizer: play/pause, step back/forward, first/last,
 * scrub and speed, with keyboard shortcuts while focus is inside (Space, ←/→, Home/End).
 */
export function StepPlayer({
  player,
  narration,
  speeds = [1, 2, 4, 8],
  children,
}: StepPlayerProps) {
  const root = useRef<HTMLDivElement>(null);
  const [announced, setAnnounced] = useState('');
  const lastAnnounce = useRef(0);

  useEffect(() => {
    const now = performance.now();
    if (shouldAnnounce(now, lastAnnounce.current, player.playing)) {
      lastAnnounce.current = now;
      setAnnounced(`Step ${player.index} of ${player.length}: ${narration}`);
    }
  }, [narration, player.index, player.length, player.playing]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Leave typing and native slider keys alone.
      if (target.matches('input, textarea, select, [contenteditable="true"]')) return;
      const actions: Record<string, () => void> = {
        ' ': player.toggle,
        k: player.toggle,
        ArrowRight: player.stepForward,
        ArrowLeft: player.stepBack,
        Home: () => player.seek(0),
        End: () => player.seek(player.length),
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [player]);

  const atStart = player.index === 0;
  const atEnd = player.index >= player.length;

  return (
    <div ref={root} className={styles.player}>
      <div className={styles.transport}>
        <IconButton
          label="First step"
          icon={<ChevronFirst />}
          onClick={() => player.seek(0)}
          disabled={atStart}
        />
        <IconButton
          label="Step back"
          icon={<StepBack />}
          onClick={player.stepBack}
          disabled={atStart}
        />
        <IconButton
          label={player.playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
          icon={player.playing ? <Pause /> : <Play />}
          variant="solid"
          onClick={player.toggle}
          disabled={player.length === 0}
        />
        <IconButton
          label="Step forward"
          icon={<StepForward />}
          onClick={player.stepForward}
          disabled={atEnd}
        />
        <IconButton
          label="Last step"
          icon={<ChevronLast />}
          onClick={() => player.seek(player.length)}
          disabled={atEnd}
        />
        <span className={styles.counter} aria-hidden="true">
          {player.index} / {player.length}
        </span>
      </div>
      <div className={styles.sliders}>
        <Slider
          label="Step"
          min={0}
          max={Math.max(player.length, 1)}
          value={player.index}
          onChange={player.seek}
          format={(v) => `${v} of ${player.length}`}
          disabled={player.length === 0}
        />
        <Slider
          label="Speed"
          min={0}
          max={speeds.length - 1}
          value={Math.max(0, speeds.indexOf(player.stepsPerSecond))}
          onChange={(i) => player.setStepsPerSecond(speeds[i] ?? player.stepsPerSecond)}
          format={(i) => `${speeds[i] ?? player.stepsPerSecond} steps/s`}
        />
      </div>
      {children && <div className={styles.extra}>{children}</div>}
      <p className={styles.narration} aria-hidden="true">
        {narration}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {announced}
      </p>
    </div>
  );
}
