/**
 * Step-generator engine shared by every array visualizer (search race now, sort race in Phase 4).
 *
 * An algorithm is a generator that works on its own copy of the input and yields TraceSteps made
 * of small events. Nothing stores whole arrays per step: a TraceCursor pulls steps lazily and
 * keeps a checkpoint every N steps, so frame(i) replays at most N steps from the nearest
 * checkpoint. That keeps memory linear in events and makes step-back/scrub cheap, which is what
 * a 1,000-bar race needs. Counters (comparisons, swaps, writes) fall out of the events.
 */

export type Mark = 'sorted' | 'found' | 'discarded' | 'pivot' | 'candidate';

export type ArrayEvent =
  | { type: 'compare'; i: number; j: number }
  | { type: 'swap'; i: number; j: number }
  | { type: 'write'; i: number; value: number }
  /**
   * One write that lands element `from` at `to`, shifting the elements between them by one. Lets a
   * buffered algorithm (merge sort) be shown in place: every value still waiting stays on screen.
   */
  | { type: 'move'; from: number; to: number }
  /** A search check of one element against the target. */
  | { type: 'probe'; i: number }
  | { type: 'mark'; indices: readonly number[]; as: Mark }
  | { type: 'unmark'; indices: readonly number[] }
  | { type: 'pointers'; values: Readonly<Record<string, number | null>> };

export interface TraceStep {
  events: readonly ArrayEvent[];
  /** Plain-language narration (announced in the live region). */
  note: string;
  /** 1-based line of the reference code this step corresponds to (step tracer). */
  line?: number;
  /** Variable watch values at this step. */
  vars?: Readonly<Record<string, string | number | boolean | null>>;
}

export type StepGenerator<Result = unknown> = Generator<TraceStep, Result, void>;

export interface Counters {
  comparisons: number;
  swaps: number;
  writes: number;
  probes: number;
}

export interface Frame {
  /** 0 = the initial state; i = after i steps. */
  index: number;
  array: readonly number[];
  marks: readonly (Mark | null)[];
  pointers: Readonly<Record<string, number | null>>;
  counters: Readonly<Counters>;
  /** Indices touched by the latest step, and how. */
  active: readonly number[];
  activeKind: 'compare' | 'swap' | 'write' | 'probe' | null;
  note: string;
  line?: number;
  vars?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
  stable?: boolean;
}

interface MutableState {
  array: number[];
  marks: (Mark | null)[];
  pointers: Record<string, number | null>;
  counters: Counters;
}

function snapshot(state: MutableState, index: number, step?: TraceStep): Frame {
  let active: number[] = [];
  let activeKind: Frame['activeKind'] = null;
  for (const event of step?.events ?? []) {
    if (event.type === 'compare' || event.type === 'swap') {
      active = [event.i, event.j];
      activeKind = event.type;
    } else if (event.type === 'write' || event.type === 'probe') {
      active = [event.i];
      activeKind = event.type;
    } else if (event.type === 'move') {
      active = [event.to];
      activeKind = 'write';
    }
  }
  return {
    index,
    array: [...state.array],
    marks: [...state.marks],
    pointers: { ...state.pointers },
    counters: { ...state.counters },
    active,
    activeKind,
    note: step?.note ?? 'Start',
    line: step?.line,
    vars: step?.vars,
  };
}

function moveItem<T>(list: T[], from: number, to: number) {
  list.splice(to, 0, ...list.splice(from, 1));
}

function apply(state: MutableState, step: TraceStep) {
  for (const event of step.events) {
    switch (event.type) {
      case 'compare':
        state.counters.comparisons++;
        break;
      case 'probe':
        state.counters.comparisons++;
        state.counters.probes++;
        break;
      case 'swap': {
        const { array } = state;
        const a = array[event.i] as number;
        array[event.i] = array[event.j] as number;
        array[event.j] = a;
        state.counters.swaps++;
        break;
      }
      case 'write':
        state.array[event.i] = event.value;
        state.counters.writes++;
        break;
      case 'move':
        moveItem(state.array, event.from, event.to);
        moveItem(state.marks, event.from, event.to);
        state.counters.writes++;
        break;
      case 'mark':
        for (const i of event.indices) state.marks[i] = event.as;
        break;
      case 'unmark':
        for (const i of event.indices) state.marks[i] = null;
        break;
      case 'pointers':
        state.pointers = { ...state.pointers, ...event.values };
        break;
    }
  }
}

interface Checkpoint {
  index: number;
  state: MutableState;
}

function cloneState(state: MutableState): MutableState {
  return {
    array: [...state.array],
    marks: [...state.marks],
    pointers: { ...state.pointers },
    counters: { ...state.counters },
  };
}

export class TraceCursor<Result = unknown> {
  readonly initial: readonly number[];
  private readonly generator: StepGenerator<Result>;
  private readonly steps: TraceStep[] = [];
  private readonly checkpoints: Checkpoint[];
  private readonly every: number;
  private live: MutableState;
  private finished = false;
  private resultValue: Result | undefined;

  constructor(
    initial: readonly number[],
    algorithm: (input: number[]) => StepGenerator<Result>,
    checkpointEvery = 64,
  ) {
    this.initial = [...initial];
    this.every = checkpointEvery;
    this.generator = algorithm([...initial]);
    this.live = {
      array: [...initial],
      marks: initial.map(() => null),
      pointers: {},
      counters: { comparisons: 0, swaps: 0, writes: 0, probes: 0 },
    };
    this.checkpoints = [{ index: 0, state: cloneState(this.live) }];
  }

  /** Pulls steps until `count` exist or the algorithm finishes. */
  private ensure(count: number) {
    while (!this.finished && this.steps.length < count) {
      const next = this.generator.next();
      if (next.done) {
        this.finished = true;
        this.resultValue = next.value;
        break;
      }
      this.steps.push(next.value);
      apply(this.live, next.value);
      if (this.steps.length % this.every === 0) {
        this.checkpoints.push({ index: this.steps.length, state: cloneState(this.live) });
      }
    }
  }

  /** Total steps, once known (forces the whole run). */
  get length(): number {
    this.ensure(Number.POSITIVE_INFINITY);
    return this.steps.length;
  }

  get result(): Result | undefined {
    this.ensure(Number.POSITIVE_INFINITY);
    return this.resultValue;
  }

  /** Steps recorded so far without forcing the rest (races advance lazily). */
  get recorded(): number {
    return this.steps.length;
  }

  get done(): boolean {
    return this.finished;
  }

  step(index: number): TraceStep | undefined {
    this.ensure(index + 1);
    return this.steps[index];
  }

  /** The state after `index` steps (clamped to the end). */
  frame(index: number): Frame {
    this.ensure(index);
    const target = Math.max(0, Math.min(index, this.steps.length));
    let checkpoint = this.checkpoints[0] as Checkpoint;
    for (const candidate of this.checkpoints) {
      if (candidate.index > target) break;
      checkpoint = candidate;
    }
    const state = cloneState(checkpoint.state);
    for (let i = checkpoint.index; i < target; i++) apply(state, this.steps[i] as TraceStep);
    return snapshot(state, target, this.steps[target - 1]);
  }
}

/** Convenience for small inputs: all frames at once (tests, trace challenges). */
export function allFrames(cursor: TraceCursor): Frame[] {
  const frames: Frame[] = [];
  for (let i = 0; i <= cursor.length; i++) frames.push(cursor.frame(i));
  return frames;
}

/**
 * Lockstep race: one shared tick advances every lane; a finished lane holds its final frame.
 * Used by search-race now and by sort-race (side-by-side algorithms) in Phase 4.
 */
export interface Race {
  lanes: TraceCursor[];
}

export function raceFrames(race: Race, tick: number): Frame[] {
  return race.lanes.map((lane) => lane.frame(tick));
}

export function raceLength(race: Race): number {
  return Math.max(0, ...race.lanes.map((lane) => lane.length));
}

/** Lanes ordered by finishing tick (fewest steps first). */
export function raceStandings(race: Race): { lane: number; steps: number }[] {
  return race.lanes
    .map((lane, index) => ({ lane: index, steps: lane.length }))
    .sort((a, b) => a.steps - b.steps);
}
