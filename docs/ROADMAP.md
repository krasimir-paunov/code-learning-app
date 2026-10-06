# Roadmap

Each phase ends with a working, deployed app. Lesson counts come from [CURRICULUM.md](CURRICULUM.md). A phase is done when its exit criteria pass in CI, not when the code is written.

**Definition of done for any lesson** (applies to every content phase):
1. Follows the six-part anatomy; 3–10 minutes; first interaction within 30 seconds.
2. `content:check` and `verify:snippets` pass; every output claim executed (Node / Chromium / `dotnet`).
3. Works by keyboard only, at 360 px wide, and with effects off; axe clean.
4. Status set to `done` in `CURRICULUM.md` and the lesson is published in `curriculum.yaml`.
5. Related cheat-sheet entries get their `learn:` link (it appears automatically once the lesson is published).

---

## Phase 1 · Foundation, engine and two reference lessons

Goal: every engine piece exists and is proven by two complete lessons in two very different tracks.

Milestones:
1. **Scaffold:** Vite + React + TS strict, ESLint/Prettier, Vitest, Playwright, `src/config/app.ts`, design tokens, fonts, base and print CSS. CI pipeline and GitHub Pages deploy from day one (with route shells).
2. **Content pipeline:** Zod schemas, `vite-plugin-content` (YAML → validated, Markdown + Shiki → lazy JSON chunks + manifest), `content:check`, `verify:snippets` (Node, Playwright, `dotnet run`, hash cache). `content/curriculum.yaml` with **all 266 lessons** as planned nodes.
3. **App shell and design system:** `AppShell`, `TopBar`, primitives, `CodeBlock`, `TerminalLoader`, effects settings, landing page with digital rain.
4. **Skill tree:** build-time layout, map (overview + module zoom), list view, node states, unlock rules, Free roam setting, lesson preview card.
5. **Lesson player:** six sections, section rail, lazy visualizer loading, `StepPlayer` and visualizer primitives.
6. **Challenges:** contract + registry; all eight types (`predict-output`, `fill-blank`, `find-bug`, `reorder`, `live-code`, `visual-match`, `trace`, `choice`) with build checks; `web-sandbox` runner with loop guard and watchdog; shared test harness (browser + Node).
7. **Progress:** store, persistence, XP/level/streak, level-up overlay, export/import (replace/merge), migrations scaffold, profile page.
8. **Cheat sheets engine:** data format, index/search/filter, copy, print stylesheet, Learn links; a starter sheet with ~10 verified entries per track to exercise every feature (HTML, CSS, JS, C#, .NET, Algorithms Big O table).
9. **Reference lessons:**
   - `css.box-model`: `box-inspector`; visual-match, fill-blank, reorder, choice.
   - `algo.binary-search`: `search-race` + `step-tracer`; trace, predict-output, find-bug, live-code (the example in ARCHITECTURE.md).

Exit criteria: both lessons pass the lesson DoD; Lighthouse ≥ 90 (mobile) on map and both lessons; bundle budgets enforced; export → clear storage → import restores progress exactly (e2e); the deployed site works from a deep link.

## Phase 2 · HTML and CSS

- **69 lessons** (HTML 27, CSS 42; `css.box-model` already shipped in Phase 1): HTML H1–H8, CSS C1–C10. Built module by module, interleaved in the recommended path order (H1–H3, C1–C3, H4–H5, C4–C5, ...).
- Visualizers: ~40 (see the inventory), starting by extracting shared primitives: `bucket-sort` widget, resizable `viewport-lab` frame, `selector-lab` highlighter, `sr-preview`/`a11y-tree` (built on the browser accessibility tree computed in the sandbox).
- Cheat sheets: **HTML** and **CSS** complete.
- Exit: both tracks complete on the map; boss lessons playable; cheat sheets cross-linked; manual screen-reader pass of 5 sampled lessons.

## Phase 3 · JavaScript

- **60 lessons** (J1–J13).
- Key visualizers: `event-loop`, `memory-diagram`, `closure-backpack`, `pipeline-viz` (reused by LINQ), `async-timeline` (reused by C# tasks), `test-runner`, `network-panel` (mocked fetch inside the sandbox).
- `verify: browser` used for DOM, timers and event-loop samples.
- Cheat sheet: **JavaScript** complete.
- Exit: track complete; event-loop predictions verified in Chromium; all live-code lessons pass build checks.

## Phase 4 · Algorithms and Data Structures

- **40 lessons** (A1–A10, excluding the reference lesson).
- Flagship: `sort-race` (side-by-side algorithms, size and speed controls, step mode, comparison/swap counters, live Big O), then `tree-lab`, `graph-lab`, `heap-lab`, `hash-buckets`, `dp-table`, `call-tree`.
- All algorithm code in JS and C# tabs, both verified.
- Cheat sheet: **Algorithms** (Big O table for structures × operations, sorting comparison, technique picker).
- Exit: every trace challenge cross-checked against its model; race stays at 60 fps with 1,000 bars on a mid-range laptop and degrades gracefully on phones.

## Phase 5 · C\#

- **52 lessons** (S1–S11), taught with visualizers and non-executing challenges.
- Key visualizers: `compiler-sim` (diagnostics are captured from real `dotnet build` output at content-build time, not invented), `memory-diagram` (value/reference mode), `linq-pipeline`, `async-state-machine`, `thread-interleave`, `pattern-matcher`.
- Cheat sheet: **C#** complete (C# 14 / .NET 10).
- Exit: every C# claim verified with the .NET 10 SDK; all compiler messages shown to learners come from the real compiler.

## Phase 6 · .NET (ASP.NET Core, EF Core)

- **43 lessons** (N1–N10), all through simulators.
- Key simulators: `middleware-pipeline`, `di-lifetimes`, `ef-tracker`, `sql-mirror` (SQL captured from real EF Core logging against SQLite at content-build time), `http-inspector`, `config-layers`, `cors-sim`, `cache-sim`.
- `verify: dotnet-build` for endpoint and configuration samples (`#:sdk Microsoft.NET.Sdk.Web`, `#:package` for EF Core and OpenAPI).
- Cheat sheet: **.NET** complete.
- Exit: track complete; simulator behavior matches documented framework behavior (each simulator has a "source of truth" note with links in its folder README).

## Phase 7 (optional) · Real in-browser C# runner

- Spike first (time-boxed): Roslyn in a .NET WebAssembly app in a Web Worker; measure download size, cold-start compile time and memory on a mid-range phone. Go/no-go based on numbers.
- If go: `dotnet-wasm` runner, `cs-live-code` challenge type, C# assertion mini-library, "Run it" on C# predict-output challenges, service-worker caching, terminal-style download progress.
- Retrofit: add `cs-live-code` challenges to ~20 C# lessons where writing code is the point (methods, classes, LINQ, pattern matching...).
- Exit: no engine files changed outside `runners/dotnet-wasm` and `challenges/types/cs-live-code` (proves the plugin design).

## Phase 8 · Polish, audit and launch

- **Audits:** full WCAG 2.2 AA audit (automated + manual NVDA/VoiceOver), performance (Lighthouse, bundle review, low-end Android test), content accuracy re-run of all snippets on the current .NET LTS / Node LTS, link check, copy edit for tone and brevity.
- **Polish:** PWA/offline (service worker), map transitions, achievement set, onboarding (choose "new to programming" vs "experienced" → suggests Free roam), empty/error states, 404 page.
- **Launch:** final app name (change `APP_NAME` only), custom domain, social preview images, privacy note (no tracking, data stays in the browser).
- Exit: release checklist complete; v1.0 tagged.

---

## Ongoing maintenance

- Each November (new .NET release): review C#/.NET content against the new LTS/STS and decide whether to move. Stay on the latest **LTS** by default (.NET 10 now; .NET 11 is an STS release).
- Twice a year: refresh Baseline statuses for HTML/CSS/JS features and update "newly available" labels.
