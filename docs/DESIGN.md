# Design

**Direction:** dark neon with a Matrix/cyberpunk edge. The edge lives in the **frame** (landing, map, transitions, rewards). The **reading and working surfaces** (concept cards, code, challenges, cheat sheets) are calm, high-contrast and still. When an effect and content compete, content wins.

All colors, sizes and timings below are tokens in `src/styles/tokens.css`. Components never use raw values.

## 1. Color tokens

Contrast ratios were computed with the WCAG 2.x formula against each background. Minimums: 4.5:1 for text, 3:1 for large text, UI component boundaries and focus indicators.

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#07090d` | App background, landing, map canvas |
| `--bg-1` | `#0d1117` | Reading surface (lesson column, cheat sheets) |
| `--bg-2` | `#141a23` | Raised: cards, panels, playground frame |
| `--bg-3` | `#1c2430` | Hover/selected rows, code block background |
| `--border` | `#2a3546` | Decorative dividers only (1.5:1, not for component boundaries) |
| `--border-strong` | `#5d6e87` | Input, button and card boundaries that convey function (≥ 3.0:1 on all surfaces) |

### Text

| Token | Value | Contrast (bg-0 / bg-1 / bg-2 / bg-3) | Use |
|---|---|---|---|
| `--text-1` | `#e6edf3` | 16.9 / 16.0 / 14.8 / 13.2 | Body and headings |
| `--text-2` | `#aab4c3` | 9.5 / 9.0 / 8.3 / 7.5 | Secondary text, captions |
| `--text-3` | `#8592a5` | 6.3 / 6.0 / 5.5 / 5.0 | Metadata, placeholders, disabled labels |

Body text is never pure white on pure black (halation); `--text-1` on `--bg-1` is the reading pair.

### Neon accents

| Token | Value | Contrast on bg-1 | Meaning |
|---|---|---|---|
| `--neon-cyan` | `#22d3ee` | 10.5 | Primary interactive (links, primary buttons, focus ring) |
| `--neon-green` | `#39ff88` | 14.3 | Success, completed, the "matrix" color |
| `--neon-magenta` | `#ff5ad9` | 7.0 | XP, level, rewards |
| `--neon-amber` | `#ffb547` | 10.8 | Warnings, streak flame, hints |
| `--neon-red` | `#ff6b81` | 6.9 | Errors, failed tests, "common mistake" |
| `--neon-violet` | `#b69cff` | 8.3 | Info, "in production" callouts |

Text on a filled neon button uses `--bg-0` (11.0:1 on cyan, 15.0:1 on green).

### Track colors

| Token | Value | Contrast on bg-1 |
|---|---|---|
| `--track-html` | `#ff8a4c` | 8.1 |
| `--track-css` | `#4cc2ff` | 9.4 |
| `--track-js` | `#f7df1e` | 14.0 |
| `--track-algo` | `#39ff88` | 14.3 |
| `--track-cs` | `#c58cff` | 7.7 |
| `--track-net` | `#8f9bff` | 7.5 |

Rules:
- Color never carries meaning alone: states also have an icon and a text label (completed ✓, locked 🔒 icon + "Locked", failed ✕ + message).
- Glow (`--glow-*`: `0 0 12px color-mix(in oklch, <accent> 45%, transparent)`) is reserved for interactive focus/active states, completed nodes and reward moments. Never on body text.
- Syntax highlighting uses a custom Shiki theme built from these tokens; every token color is ≥ 4.5:1 on `--bg-3`.
- **Print** uses its own palette: `#111` on white, `#555` for secondary text (7.5:1), no backgrounds, no glow.

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| Reading and UI | **Inter** (variable) | Highly legible at small sizes; tabular numbers for counters (`font-variant-numeric: tabular-nums`). |
| Display | **Space Grotesk** | Headings on landing, map, level-up, track titles. Never for paragraphs. |
| Code and terminal | **JetBrains Mono** | Code, editors, terminal loader, counters in visualizers. Ligatures off by default (learners must see `!==` as typed). |

All self-hosted (Fontsource), Latin subset, `font-display: swap` with metric-matched fallbacks to avoid layout shift.

Type scale (1.25 ratio, `rem` based, respects user font-size settings):

| Token | Size | Line height | Use |
|---|---|---|---|
| `--fs-xs` | 0.8rem | 1.4 | Badges, tags |
| `--fs-sm` | 0.9rem | 1.5 | Captions, metadata |
| `--fs-base` | 1.0625rem (17 px) | 1.65 | Lesson body |
| `--fs-md` | 1.25rem | 1.4 | Card titles |
| `--fs-lg` | 1.563rem | 1.3 | Section headings |
| `--fs-xl` | 1.953rem | 1.2 | Lesson title |
| `--fs-2xl` | clamp(2.2rem, 5vw, 3.8rem) | 1.05 | Landing hero |

Reading measure: max `68ch` for prose. Code blocks: `0.9375rem`, line-height 1.6, horizontal scroll inside the block (never wrapping that changes meaning), with a visible scroll affordance.

## 3. Spacing, radius, layout

- **Spacing** (4 px base): `--space-1` 4, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-5` 24, `--space-6` 32, `--space-7` 48, `--space-8` 64, `--space-9` 96.
- **Radius:** `--radius-sm` 4 (inputs, badges), `--radius-md` 8 (buttons, code), `--radius-lg` 12 (cards, panels), `--radius-pill` 999.
- **Breakpoints** (min-width): `sm` 480, `md` 768, `lg` 1024, `xl` 1280. Components prefer **container queries**; breakpoints are for page layout.
- **Lesson layout:** a single reading column (68ch) for text sections; the playground and challenges break out to `min(100%, 1200px)`. A sticky section rail (Concept · Playground · Challenges · In production · Mistake · Recap) on `lg+`; a top progress bar on smaller screens.
- **Touch targets** ≥ 44×44 px. Side gutters 16 px on phones; no horizontal page scroll at 320 px.

## 4. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80 ms | Press feedback |
| `--dur-fast` | 150 ms | Hover, focus, toggles |
| `--dur-base` | 250 ms | Panels, tabs, toasts |
| `--dur-slow` | 400 ms | Route transitions, map zoom |
| `--dur-reward` | 600 ms | Level-up, completion |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Entering |
| `--ease-in-out` | `cubic-bezier(0.6, 0, 0.4, 1)` | Moving |

Rules:
1. Motion explains change (an element moving, a value updating), never decorates reading surfaces.
2. **One setting decides:** `effects = system | full | reduced | off` (profile settings; `system` follows `prefers-reduced-motion`).
   - `reduced`: no ambient animation, no glitch, no parallax; transitions become ≤ 150 ms fades; visualizers switch frames instantly and never autoplay.
   - `off`: like reduced, plus no fades and a static landing hero.
3. Nothing flashes more than 3 times per second (WCAG 2.3.1). The glitch effect uses offset/clip, not luminance strobing, and runs at most once per trigger.
4. Ambient effects pause when the tab is hidden (`visibilitychange`) and when off-screen (`IntersectionObserver`), and cap at 30 fps.
5. Every autoplaying animation longer than 5 s has a pause control (WCAG 2.2.2).

## 5. Where effects appear and where they must not

| Effect | Allowed | Details |
|---|---|---|
| **Digital rain** (canvas) | Landing hero only | Glyphs drawn from code tokens (`{}`, `=>`, `<div>`, `async`, `0x1F`) in `--neon-green` at low opacity behind a dark gradient scrim so the headline keeps ≥ 7:1. Static frame in reduced/off mode. |
| **Terminal loader** | Route/lesson/runner loading states | `> loading lesson algo.binary-search…` typed line + blinking block cursor; `role="status"` with the plain text. Real progress for the .NET runtime download. Shown only after 300 ms (no flash for fast loads). |
| **Glitch** | Level-up overlay title, 404 page, boss node unlock | ≤ 600 ms, once. Replaced by a fade in reduced mode. |
| **Neon glow** | Focus rings, available map nodes (subtle), completed nodes, XP bar, primary buttons on hover | Never on paragraphs or code. |
| **Scanlines / grid** | Map background only (static, ≤ 4% opacity) | Never over text. |
| **Node completion pulse** | Map, once when a node becomes completed/unlocked | Single ring expanding, 600 ms. |
| **Particles/confetti** | None | Off-brand and noisy. |

**Never** in: concept cards, code blocks, editors, challenge areas while answering, feedback messages, error states, forms and settings, cheat sheets (screen and print), recap lists, anything a screen reader user must hear first. No animated backgrounds behind text anywhere.

## 6. Component inventory

**Shell and navigation**
- `AppShell` (skip link, top bar, main landmark), `TopBar` (logo, map, cheat sheets, XP bar, level, streak, profile)
- `XpBar`, `LevelBadge`, `StreakCounter`
- `LevelUpOverlay` (focus-trapped dialog, glitch title, dismiss with Esc), `ToastRegion` (`aria-live="polite"`)

**Map**
- `SkillMap` (pan/zoom canvas with SVG edges + HTML node layer), `TrackLane`, `ModuleNode`, `LessonNode` (states: planned, locked, available, in-progress, completed, boss variant), `Edge` (hard solid, related dashed), `MapLegend`, `MapListView`, `ZoomControls`, `LessonPreviewCard` (title, minutes, objective, prerequisites, Start button)

**Lesson**
- `LessonPlayer`, `SectionRail`, `ConceptCard`, `PlaygroundFrame` (title, prompt, reset, fullscreen, compact-mode switch), `ChallengeShell` (prompt, attempts, hint drawer, reveal, submit, feedback), `HintDrawer`, `FeedbackPanel` (pass/fail with specific details), `ProductionCallout`, `MistakeCallout` (bad/fix side by side, stacked on mobile), `RecapList`, `LessonCompleteCard` (XP earned, next lesson)

**Challenge views:** `PredictOutput`, `FillBlank`, `FindBug`, `Reorder`, `LiveCode`, `VisualMatch` (with ghost overlay slider), `Trace`, `Choice`

**Visualizer primitives**
- `StepPlayer` (play/pause, step back/forward, scrub, speed, keyboard shortcuts), `MetricCounter` (comparisons, swaps, checks), `ComplexityTag` (live Big O label), `ArrayBars`, `PointerMarker` (lo/mid/hi), `TreeView`, `GraphView`, `QueueLanes`, `Timeline`, `MemoryDiagram`, `BucketSorter`

**Code**
- `CodeBlock` (pre-highlighted, copy button, language tabs, optional output panel), `CodeEditor` (CodeMirror; lazy), `ConsolePanel`, `TestResults`

**Cheat sheets**
- `SheetIndex`, `SheetSection`, `SheetEntry` (title, code, explanation, usage badge, copy, Learn link), `UsageBadge` (daily / common / rare, text + shape, not color only), `SearchBox` (`/` shortcut), `FilterChips`, `BigOTable`

**Primitives**
- `Button` (primary, secondary, ghost, danger), `IconButton` (always with an accessible name), `Slider`, `Toggle`, `SegmentedControl`, `Tabs`, `Tooltip` (also on focus), `Dialog`, `Badge`, `ProgressRing`, `Kbd`, `EmptyState`, `ErrorScreen`, `TerminalLoader`, `DigitalRain`, `Glitch`

## 7. Screen notes

- **Landing:** full-bleed digital rain, one headline, one sentence, "Start learning" (→ map) and "Cheat sheets". Below the fold: three short looping demos (sorting race, flexbox sandbox, event loop) that are paused until scrolled into view, and static in reduced mode.
- **Map:** opens zoomed to the learner's current frontier (first available node). Overview shows tracks as colored lanes; module nodes show completion rings.
- **Lesson:** title, track chip, minutes, then the six sections. No effects. Completing the last challenge shows `LessonCompleteCard` inline; the level-up overlay appears only on an actual level change.
- **Cheat sheets:** dense, two columns on `lg+`, sticky search and filters, track tabs. Print view: single column, black on white, usage tag in words.
- **Profile:** stats, activity calendar (last 12 weeks), settings (effects, free roam, code tab, editor font size), export/import with a clear summary before applying.

## 8. Accessibility checklist (every screen)

- WCAG 2.2 AA: contrast as above, focus visible (2 px `--neon-cyan` outline + 2 px offset, ≥ 3:1), target size, no keyboard traps.
- Every interactive visualizer is operable by keyboard and exposes its current state as text (e.g. "Step 3 of 7: checking index 5, value 23. lo 5, hi 6.") in a polite live region, rate-limited during playback.
- Drag-and-drop always has a keyboard alternative (dnd-kit sensors) and a non-drag fallback (move up/down buttons).
- Forms: visible labels, errors tied with `aria-describedby`, never placeholder-only.
- Respect zoom to 200% and text spacing overrides without loss of content.
