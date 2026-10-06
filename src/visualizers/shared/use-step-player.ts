import { useCallback, useEffect, useRef, useState } from 'react';
import { advance, clampIndex } from './player-math.ts';

export interface StepPlayerState {
  index: number;
  length: number;
  playing: boolean;
  stepsPerSecond: number;
  play(): void;
  pause(): void;
  toggle(): void;
  stepForward(): void;
  stepBack(): void;
  seek(index: number): void;
  setStepsPerSecond(value: number): void;
}

/**
 * One playback engine for every visualizer: play/pause, step, scrub and speed. Never starts on
 * its own (no autoplay), and stops at the end.
 */
export function useStepPlayer(length: number, initialStepsPerSecond = 2): StepPlayerState {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [stepsPerSecond, setStepsPerSecond] = useState(initialStepsPerSecond);
  const indexRef = useRef(index);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // A new trace (other input) restarts from the beginning.
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [length]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      const result = advance(indexRef.current, now - last + carry, stepsPerSecond, length);
      last = now;
      carry = result.carry;
      if (result.index !== indexRef.current) {
        indexRef.current = result.index;
        setIndex(result.index);
      }
      if (result.finished) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, stepsPerSecond, length]);

  const seek = useCallback((value: number) => setIndex(clampIndex(value, length)), [length]);

  return {
    index,
    length,
    playing,
    stepsPerSecond,
    play: () => {
      if (indexRef.current >= length) setIndex(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    toggle: () => {
      if (playing) setPlaying(false);
      else {
        if (indexRef.current >= length) setIndex(0);
        setPlaying(true);
      }
    },
    stepForward: () => {
      setPlaying(false);
      seek(indexRef.current + 1);
    },
    stepBack: () => {
      setPlaying(false);
      seek(indexRef.current - 1);
    },
    seek: (value) => {
      setPlaying(false);
      seek(value);
    },
    setStepsPerSecond,
  };
}
