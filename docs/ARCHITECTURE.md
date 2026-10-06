# Architecture

Static, client-only single-page app. No backend, no accounts. Content lives as data next to the engine; the engine never changes to add a lesson.

## 1. Principles

1. **Content is data.** Lessons, the curriculum graph and cheat sheets are YAML files validated against schemas at build time. Code samples are real files that a script executes.
2. **Plugins, not branches.** Challenge types, code runners and visualizers are registered modules discovered by glob. Adding one never edits a `switch` in the engine.
3. **Pure logic, dumb views.** Algorithms, simulators and graders are pure TypeScript functions (unit-tested, usable at build time). React components only render their output.
4. **Lazy by default.** The shell (landing, map) is small; each lesson, visualizer, editor and runner is its own chunk.
5. **Accuracy is enforced by tooling,** not by review alone (section 11).

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | Schemas, plugin contracts and the progress model are type-checked end to end. |
| UI | **React 19** | Largest ecosystem for the hard parts (CodeMirror bindings, accessible drag-and-drop, animation), the most familiar framework for future contributors, and the React Compiler removes most manual memoization. |
| Build | **Vite** | Fast dev server, first-class code splitting via dynamic `import()`, simple custom plugins for the content pipeline. |
| Routing | **React Router** (declarative/library mode) | Plain client routing with lazy route modules; no server framework needed. |
| State | **Zustand** | Tiny store for progress/settings with selector subscriptions; persistence is our own adapter (section 9). |
| Validation | **Zod** | One schema for build-time content validation, progress import validation and TS types (`z.infer`). |
| Styling | **CSS Modules + CSS custom properties** (`tokens.css`) | Zero runtime; tokens are the single source of design truth; visualizers need bespoke CSS anyway; print stylesheets are straightforward. |
| Editor | **CodeMirror 6** | Modular and small next to Monaco (which is ~2 MB+), works on mobile, accessible. Loaded only by challenges/playgrounds that need editing. |
| Highlighting | **Shiki** at build time | VS Code-quality highlighting with zero client cost: code is pre-rendered to HTML in the content pipeline. |
| Animation | **Motion** (in visualizer and map chunks only) + CSS | Layout animations (array swaps, list reordering) are much simpler; everything respects reduced motion. |
| Drag and drop | **dnd-kit** | Keyboard and screen-reader support for the reorder challenge. |
| Search | **MiniSearch** | Small full-text index with fuzzy and prefix search for cheat sheets. |
| Graph layout | **@dagrejs/dagre** at build time | Deterministic skill-tree layout computed once, not in the browser. |
| Tests | **Vitest**, Testing Library, **Playwright** + **axe-core** | Unit (pure logic), component, end-to-end and accessibility. |
| Lint/format | **ESLint** (flat config, `jsx-a11y`) + **Prettier** | `jsx-a11y` is the deciding factor over Biome. |
| Fonts | **Fontsource** (self-hosted) | No third-party font requests; no layout shift with `size-adjust` fallbacks. |
| Hosting | **GitHub Pages** via GitHub Actions | See section 13. |

Versions: latest stable at scaffold time, pinned in `package.json` and lockfile; Node 22 LTS.

**Rejected:** Next.js/Astro (no server, and the app is state-heavy, not page-heavy; Astro islands would fight the shared progress store), Svelte/Solid (smaller ecosystem for editor/DnD/a11y widgets; React's cost is acceptable within our budgets), MDX for lessons (lets authors embed arbitrary components and break the fixed anatomy; YAML keeps lessons as validated, tool-readable data), Monaco (size), Tailwind (fine, but tokens + CSS Modules keep visualizer CSS readable and teach-by-example modern CSS).

## 3. Folder structure

```
/
├─ CLAUDE.md
├─ docs/                      CURRICULUM, ARCHITECTURE, DESIGN, ROADMAP
├─ content/                   ← authored data only, no TS/React
│  ├─ curriculum.yaml         tracks → modules → lessons, prerequisites (source of truth for the map)
│  ├─ lessons/<track>/<slug>/
│  │  ├─ lesson.yaml
│  │  └─ snippets/            real .js/.cs/.html/.css files; executed by verify:snippets
│  └─ cheatsheets/<track>.yaml (+ snippets/)
├─ src/
│  ├─ config/app.ts           APP_NAME (the one place the name lives) and other constants
│  ├─ app/                    router, layout shell, providers, error boundaries
│  ├─ features/
│  │  ├─ landing/             hero with digital rain
│  │  ├─ map/                 skill tree (map + list views)
│  │  ├─ lesson/              LessonPlayer and the six anatomy sections
│  │  ├─ cheatsheets/
│  │  └─ profile/             XP, streak, settings, export/import
│  ├─ engine/
│  │  ├─ content/             Zod schemas, manifest loader, types
│  │  ├─ challenges/
│  │  │  ├─ registry.ts       glob-discovers types/*/index.ts
│  │  │  ├─ contract.ts       ChallengeType interface
│  │  │  └─ types/<type>/     index.ts (schema + grade, pure), View.tsx (lazy)
│  │  ├─ runners/
│  │  │  ├─ contract.ts       Runner interface
│  │  │  ├─ web-sandbox/      iframe runner for HTML/CSS/JS
│  │  │  └─ dotnet-wasm/      (Phase 7)
│  │  ├─ progress/            store, persistence, XP/level/streak, migrations, import/export
│  │  ├─ skilltree/           unlock rules, node state derivation
│  │  └─ test-harness/        tiny test/expect API shared by sandbox and verify script
│  ├─ visualizers/<id>/
│  │  ├─ index.ts             metadata + lazy component + props schema
│  │  ├─ model.ts             pure trace/simulation (unit-tested)
│  │  └─ View.tsx
│  ├─ components/             design-system components (Button, Slider, Tabs, CodeBlock...)
│  ├─ effects/                DigitalRain, Glitch, TerminalLoader (all motion-aware)
│  └─ styles/                 tokens.css, base.css, print.css
├─ tools/
│  ├─ vite-plugin-content/    YAML → validated, highlighted JSON chunks + manifest + layout
│  ├─ content-check.ts        cross-file validation (ids, graph, links, drift with CURRICULUM.md)
│  ├─ verify-snippets.ts      runs JS (Node/Playwright) and C# (dotnet) samples, compares output
│  └─ route-shells.ts         emits index.html copies per route for static hosting
├─ tests/e2e/                 Playwright specs
└─ public/
```

## 4. Content pipeline

```
content/**/*.yaml ──► vite-plugin-content ──► Zod validate ──► resolve snippet files
                                                │                   │
                                                │                   ▼
                                                │         Markdown → HTML (restricted subset)
                                                │         Shiki → highlighted HTML
                                                ▼
                        virtual:content/manifest (small: ids, titles, minutes, graph, layout)
                        one lazy JSON chunk per lesson / per cheat sheet
```

- The **manifest** is loaded eagerly (map, search, unlock logic). Lesson bodies are loaded with `import()` when opened, and prefetched when a map node is hovered/focused.
- Prose fields accept a restricted Markdown subset (emphasis, inline code, links, lists, fenced code). Raw HTML is rejected at build time.
- Every reference is resolved at build time: snippet paths, visualizer ids, challenge types, `learn:` links, prerequisite ids. A broken reference fails the build with the file and path of the error.
- Dev server hot-reloads content edits.

## 5. Curriculum and skill-tree model

`content/curriculum.yaml` is the source of truth for structure; lesson files hold content. A lesson listed in the curriculum without a `lesson.yaml` is **planned** (shown on the map as "coming soon").

```yaml
tracks:
  - id: algo
    title: Algorithms & Data Structures
    short: Algo
    color: track-algo            # a design token name, not a hex value
    modules:
      - id: algo.complexity
        title: Complexity
        requires: [js.loops, js.functions, js.arrays]   # entry prerequisites
        lessons:
          - algo.what-is-an-algorithm
          - algo.big-o
          - algo.analyze-code
          - algo.space-complexity
          - algo.amortized
      - id: algo.searching
        title: Searching
        # requires omitted → last lesson of the previous module in this track
        lessons:
          - algo.linear-search
          - algo.binary-search
          - algo.binary-search-variants
      - id: algo.sorting
        title: Sorting
        lessons:
          - algo.sorting-race
          - algo.naive-sorts
          - algo.insertion-sort
          - id: algo.merge-sort
            requires: [algo.recursion]   # extra hard prerequisite (adds to the implicit chain)
            related: [cs.list]           # soft link, dashed edge, never blocks
          # ...
```

Rules:
- **Implicit chain:** each lesson requires the previous lesson in its module; a module's first lesson requires the module's `requires` (default: the last lesson of the previous module in the same track).
- **Explicit extras:** `requires` on a lesson adds hard edges; `related` adds soft edges.
- `boss: true` marks boss nodes (bonus XP, special node style).

Built manifest:

```ts
type NodeId = string;                       // lesson id, e.g. "algo.binary-search"
interface SkillNode {
  id: NodeId; track: TrackId; module: ModuleId;
  title: string; minutes: number; boss: boolean;
  published: boolean;                       // false = planned / coming soon
  requires: NodeId[];                       // fully expanded hard prerequisites
  related: NodeId[];
  position: { x: number; y: number };       // module-local layout (dagre, build time)
}
interface SkillModule { id: ModuleId; track: TrackId; title: string; lessons: NodeId[]; requires: NodeId[]; position: { x: number; y: number } }
```

Validation: unique ids, all references resolve, **no cycles**, every published lesson appears exactly once, and curriculum ids match `docs/CURRICULUM.md`.

**Node state** is derived, never stored:

```ts
type NodeState = 'planned' | 'locked' | 'available' | 'in-progress' | 'completed';
// planned:      !published
// completed:    progress.lessons[id].completedAt is set
// in-progress:  progress.lessons[id] exists
// available:    all requires completed, or settings.freeRoam
// locked:       otherwise (still previewable: concept card readable, challenges disabled)
```

**Free roam** (setting, off by default): every published lesson is available. Intended for experienced developers; completion still tracks normally.

**Map rendering:** two zoom levels. The overview shows tracks as lanes and modules as nodes (about 60). Selecting a module zooms into its lessons. Nodes are real `<button>`s in an HTML layer over an SVG edge layer (focusable, labelled with title + state). Arrow keys move along edges. A **list view** (same data, grouped by track/module) is always one click away and is the default on narrow screens and for screen-reader users.

## 6. Lesson format

A lesson is `content/lessons/<track>/<slug>/lesson.yaml` plus a `snippets/` folder. Schema (simplified TypeScript view of the Zod schema):

```ts
interface Lesson {
  id: LessonId;                 // must match curriculum.yaml; permanent
  version: number;              // bump on meaningful change
  title: string;
  summary: string;              // one line, used on the map and in search
  minutes: number;
  tags?: string[];
  concept: { title: string; body: Markdown; code?: CodeBlock };
  playground: {
    visualizer: VisualizerId;   // lazy-loaded; must exist in src/visualizers
    props: unknown;             // validated by that visualizer's own schema
    prompt: Markdown;           // what to try first (the 30-second hook)
    explore?: string[];         // optional follow-up nudges
  };
  challenges: Challenge[];      // ≥ 1; each validated by its type's schema
  production: { title: string; body: Markdown; code?: CodeBlock }[];  // 1–3
  mistake: { title: string; body: Markdown; bad?: CodeBlock; fix: Markdown; good?: CodeBlock };
  recap: string[];              // 2–3 bullets
  related?: LessonId[];
}

type CodeSource = { file: string } | { inline: string };
interface CodeBlock {
  caption?: string;
  tabs: ({ lang: 'html' | 'css' | 'js' | 'ts' | 'cs' | 'json' | 'sql' | 'bash' | 'text' } & CodeSource & {
    output?: string;            // if present it is a claim → verify:snippets runs the file and compares
    verify?: 'node' | 'browser' | 'dotnet' | 'none';   // 'none' requires a `why`
    why?: string;
  })[];
}

interface ChallengeBase {
  id: string;                   // unique within the lesson; permanent (keys progress)
  type: string;                 // a registered challenge type
  prompt: Markdown;
  hints?: Markdown[];           // progressive; each one costs XP
  explanation: Markdown;        // shown after passing: the "why"
  xp?: number;                  // override the type's default
}
```

### Complete example: `algo.binary-search`

`content/lessons/algo/binary-search/lesson.yaml`

```yaml
id: algo.binary-search
version: 1
title: Binary search
summary: Find a value in a sorted array by halving the search range every step.
minutes: 8
tags: [searching, divide-and-conquer, logarithmic]

concept:
  title: Halve the haystack
  body: |
    Binary search only works on **sorted** data. Look at the middle element.
    Too small? The target can only be in the right half. Too big? Only in the left half.
    Throw the other half away and repeat.

    Every check halves what is left, so 1,000,000 items need at most **20** checks.
    That is **O(log n)**: doubling the data adds one check.
  code:
    caption: The whole algorithm
    tabs:
      - lang: js
        file: snippets/binary-search.js
        output: |
          5
          -1
        verify: node
      - lang: cs
        file: snippets/BinarySearch.cs
        output: |
          5
          -1
        verify: dotnet

playground:
  visualizer: search-race
  props:
    algorithms: [linear, binary]
    size: { min: 8, max: 1024, default: 32 }
    target: random-present
    controls: [size, target, speed, step]
    showComplexity: true
  prompt: |
    Press **Race**. Then drag **Size** to 1,024 and race again.
    Linear search may need all 1,024 checks; binary search never needs more than 11.
  explore:
    - Pick a target that is not in the array. How many checks does each algorithm need?
    - Switch to step mode and watch `lo`, `mid` and `hi` move.

challenges:
  - id: trace-probes
    type: trace
    prompt: Binary search is looking for **23**. Click the elements it checks, in order.
    visualizer: search-race
    props:
      algorithm: binary
      array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
      target: 23
    expect: [4, 7, 5]   # build-time cross-check against the visualizer's own trace
    hints:
      - "The first check is the middle: index ⌊(0 + 9) / 2⌋ = 4."
    explanation: |
      16 < 23, so the left half is gone (`lo = 5`). The middle of 5..9 is index 7 (56): too big, so `hi = 6`.
      The middle of 5..6 is index 5: found in 3 checks. Linear search would have needed 6.

  - id: where-it-stops
    type: predict-output
    prompt: The value **4** is not in the array. What does this print?
    code: { lang: js, file: snippets/predict-missing.js }
    answer: "3 2 1"     # verify:snippets runs the file and fails the build if stdout differs
    verify: node
    hints:
      - Track `lo`, `hi` and `mid` on paper. The loop ends when `lo > hi`.
    explanation: |
      Checks: index 2 (5, too big) → index 0 (1, too small) → index 1 (3, too small).
      `lo` ends at 2, exactly where 4 would be inserted. That is why library versions can report an insertion point.

  - id: off-by-one
    type: find-bug
    prompt: "`binarySearch([4, 8], 8)` returns `-1`. Click the buggy line, then choose the fix."
    code: { lang: js, file: snippets/bug-off-by-one.js }
    bugLines: [4]
    fix:
      choices:
        - { text: "while (lo <= hi) {", correct: true }
        - { text: "while (lo < hi - 1) {" }
        - { text: "while (lo + 1 < hi) {" }
    tests: { file: snippets/binary-search.test.js }   # build: the correct fix must pass, every distractor must fail
    explanation: |
      With `lo < hi` the loop stops while one candidate (`lo === hi`) is still unchecked.
      `lo <= hi` keeps going until the range is truly empty.

  - id: implement
    type: live-code
    prompt: Implement `binarySearch(xs, target)`. Return the index of `target` in the sorted array, or `-1`.
    runner: web-sandbox
    files:
      main.js: { file: snippets/implement.starter.js, editable: true }
    solution:
      main.js: { file: snippets/binary-search.solution.js }
    tests: { file: snippets/binary-search.test.js }   # build: solution must pass, starter must fail
    hints:
      - Keep two indices, `lo` and `hi`, and loop while `lo <= hi`.
      - "`const mid = Math.floor((lo + hi) / 2);`"
    explanation: Same loop as the concept card. If you passed, you can write binary search from memory.

production:
  - title: Call the library
    body: |
      .NET has `Array.BinarySearch` and `List<T>.BinarySearch`. When the value is missing they return a
      negative number: the bitwise complement (`~`) of the index where it would be inserted.
      JavaScript has no built-in binary search on arrays; you write it (as above) or use a utility library.
    code:
      tabs:
        - lang: cs
          file: snippets/ArrayBinarySearch.cs
          output: |
            -4
            3
          verify: dotnet
  - title: git bisect
    body: "`git bisect` binary-searches your commit history for the commit that introduced a bug: about 10 test runs for 1,000 commits."
  - title: Database indexes
    body: B-tree indexes use the same "discard what can't contain it" idea, which is why an indexed lookup stays fast as a table grows from thousands to millions of rows.

mistake:
  title: Binary-searching unsorted data
  body: Binary search assumes sorted input and never checks. On unsorted data it does not crash; it silently misses values that are there.
  bad:
    tabs:
      - lang: js
        file: snippets/mistake-unsorted.js
        output: "-1"
        verify: node
  fix: Sort first if you will search many times (sorting is O(n log n) once, each search O(log n)). For a single lookup, a linear scan (O(n)) is cheaper than sorting.

recap:
  - Binary search needs sorted data and halves the range each step, so it is O(log n).
  - Loop while `lo <= hi`; move `lo` to `mid + 1` or `hi` to `mid - 1`.
  - In real code, call the library and know what it returns for a missing value.

related: [algo.binary-search-variants, cs.list]
```

`snippets/binary-search.js`

```js
function binarySearch(xs, target) {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xs[mid] === target) return mid;
    if (xs[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

const xs = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log(binarySearch(xs, 23));
console.log(binarySearch(xs, 24));
```

`snippets/BinarySearch.cs` (a .NET 10 file-based app: `dotnet run BinarySearch.cs`)

```csharp
int[] xs = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
Console.WriteLine(BinarySearch(xs, 23));
Console.WriteLine(BinarySearch(xs, 24));

static int BinarySearch(int[] xs, int target)
{
    int lo = 0;
    int hi = xs.Length - 1;
    while (lo <= hi)
    {
        int mid = lo + (hi - lo) / 2; // (lo + hi) / 2 can overflow int on huge arrays
        if (xs[mid] == target) return mid;
        if (xs[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

`snippets/ArrayBinarySearch.cs`

```csharp
int[] prices = [5, 10, 20, 40];
int i = Array.BinarySearch(prices, 25);
Console.WriteLine(i);
Console.WriteLine(~i); // insert 25 here to keep the array sorted
```

`snippets/predict-missing.js`

```js
const xs = [1, 3, 5, 7, 9, 11];
let lo = 0;
let hi = xs.length - 1;
let steps = 0;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  steps++;
  if (xs[mid] === 4) break;
  if (xs[mid] < 4) lo = mid + 1;
  else hi = mid - 1;
}
console.log(steps, lo, hi);
```

`snippets/bug-off-by-one.js`

```js
function binarySearch(xs, target) {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xs[mid] === target) return mid;
    if (xs[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

`snippets/mistake-unsorted.js` is the solution function followed by `console.log(binarySearch([9, 2, 7, 4, 5], 9));`.

`snippets/implement.starter.js`

```js
function binarySearch(xs, target) {
  // Return the index of target in the sorted array xs, or -1.
  return -1;
}
```

`snippets/binary-search.solution.js` is the function from `binary-search.js` without the `console.log` lines.

`snippets/binary-search.test.js` (runs after the learner's code in the same realm; `test`/`expect` come from the shared harness)

```js
test('finds a value in the middle', () => {
  expect(binarySearch([1, 3, 5, 7, 9], 7)).toBe(3);
});
test('finds the first and last values', () => {
  expect(binarySearch([1, 3, 5, 7, 9], 1)).toBe(0);
  expect(binarySearch([1, 3, 5, 7, 9], 9)).toBe(4);
});
test('finds the only value', () => {
  expect(binarySearch([42], 42)).toBe(0);
});
test('returns -1 when the value is missing', () => {
  expect(binarySearch([1, 3, 5, 7, 9], 4)).toBe(-1);
  expect(binarySearch([], 1)).toBe(-1);
});
```

All outputs above were verified while writing this document: Node 22 for the JS files (including that the correct fix and solution pass the tests while both distractors and the starter fail) and the .NET 10 SDK (`dotnet run`) for the C# files.

## 7. Visualizers

```ts
// src/visualizers/<id>/index.ts
export default defineVisualizer({
  id: 'search-race',
  props: SearchRacePropsSchema,              // Zod; lesson props validated at build time
  load: () => import('./View'),              // the only heavy part; lazy
  trace: searchRaceTrace,                    // optional pure function, reused by `trace` challenges
});
```

- **Trace-based model.** Algorithm visualizers call a pure generator that returns a list of frames (`{ array, pointers, highlights, counters, event }`). The view renders frame *i*. Play, pause, step forward/back, scrub, speed and the comparison/swap counters all come from one shared `<StepPlayer>`; no visualizer re-implements them. Big O labels come from the trace metadata.
- **Simulators** (event loop, DI lifetimes, middleware, EF change tracking) use the same idea: a pure reducer `(state, action) → state` plus a script of actions, so they are step-able and unit-testable.
- **Learner-drives mode.** A visualizer can run in "trace" mode, where the learner proposes the next step and the trace verifies it. That is how `trace` challenges work without duplicating algorithm code.
- **Small screens.** Each visualizer declares a compact layout (fewer bars, stacked panels, controls in a bottom sheet). It must remain usable at 360 px wide.
- **Motion.** Visualizers read a single `useMotionPreference()`; with reduced motion, frames change instantly (no tweening) and autoplay is off.

## 8. Challenge plugins and runners

### Contract

```ts
// src/engine/challenges/contract.ts
export interface ChallengeType<Spec extends ChallengeBase, Answer> {
  type: string;                                   // 'predict-output'
  schema: z.ZodType<Spec>;                        // build-time + runtime validation
  defaultXp: number;
  View: () => Promise<{ default: ComponentType<ChallengeViewProps<Spec, Answer>> }>;  // lazy
  grade(spec: Spec, answer: Answer, ctx: GradeContext): GradeResult | Promise<GradeResult>;
  buildCheck?(spec: Spec, ctx: BuildCheckContext): Promise<BuildIssue[]>;  // e.g. "solution passes, starter fails"
  capabilities?: (ctx: RuntimeCapabilities) => Partial<Spec>;              // e.g. offer "Run it" when a runner exists
}

export interface GradeResult {
  passed: boolean;
  feedback: Markdown;                 // specific: which test failed, which blank is wrong
  details?: { label: string; passed: boolean; message?: string }[];
}

export interface ChallengeViewProps<Spec, Answer> {
  spec: Spec;
  state: ChallengeAttemptState;       // attempts, hints revealed, last result
  submit(answer: Answer): Promise<GradeResult>;
  requestHint(): void;
  reveal(): void;
  runners: RunnerRegistry;            // for types that execute code
}
```

`registry.ts` discovers `types/*/index.ts` with `import.meta.glob` (eager for the small pure part, lazy for `View`). The lesson schema is a discriminated union built from the registry, so a lesson with an unknown `type` fails the build.

### Built-in types

| Type | Spec (key fields) | Grading |
|---|---|---|
| `predict-output` | `code`, `answer` (or `choices`), `verify` | Normalize line endings and trailing whitespace; exact compare. The answer is checked against real execution at build time. |
| `fill-blank` | `code` with `[[name]]` markers, `blanks: { name: { accept: string[], caseSensitive? } }` | Per-blank match; per-blank feedback. |
| `find-bug` | `code`, `bugLines`, `fix.choices` or `fix.accept`, optional `tests` | Line selection, then fix. With `tests`, the build proves the correct fix passes and every distractor fails. |
| `reorder` | `items` (correct order), `distractors?`, `alternatives?` (other valid orders) | Order equality against any accepted order. |
| `live-code` | `runner`, `files` (+ `editable`), `tests`, `solution` | Runs tests in the runner; build proves solution passes and starter fails. |
| `visual-match` | `html`, `starterCss`, `targetCss`, `compare: { selectors, tolerancePx, properties? }` | Renders learner and target in identical sandboxes; compares element boxes (`getBoundingClientRect`) within tolerance and listed computed styles. No pixel diffs (fonts/antialiasing make them flaky). A ghost overlay shows the target. |
| `trace` | `visualizer`, `props`, `expect?` | Steps checked against the visualizer's own trace; first wrong step is highlighted. |
| `choice` | `options: { text, correct?, why }[]`, `multiple?` | Exact set match; each option explains itself. |

### Runners

```ts
// src/engine/runners/contract.ts
export interface Runner {
  id: string;                                   // 'web-sandbox', later 'dotnet-wasm'
  languages: string[];                          // ['html', 'css', 'js'] / ['cs']
  prepare(onProgress?: (p: LoadProgress) => void): Promise<void>;   // lazy download/boot
  run(req: RunRequest, signal: AbortSignal): Promise<RunResult>;
}
export interface RunRequest { files: Record<string, string>; entry?: string; tests?: string; timeoutMs?: number }
export interface RunResult {
  status: 'ok' | 'compile-error' | 'runtime-error' | 'timeout';
  stdout: string[];                              // console output, in order
  diagnostics: { message: string; line?: number; column?: number; severity: 'error' | 'warning' }[];
  tests: { name: string; passed: boolean; message?: string }[];
  durationMs: number;
}
```

**`web-sandbox` (Phase 1).**
- A fresh `<iframe sandbox="allow-scripts">` (no `allow-same-origin`, so the code runs in an opaque origin and cannot read the app's storage or DOM) using `srcdoc`, with a CSP `<meta>` that blocks all network access except data/blob URLs.
- Communication via a `MessageChannel` port: console capture, errors, test results.
- Learner code and the shared test harness (`test`, `expect` with `toBe`, `toEqual`, `toThrow`, `toBeCloseTo`, plus DOM helpers for HTML/CSS tests) run in the same realm; tests run after the learner's scripts.
- Infinite-loop protection: a loop-guard transform (inserted iteration/time checks) plus a watchdog that destroys the iframe after `timeoutMs` (default 3 s) and reports `timeout`.
- The same harness runs in Node (`node:vm`) for build-time checks, so "the solution passes" is proven before deploy.

**Future `dotnet-wasm` (Phase 7), with no engine change:**
1. Add `src/engine/runners/dotnet-wasm/`: a .NET WebAssembly app (`wasmbrowser` template) that hosts Roslyn (`Microsoft.CodeAnalysis.CSharp`), compiles the learner's files plus C# tests in memory, loads the assembly in a collectible `AssemblyLoadContext` and returns `RunResult`. It runs in a Web Worker so the UI never blocks.
2. Add challenge type `cs-live-code` (its own folder; reuses the shared `CodeChallengeShell` and test-result UI). Its spec mirrors `live-code` with `runner: dotnet-wasm` and C# tests written against a small assertion API.
3. Existing `predict-output` challenges with `lang: cs` automatically gain a "Run it" button through `capabilities` when the runner is registered.
4. The runtime + Roslyn payload is large (to be measured in the Phase 7 spike; expect tens of MB uncompressed). It is downloaded only on first use, with a terminal-style progress loader, and cached by the service worker.

## 9. Progress, XP and streaks

### Stored data (localStorage)

```ts
// key: `${STORAGE_NAMESPACE}.progress` (STORAGE_NAMESPACE is fixed, e.g. "pneon"; it does NOT derive from APP_NAME,
// so renaming the app never loses anyone's progress)
interface ProgressV1 {
  schemaVersion: 1;
  createdAt: string;                                  // ISO timestamp
  lessons: Record<LessonId, {
    startedAt: string;
    completedAt?: string;
    contentVersion: number;                           // lesson.version when completed
    completionXp: number;                             // awarded once
    challenges: Record<ChallengeId, {
      attempts: number;
      hintsUsed: number;
      revealed: boolean;
      passedAt?: string;
      xp: number;                                     // snapshot at award time; rule changes are never retroactive
    }>;
  }>;
  activity: Record<LocalDate, { xp: number; passed: number }>;   // "2026-10-06" in the learner's local time zone
  lastCelebratedLevel: number;                        // level-up animation plays once per level
  settings: {
    freeRoam: boolean;
    effects: 'system' | 'full' | 'reduced' | 'off';   // 'system' follows prefers-reduced-motion
    preferredCodeTab: 'js' | 'cs';
    editorFontSize: number;
  };
}
```

Everything else is **derived**: total XP (sum of snapshots), level, current/longest streak, node states, track completion percentages.

### Rules

- **Challenge XP** = type default (`choice` 5; `predict-output`, `fill-blank`, `reorder`, `trace` 10; `find-bug` 15; `live-code`, `visual-match` 20) or the spec's `xp`.
  - First attempt without hints: ×1.5 (rounded).
  - Each hint used: −25%, floor at 25%.
  - Revealed solution: 0 XP. The learner must still submit the correct answer to pass, so they type it at least once.
- **Lesson completed** when every challenge has passed: +20 XP (boss lessons +100).
- **Level:** cumulative XP to reach level L is `50 · L · (L − 1)` (L2 = 100, L3 = 300, L5 = 1,000, L10 = 4,500). The full curriculum yields roughly 15k XP, about level 18.
- **Streak:** a day counts when at least one challenge passes. The current streak is the run of consecutive local dates ending today or yesterday. No penalties, no notifications; streaks are encouragement, not pressure.
- **Content changes:** completion is never revoked. If a completed lesson gains a challenge, the node shows a small "new" badge.

### Persistence

- A store subscriber writes debounced (300 ms) and on `pagehide`. Writes are wrapped in try/catch; on failure (quota, private mode) the app keeps working in memory and shows a non-blocking "progress can't be saved; export it" banner.
- Cross-tab sync via the `storage` event.
- `schemaVersion` + ordered migrations (`migrations/v1-to-v2.ts`...), each unit-tested with fixtures.

### Export / import

- Export downloads `<app-slug>-progress-YYYY-MM-DD.json`:
  `{ "format": "pneon-progress", "schemaVersion": 1, "exportedAt": "...", "progress": { ... } }`
- Import: parse → Zod-validate → migrate → show a summary (lessons, XP, streak vs current) → **Replace** or **Merge** (union of lessons; per challenge keep the earliest pass and the higher XP; union of activity days). Invalid files are rejected with a specific message and never partially applied.

## 10. Cheat sheets

Content: `content/cheatsheets/<track>.yaml` (tracks: `html`, `css`, `js`, `cs`, `dotnet`, `algo`).

```yaml
track: js
title: JavaScript
sections:
  - id: arrays
    title: Arrays
    entries:
      - id: js.sheet.array-map           # permanent; used for deep links (#js.sheet.array-map)
        title: Transform every item
        code: { lang: js, inline: "const doubled = [1, 2, 3].map((n) => n * 2);" }
        check: "console.log(JSON.stringify(doubled));"   # appended at verify time
        output: "[2,4,6]"
        explain: Returns a new array with the callback applied to each element.
        usage: daily                     # daily | common | rare
        learn: js.array-iteration        # optional; must be a curriculum id
        legacy: false                    # true → shown with a "legacy, still common" marker
```

- Any entry that states a result must be checkable (`output` + optional hidden `check`); the same verifier as lessons runs it.
- The Algorithms sheet uses a `table` entry kind (structure × operation → Big O, with notes) instead of snippets.
- **Learn links** are validated at build time and rendered only when the target lesson is **published**; for planned lessons the link is hidden.
- **Search:** one MiniSearch index over all sheets (title, explanation, code tokens, tags), built when the Cheat Sheets route loads. Prefix + fuzzy matching, results grouped by track. Filter chips for usage tag. `/` focuses the search box.
- **Always accessible:** the route is not gated by progress.
- **Print:** `print.css` hides navigation, search, filters, copy buttons and effects; black on white; usage tag printed as text; entries avoid page breaks; one track per printed section.
- **Copy button:** `navigator.clipboard.writeText` with a visible and announced (`aria-live`) "Copied" state.

## 11. Accuracy pipeline

`npm run verify:snippets` (CI-required):

| Kind | How it is verified |
|---|---|
| JS (`verify: node`) | Run in Node 22 (`node:vm`), capture stdout, compare to `output`/`answer`. |
| JS/HTML/CSS (`verify: browser`) | Run in headless Chromium via Playwright inside the real `web-sandbox` runner. Used for DOM, event-loop and timing-sensitive examples. |
| C# (`verify: dotnet`) | `dotnet run <file>.cs` (.NET 10 file-based apps; `#:package` / `#:sdk Microsoft.NET.Sdk.Web` directives for package and ASP.NET Core samples). Samples that only need to compile (e.g. an endpoint) declare `verify: dotnet-build`. |
| Challenges | `find-bug` fixes, `live-code` solutions/starters and `trace` expectations proven by the type's `buildCheck`. |
| `verify: none` | Requires a `why` (e.g. "pseudo-output of a simulated HTTP request") and is listed in a report for human review. |

Results are cached by content hash (`.cache/verify.json`) so local runs only execute changed snippets; CI restores the cache from `main` for PRs and runs everything on a nightly schedule.

`npm run content:check`: schema validation, unique ids, graph rules, link resolution, curriculum ↔ `CURRICULUM.md` id parity, minutes within 3–10, anatomy completeness (recap 2–3 items, production 1–3, ≥ 1 challenge).

## 12. Routing and performance

| Route | Chunk contents |
|---|---|
| `/` | Landing + DigitalRain (canvas) |
| `/map` | Map (manifest, layout, Motion) |
| `/learn/:lessonId` | LessonPlayer shell; lesson JSON, visualizer, challenge views and CodeMirror each lazy |
| `/cheatsheets`, `/cheatsheets/:track` | Sheets + MiniSearch |
| `/profile` | Stats, settings, export/import |

Budgets (gzip, enforced in CI): initial route JS ≤ 150 KB; lesson JSON ≤ 30 KB; a visualizer ≤ 60 KB; CodeMirror loaded only when an editor is on screen. Lighthouse performance ≥ 90 on the map and a reference lesson (mobile profile). Fonts subset to Latin, preloaded for the reading font only.

A service worker (Phase 8, `vite-plugin-pwa`) precaches the shell and caches lesson chunks after first visit, so learning works offline; it becomes essential in Phase 7 to cache the .NET runtime.

## 13. Hosting and deployment

**GitHub Pages, deployed by GitHub Actions.**

- Free with no build-minute or bandwidth billing surprises for a public repository, and code, CI and hosting live in one place with no extra account.
- Netlify and Vercel offer more (custom headers, rewrites, preview deploys), but their free tiers are metered (Netlify's credit-based free plan) or limited to non-commercial use (Vercel Hobby), and we do not need a server feature: the app is fully static and the sandbox uses `srcdoc` iframes, which do not depend on response headers.
- Trade-offs we accept: no custom HTTP headers (CSP is set by `<meta>`; the sandbox iframe has its own CSP), and no SPA rewrites. Solved by **route shells**: at build time `tools/route-shells.ts` writes an `index.html` copy (with route-specific `<title>`/description) for every known route (`/map/`, `/learn/<id>/`, `/cheatsheets/<track>/`...). Deep links return 200 and share well. A `404.html` handles anything else.
- The Vite `base` comes from an environment variable (`/<repo>/` on `*.github.io`, `/` with a custom domain). Add `.nojekyll` (needed in Phase 7 for the `_framework` folder of the .NET runtime).
- If we ever need custom headers (e.g. cross-origin isolation for multithreaded WASM), the static build moves unchanged to Cloudflare Pages or Netlify.

Pipeline (`.github/workflows/ci.yml`): install → lint → typecheck → unit tests → `content:check` → `verify:snippets` (setup-node 22, setup-dotnet 10) → build (+ bundle budget) → Playwright e2e + axe → on `main`: upload Pages artifact and deploy.

## 14. Testing strategy

- **Unit (Vitest):** every visualizer `model.ts`, every challenge `grade`, XP/level/streak math, unlock rules, migrations, import merge.
- **Component:** challenge views (keyboard-only flows included).
- **E2E (Playwright):** complete a lesson end to end, unlock propagation on the map, export → clear → import round trip, cheat-sheet search and copy, reduced-motion mode.
- **Accessibility:** axe on every route and on each lesson section; manual screen-reader pass per phase (NVDA + VoiceOver).

## 15. App configuration

```ts
// src/config/app.ts
export const APP_NAME = 'Project Neon';        // the only place the product name is written
export const STORAGE_NAMESPACE = 'pneon';      // internal, permanent; independent of APP_NAME
```

`index.html` `<title>`, the web manifest and export file names read `APP_NAME` through a Vite `transformIndexHtml` hook and imports. Content and docs refer to "the app", never to the name.
