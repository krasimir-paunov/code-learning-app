# Roadmap

Each phase ends with a working, deployed app. Lesson counts come from [CURRICULUM.md](CURRICULUM.md). A phase is done when its exit criteria pass in CI, not when the code is written.

## Shape: two passes

All **272** lessons are on the map from Phase 1 (unbuilt ones show as "coming soon"). Content is built in two passes:

- **Pass 1, Core (207 lessons, ~23 h of learning):** Phases 2–6 build only each track's **Core** lessons, the ones needed to be job-ready, then the TypeScript module (J14). Because Core lessons never require Extended ones, the app is complete and coherent after Pass 1 and **can ship as v1.0** (Release gate below).
- **Pass 2, Extended (65 lessons, ~6.6 h):** the same tracks in the same order, adding depth lessons.

```
Phase 1 ─► Pass 1: P2 Core ─► P3 Core ─► P4 Core ─► P5 Core ─► P6 Core ─► TypeScript (J14) ─► Release gate (v1.0, can ship)
                                                                                                   │
           Pass 2: P2 Ext ─► P3 Ext ─► P4 Ext ─► P5 Ext ─► P6 Ext ─► Phase 8 (v2.0)
Phase 7 (optional C# runner): any time after Phase 5 Core; independent of content passes.
```

| Phase | Pass 1 (Core) | Pass 2 (Extended) |
|---|---|---|
| 1 Foundation | 2 reference lessons (both Core) | — |
| 2 HTML & CSS | 50 (HTML 21, CSS 29) | 19 (HTML 6, CSS 13) |
| 3 JavaScript | 48 | 12 |
| 4 Algorithms & DS | 26 | 14 |
| 5 C# | 42 | 10 |
| 6 .NET | 33 | 10 |
| After Phase 6: TypeScript (J14) | 6 | — |
| **Total** | **207** | **65** |

**Definition of done for any lesson** (applies to every content phase):
1. Follows the six-part anatomy; 3–10 minutes; first interaction within 30 seconds.
2. `content:check` and `verify:snippets` pass; every output claim executed (Node / Chromium / `dotnet` / `tsc`).
3. Works by keyboard only, at 360 px wide, and with effects off; axe clean.
4. Status set to `done` in `CURRICULUM.md` and the lesson is published in `curriculum.yaml`.
5. Related cheat-sheet entries get their `learn:` link (it appears automatically once the lesson is published).

---

## Phase 1 · Foundation, engine and two reference lessons

Goal: every engine piece exists and is proven by two complete lessons in two very different tracks.

Milestones:
1. **Scaffold:** Vite + React + TS strict, ESLint/Prettier, Vitest, Playwright, `src/config/app.ts`, two-layer design tokens (dark theme), fonts, base and print CSS. CI pipeline and GitHub Pages deploy from day one (with route shells).
2. **Content pipeline:** Zod schemas, `vite-plugin-content` (YAML → validated, Markdown + Shiki → lazy JSON chunks + manifest), `content:check` (incl. tier rules), `verify:snippets` (Node, Playwright, `dotnet run`, `tsc`, hash cache). `content/curriculum.yaml` with **all 272 lessons** (tiers, prerequisites, recommendations) as planned nodes.
3. **App shell and design system:** `AppShell`, `TopBar`, primitives, `CodeBlock`, `TerminalLoader`, effects settings, landing page with digital rain.
4. **Skill tree:** build-time layout, map (overview + module zoom), list view, node states and tier variants, Core/All filter, unlock rules (incl. unpublished-prerequisite resolution), soft gates with `RecommendationBanner` and one-click skip, Free roam setting, lesson preview card.
5. **Lesson player:** six sections, section rail, lazy visualizer loading, `StepPlayer` and visualizer primitives.
6. **Challenges:** contract + registry; all eight types (`predict-output`, `fill-blank`, `find-bug`, `reorder`, `live-code`, `visual-match`, `trace`, `choice`) with build checks; `web-sandbox` runner with loop guard and watchdog; shared test harness (browser + Node).
7. **Progress:** store, persistence, XP/level/streak, level-up overlay, export/import (replace/merge), migrations scaffold, profile page.
8. **Cheat sheets engine:** data format, index/search/filter, copy, print stylesheet, Learn links; a starter sheet with ~10 verified entries per track to exercise every feature (HTML, CSS, JS, C#, .NET, Algorithms Big O table).
9. **Reference lessons:**
   - `css.box-model`: `box-inspector`; visual-match, fill-blank, reorder, choice.
   - `algo.binary-search`: `search-race` + `step-tracer`; trace, predict-output, find-bug, live-code (the example in ARCHITECTURE.md).

Exit criteria: both lessons pass the lesson DoD; Lighthouse ≥ 90 (mobile) on map and both lessons; bundle budgets enforced; export → clear storage → import restores progress exactly (e2e); the deployed site works from a deep link; a C# lesson with an unmet recommendation shows the banner and the skip persists (e2e, using a stub lesson in test fixtures).

---

## Pass 1 · Core

### Phase 2 (Core) · HTML and CSS

- **50 Core lessons** (HTML 21, CSS 29; `css.box-model` shipped in Phase 1), built module by module in the recommended path order (H1–H3, C1–C3, H4–H5, C4–C5, ...), including both boss lessons.
- Visualizers needed by Core lessons, starting by extracting shared primitives: `bucket-sort` widget, resizable `viewport-lab` frame, `selector-lab` highlighter, `sr-preview` (built on the accessibility tree computed in the sandbox).
- Cheat sheets: **HTML** and **CSS** complete (they cover daily/common/rare entries regardless of tier; Learn links appear as lessons publish).
- Exit: Core path of both tracks playable end to end; manual screen-reader pass of 5 sampled lessons.

### Phase 3 (Core) · JavaScript

- **48 Core lessons** (J1–J13 Core).
- Key visualizers: `event-loop`, `memory-diagram`, `closure-backpack`, `pipeline-viz` (reused by LINQ), `async-timeline` (reused by C# tasks), `test-runner`, `network-panel` (mocked fetch inside the sandbox).
- `verify: browser` for DOM, timers and event-loop samples.
- Cheat sheet: **JavaScript** complete.
- Exit: Core path complete; event-loop predictions verified in Chromium; all live-code lessons pass build checks.

### Phase 4 (Core) · Algorithms and Data Structures

- **26 Core lessons** (`algo.binary-search` shipped in Phase 1).
- Flagship: `sort-race` (side-by-side algorithms, size and speed controls, step mode, comparison/swap counters, live Big O), then `tree-lab`, `graph-lab`, `hash-buckets`, `call-tree`.
- All algorithm code in JS and C# tabs, both verified.
- Cheat sheet: **Algorithms** (Big O table for structures × operations, sorting comparison, technique picker).
- Exit: every trace challenge cross-checked against its model; race stays at 60 fps with 1,000 bars on a mid-range laptop and degrades gracefully on phones.

### Phase 5 (Core) · C\#

- **42 Core lessons**, taught with visualizers and non-executing challenges. Recommendation banners active for the JS/Algorithms soft gates.
- Key visualizers: `compiler-sim` (diagnostics captured from real `dotnet build` output at content-build time, never invented), `memory-diagram` (value/reference mode), `linq-pipeline`, `async-state-machine`, `pattern-matcher`, `equality-lab`.
- Cheat sheet: **C#** complete (C# 14 / .NET 10).
- Exit: every C# claim verified with the .NET 10 SDK; every compiler message shown to learners comes from the real compiler.

### Phase 6 (Core) · .NET (ASP.NET Core, EF Core)

- **33 Core lessons**, all through simulators.
- Key simulators: `middleware-pipeline`, `di-lifetimes`, `ef-tracker`, `sql-mirror` (SQL captured from real EF Core logging against SQLite at content-build time), `http-inspector`, `config-layers`, `cors-sim`.
- `verify: dotnet-build` for endpoint and configuration samples (`#:sdk Microsoft.NET.Sdk.Web`, `#:package` for EF Core and OpenAPI).
- Cheat sheet: **.NET** complete.
- Exit: Core path complete; simulator behavior matches documented framework behavior (each simulator folder has a README with its sources).

### TypeScript module (J14, Core) · after Phase 6

- **6 Core lessons** at the end of the JS track (entry: `js.boss`). Scheduled here, not in Phase 3, because TypeScript is easiest once JavaScript is solid and the compiler tooling from Phase 5 (`compiler-sim`) is already built.
- Visualizers: `type-narrowing`; TS modes of `compiler-sim`, `build-pipeline` and `network-panel`.
- `verify: tsc` for every sample; diagnostics shown to learners are the real compiler's (`expectErrors`).
- Cheat sheet: a TypeScript section in the **JavaScript** sheet.
- Exit: J14 playable end to end; every TS claim and diagnostic verified with `tsc --strict`.

### Release gate · v1.0 (end of Pass 1)

The Phase 8 audits, run against the Core app: WCAG 2.2 AA audit (automated + manual NVDA/VoiceOver), performance (Lighthouse, low-end Android), full `verify:snippets` on current LTS toolchains, link check, copy edit, PWA/offline, onboarding ("new to programming" vs "experienced" → suggests Free roam), privacy note. Then the decision to launch: final name (`APP_NAME` only), optional custom domain, v1.0 tag. Extended nodes remain on the map as "coming soon".

---

## Pass 2 · Extended

Same order, same Definition of Done. Each step can ship on its own (continuous deploy); no engine work expected beyond new visualizers.

| Step | Lessons | Notable new visualizers |
|---|---|---|
| Phase 2 (Ext) HTML & CSS | 19 (HTML 6, CSS 13) | `srcset-picker`, `share-preview`, `pref-emulator`, `timeline-scrubber`, `render-pipeline` |
| Phase 3 (Ext) JavaScript | 12 | `storage-inspector`, `prototype-chain`, `build-pipeline`, `regex-lab`, `intl-lab`, `observer-lab`, `jank-meter`, `vitals-sim` |
| Phase 4 (Ext) Algorithms | 14 | `heap-lab`, `interval-lab`, `dp-table` (naive and insertion sorts are new modes of `sort-race`) |
| Phase 5 (Ext) C# | 10 | `collection-chooser`, `thread-interleave`, `attribute-lens`, `allocation-meter` |
| Phase 6 (Ext) .NET | 10 | `openapi-preview`, `cache-sim`, `trace-waterfall`, `rate-limit-sim` |

Exit for Pass 2: all 272 lessons `done`; bosses get optional extra rounds drawing on Extended material.

---

## Phase 7 (optional) · Real in-browser C# runner

Can start any time after Phase 5 Core; independent of the content passes.

- Spike first (time-boxed): Roslyn in a .NET WebAssembly app in a Web Worker; measure download size, cold-start compile time and memory on a mid-range phone. Go/no-go based on numbers.
- If go: `dotnet-wasm` runner, `cs-live-code` challenge type, C# assertion mini-library, "Run it" on C# predict-output challenges, service-worker caching, terminal-style download progress.
- Retrofit: add `cs-live-code` challenges to ~20 C# lessons where writing code is the point (methods, classes, LINQ, pattern matching...).
- Exit: no engine files changed outside `runners/dotnet-wasm` and `challenges/types/cs-live-code` (proves the plugin design).

## Phase 8 · Polish, audit and deployment (v2.0)

After Pass 2 (the same audits as the Release gate, now over all 272 lessons) plus:
- **Polish:** map transitions, achievement set, empty/error states, 404 page, Core/All filter defaults revisited with real usage.
- **Light theme** (if wanted): a `data-theme="light"` token set; the dark theme stays the default.
- **Deployment:** custom domain (if not done at v1.0), social preview images per track, final performance budget review.
- Exit: release checklist complete; v2.0 tagged.

---

## Ongoing maintenance

- Each November (new .NET release): review C#/.NET content against the new release and decide whether to move. Stay on the latest **LTS** by default (.NET 10 now; .NET 11 is an STS release).
- Twice a year: refresh Baseline statuses for HTML/CSS/JS features and update "newly available" labels.
