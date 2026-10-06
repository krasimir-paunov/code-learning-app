# Curriculum

The full program, in teaching order. This file is the human-readable plan; from Phase 1 on, `content/curriculum.yaml` is the machine source of truth for the skill tree, and `npm run content:check` fails if the two disagree on lesson ids.

Targets: **modern C# 14 on .NET 10 (current LTS)**, **JavaScript ES2023+**, **modern CSS** (Grid, Flexbox, custom properties, container queries), **semantic, accessible HTML**. Web-platform features are labelled with their [Baseline](https://web.dev/baseline) status when it matters.

## Legend

**Lesson code** (`H2.3`) is for this document only. The **id** (`html.lists`) is permanent: it keys progress in localStorage, so it never changes once shipped.

**Tier:**
- **Core**: needed to be job-ready. Built first (Pass 1, see ROADMAP); the app can ship with Core lessons only.
- **Ext** (Extended): depth, specialist or "know it exists" topics. Built in Pass 2. Shown on the map from day one as "coming soon" until published.
- Rule: a Core lesson never requires an Extended lesson, so the Core path is never blocked by unbuilt content. Boss lessons only test Core material.

**Req** (prerequisites):
- `↑` = the previous lesson in the same module. For a **Core** lesson, `↑` skips Extended lessons and means the previous Core lesson; for an **Extended** lesson it means the previous lesson of either tier.
- A module's first (Core) lesson requires the module's **Entry** prerequisites (in the module heading); `—` in its row means "Entry only". Entries always point at Core lessons.
- Extra codes in the column are additional hard prerequisites (often cross-track).
- `rec X` = **recommended**, not required: the lesson is open, but shows a "Recommended path" banner linking to X with a one-click skip (see ARCHITECTURE §5). Used where the C# track builds on JavaScript and Algorithms lessons.
- Soft "related" links (dashed on the map, never blocking) are defined in content, not listed here.

**Challenge types** (Ch):

| Code | Type | Auto-check |
|---|---|---|
| PO | predict-output | normalized text compare (or pick from options) |
| FB | fill-blank | per-blank accepted answers |
| BUG | find-bug | select the faulty line(s), then pick/enter the fix |
| RO | reorder | drag/keyboard reorder code lines or steps |
| LC | live-code | run in sandboxed iframe against tests (HTML/CSS/JS) |
| VM | visual-match | compare layout boxes + computed styles to a target (CSS) |
| TR | trace | perform the algorithm by hand (click the next probe/swap/node) |
| CH | choice | single/multi choice; used sparingly, mostly for classification ("which Big O?") |

C# and .NET have no LC until Phase 7 adds the in-browser C# runner (`cs-live-code`).

**Boss** lessons (one per track) are 10-minute mixed gauntlets worth bonus XP.

---

## Track order and interleaving

The map shows every track from day one; hard prerequisites keep the order honest inside the web tracks, and recommendations guide (without locking) the move into C#. The recommended path, Core lessons first:

| Stage | Do | Why here |
|---|---|---|
| 1 | H1–H3 → C1–C3 → H4–H5 → C4–C5 | You can build a real, semantic, styled page within the first hours. HTML and CSS alternate so each new tag has something to style and each CSS feature has meaningful markup. |
| 2 | J1–J5 (in parallel with H6, C6–C7) | Programming fundamentals are taught **once**, in JavaScript: it runs in the browser, so every lesson can be live-coded with instant feedback. |
| 3 | A1–A3 | Algorithms start as soon as you have loops, functions and arrays (J4). Complexity thinking early makes every later data-structure choice (JS `Map`, C# `Dictionary`, EF queries) meaningful instead of memorized. |
| 4 | J6–J9, C8–C9, A4–A6 | DOM, async, classes; recursion and hashing. |
| 5 | S1–S5 | **C# comes after JS fundamentals and A1.** C# lessons skip "what is a loop" and focus on what is new: static types, compilation, value vs reference types, OOP. `List<T>`/`Dictionary` lessons build on the dynamic-array and hash-table lessons. |
| 6 | S6–S11 with A7–A10, J10–J13 | LINQ (after JS array methods), async, modern C#. Trees/graphs/DP run in parallel; algorithm code samples have JS **and** C# tabs. |
| 7 | N1–N10 | .NET needs interfaces (DI), async (every endpoint), LINQ (EF Core). Everything is taught through simulators. |
| 8 | J14 | TypeScript essentials: most professional front-end code is TypeScript. Core, but built after Phase 6 (before the v1.0 release gate) because it is easiest once JavaScript is solid. |

Hard cross-track gates (also listed in the tables):
- CSS starts after `html.what-is-html`; JS starts after `html.document-skeleton`.
- DOM (J6) requires CSS selectors (C1.2): `querySelector` *is* CSS selectors.
- `js.forms` requires `html.validation`; the CSS boss requires the HTML boss.
- Algorithms (A1) requires `js.loops`, `js.functions`, `js.arrays`.
- .NET (N1) requires `cs.interfaces` and `cs.tasks-async-await`; N5 requires `cs.exceptions`; EF Core (N6) requires `cs.linq-deferred`.

Recommended (soft) cross-track gates, shown as a "Recommended path" banner with a one-click skip:
- C# (S1) recommends JS fundamentals through J4 (`js.objects`): the C# track assumes you can already program.
- `cs.value-vs-reference` recommends `js.references`; `cs.linq-basics` recommends `js.array-iteration`.
- C# collections (S5) recommend `algo.big-o`; `cs.list` recommends `algo.amortized`; `cs.dictionary-hashset` recommends `algo.hash-tables`.

**Free roam** (a global setting) opens every published lesson regardless of gates.

### Totals

| Track | Modules | Core lessons (min) | Extended lessons (min) | All lessons | All minutes |
|---|---|---|---|---|---|
| HTML | 8 | 21 (121) | 6 (33) | 27 | 154 |
| CSS | 10 | 30 (190) | 13 (71) | 43 | 261 |
| JavaScript (incl. TypeScript J14, 6 Core) | 14 | 54 (349) | 12 (74) | 66 | 423 |
| Algorithms & Data Structures | 10 | 27 (193) | 15 (109) | 42 | 302 |
| C# | 11 | 42 (285) | 10 (56) | 52 | 341 |
| .NET (ASP.NET Core, EF Core) | 10 | 33 (236) | 10 (60) | 43 | 296 |
| **Total** | **63** | **207 (1,374 ≈ 23 h)** | **66 (403 ≈ 6.7 h)** | **273** | **1,777 ≈ 29.6 h** |

---

## HTML

**Ordering rationale:** structure before decoration and semantics from the first tag, so learners never form "div soup" habits. Forms and accessibility come after the learner has enough markup to make them meaningful; head/loading comes last because it only matters once you have a real page. Tables are kept to one lesson (data tables only; table layouts are legacy).

### H1 · How the web works — Entry: none

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H1.1 | `html.what-is-html` | Elements, tags, attributes | Core | Read and write an element; know tag vs element vs attribute. | — | `anatomy-explorer` (hover parts of `<a href>`), `live-editor` | FB, BUG | 4 | done |
| H1.2 | `html.document-skeleton` | The document skeleton | Core | Know what each line of the boilerplate does (`doctype`, `lang`, `charset`, `viewport`, `title`). | ↑ | `skeleton-toggles`: switch lines off, watch the phone preview/tab title/encoding break | RO, BUG | 5 | done |
| H1.3 | `html.browser-pipeline` | From URL to pixels | Core | Follow URL → request → parse → DOM → render; see how browsers repair bad nesting. | ↑ | `dom-tree`: type HTML, the DOM tree updates live | PO, CH | 6 | done |
| H1.4 | `html.devtools-elements` | Inspecting with DevTools | Core | Use the Elements panel to inspect and live-edit any page. | ↑ | `devtools-sim` | CH, BUG | 4 | done |

### H2 · Text and structure — Entry: H1.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H2.1 | `html.headings-paragraphs` | Headings and the outline | Core | Build a logical heading hierarchy (one `h1`, no skipped levels). | — | `outline-view` (screen-reader headings list beside the editor) | BUG, RO | 5 | done |
| H2.2 | `html.text-semantics` | Meaningful inline text | Core | Choose `strong`/`em`/`code`/`time`/`abbr`/`mark` by meaning, not looks. | ↑ | `sr-preview` (what a screen reader announces) | FB, CH | 5 | todo |
| H2.3 | `html.lists` | Lists | Core | Use `ul`, `ol`, `dl` and nesting correctly (menus are lists). | ↑ | `live-editor` | LC | 4 | todo |
| H2.4 | `html.landmarks` | Page landmarks | Core | Structure a page with `header`/`nav`/`main`/`aside`/`footer`/`section`/`article`. | ↑ | `landmark-map`: drag semantic tags onto regions of a page mockup | CH, LC | 7 | todo |
| H2.5 | `html.div-span` | When `div` and `span` are right | Ext | Use non-semantic containers only for styling/grouping hooks. | ↑ | `sr-preview` | BUG | 4 | todo |

### H3 · Links, images and media — Entry: H2.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H3.1 | `html.links` | Links | Core | Write links (absolute, fragment, `mailto:`, `download`); know `target="_blank"` now implies `noopener`. | — | `live-editor` | FB, BUG | 5 | todo |
| H3.2 | `html.urls-paths` | URLs and relative paths | Core | Resolve relative URLs (`./`, `../`, `/`) against a base. | ↑ | `url-resolver`: file tree + base URL + href → resolved URL | PO | 6 | todo |
| H3.3 | `html.images` | Images | Core | Use `alt` correctly (incl. empty alt) and `width`/`height` to prevent layout shift; `loading="lazy"`. | ↑ | `image-lab`: images-off toggle, layout-shift replay | BUG, LC | 6 | todo |
| H3.4 | `html.responsive-images` | Responsive images | Ext | Use `srcset`/`sizes` and `picture`; predict which file the browser downloads. | ↑ | `srcset-picker`: viewport + DPR sliders highlight the chosen candidate | PO | 7 | todo |
| H3.5 | `html.media-embeds` | Video, audio, iframes | Ext | Embed media with controls and captions (`track`); give iframes a `title`. | ↑ | `live-editor` | FB | 5 | todo |

### H4 · Tables — Entry: H3.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H4.1 | `html.tables` | Data tables | Core | Build accessible tables (`caption`, `thead`, `th scope`); never tables for layout. | — | `table-builder` + `sr-preview` of cell announcements | LC, BUG | 6 | todo |

### H5 · Forms — Entry: H4.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H5.1 | `html.form-basics` | How forms submit | Core | Connect `label`↔`input`, `name`, `action`, `method`; see GET vs POST payloads. | — | `form-inspector`: submit shows the request (query string vs body) | PO, BUG | 7 | todo |
| H5.2 | `html.input-types` | Input types | Core | Pick the right `type` (email, number, date, checkbox, radio, range...) and `autocomplete`. | ↑ | `input-gallery` with mobile-keyboard preview | CH, LC | 6 | todo |
| H5.3 | `html.select-textarea-fieldset` | Selects, textareas, groups | Core | Group related controls with `fieldset`/`legend`; build radio groups. | ↑ | `live-editor` + `sr-preview` | LC | 5 | todo |
| H5.4 | `html.buttons` | Buttons vs links | Core | A button acts, a link navigates; `type` defaults to `submit` inside forms. | ↑ | `form-inspector` | BUG, CH | 4 | todo |
| H5.5 | `html.validation` | Built-in validation | Core | Use `required`, `pattern`, `min`/`max`, `minlength` and the `:user-invalid` state. | ↑ | `validation-lab` | FB, LC | 6 | todo |

### H6 · Accessibility essentials — Entry: H5.5

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H6.1 | `html.a11y-tree` | The accessibility tree | Ext | Every control has a name, role and state; see how HTML maps to them. | — | `a11y-tree`: DOM and accessibility tree side by side | PO | 6 | todo |
| H6.2 | `html.keyboard-focus` | Keyboard and focus | Core | Keep a logical tab order; `tabindex` 0 and -1 only, never positive. | ↑ | `focus-path`: numbered tab path drawn over the page | BUG | 6 | todo |
| H6.3 | `html.aria-basics` | ARIA, carefully | Core | First rule of ARIA; `aria-label(ledby)`, `aria-describedby`, `aria-expanded`, `aria-live`. | ↑ | `a11y-tree` + `sr-preview` | BUG, FB | 7 | todo |
| H6.4 | `html.native-widgets` | Native interactive elements | Ext | Use `dialog`, `details`/`summary` and the `popover` attribute instead of custom JS widgets. | ↑ | `live-editor` | LC | 6 | todo |

### H7 · Head, metadata and loading — Entry: H6.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H7.1 | `html.meta-seo` | Metadata and sharing | Ext | Write `title`, description, canonical and Open Graph tags. | — | `share-preview`: search result + social card update live | FB | 5 | todo |
| H7.2 | `html.loading-resources` | Loading CSS and scripts | Core | Predict render blocking; use `defer`, `async`, `type="module"`, `preload`. | ↑ | `load-waterfall`: parser timeline with blocking resources | PO, CH | 7 | todo |

### H8 · Boss — Entry: H7.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| H8.1 | `html.boss` | Boss: accessible sign-up page | Core | Build a semantic, keyboard-usable, validated form page from a spec. | — | `live-editor` + automated a11y checks | LC, BUG | 10 | todo |

---

## CSS

**Ordering rationale:** the cascade and box model first, because every later "CSS is broken" moment is one of those two. Then visual basics with custom properties early (they are how real codebases theme). Layout follows the professional default: Flexbox for 1-D, Grid for 2-D, positioning only for overlays. Responsive design comes after layout because modern responsive design is mostly intrinsic layout plus container queries. Architecture last, once the learner has felt the pain it solves.

### C1 · Selectors and the cascade — Entry: H1.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C1.1 | `css.rules` | Rules and declarations | Core | Write a rule; link a stylesheet; know selector, property, value. | — | `selector-lab`: matched elements glow as you type | LC | 5 | todo |
| C1.2 | `css.selectors` | Selectors and combinators | Core | Target by class, attribute, descendant, child and sibling. | ↑ | `selector-lab` | PO, LC | 6 | todo |
| C1.3 | `css.pseudo-classes` | Pseudo-classes and elements | Core | Use `:hover`, `:focus-visible`, `:nth-child`, `:not`, `::before`/`::after`. | ↑ | `selector-lab` with state toggles | PO, FB | 7 | todo |
| C1.4 | `css.specificity` | Specificity | Core | Predict which rule wins; why `!important` and IDs cause wars. | ↑ | `specificity-duel`: two rules fight, scores shown as (a,b,c) | PO | 7 | todo |
| C1.5 | `css.inheritance` | Inheritance and defaults | Core | Know which properties inherit; `inherit`, `initial`, `unset`, `revert`. | ↑ | `cascade-trace`: computed value with its origin chain | PO | 5 | todo |
| C1.6 | `css.cascade-layers` | Cascade layers | Ext | Order whole stylesheets with `@layer` (resets, libraries, components, utilities). | ↑ | `specificity-duel` (layer mode) | PO | 6 | todo |

### C2 · Box model and units — Entry: C1.5

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C2.1 | `css.box-model` | The box model | Core | See content, padding, border, margin; size an element precisely. | — | `box-inspector` | VM, FB, RO, CH | 8 | done |
| C2.2 | `css.box-sizing` | `box-sizing` | Core | Why every reset uses `border-box`. | ↑ | `box-inspector` (toggle) | PO | 4 | todo |
| C2.3 | `css.margin-collapse` | Margin collapsing | Ext | Predict collapsed vertical margins and how flex/grid avoid it. | ↑ | `box-inspector` (two blocks) | PO | 5 | todo |
| C2.4 | `css.units` | Units | Core | Choose `rem`, `em`, `%`, `px`, `ch`, `vw`/`dvh` deliberately. | ↑ | `unit-lab`: root font-size and viewport sliders | PO | 7 | todo |
| C2.5 | `css.display` | `display` | Core | Block vs inline vs inline-block; `display: none` vs `visibility: hidden`. | ↑ | `live-editor` | PO, VM | 5 | todo |
| C2.6 | `css.overflow` | Overflow | Core | Control overflow; truncate text with an ellipsis. | ↑ | `live-editor` | VM | 4 | todo |

### C3 · Color, type and surfaces — Entry: C2.6

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C3.1 | `css.colors` | Color | Core | Use hex, `rgb()`, `hsl()`, `oklch()` and `color-mix()`; check contrast. | — | `color-lab` with live contrast ratio | VM, CH | 6 | todo |
| C3.2 | `css.custom-properties` | Custom properties | Core | Build a theme with variables, fallbacks and scoping. | ↑ | `theme-switcher` sandbox | LC | 7 | todo |
| C3.3 | `css.typography` | Typography | Core | Font stacks, web fonts, `line-height`, fluid sizes with `clamp()`. | ↑ | `type-lab` | VM | 7 | todo |
| C3.4 | `css.surfaces` | Backgrounds, borders, shadows | Core | Style surfaces with gradients, `border-radius`, `box-shadow`. | ↑ | `live-editor` | VM | 6 | todo |

### C4 · Flexbox — Entry: C3.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C4.1 | `css.flex-axes` | Flex axes | Core | Main vs cross axis; `flex-direction` flips them. | — | `flex-sandbox` | VM | 6 | todo |
| C4.2 | `css.flex-alignment` | Aligning with Flexbox | Core | `justify-content`, `align-items`, `gap`, auto margins. | ↑ | `flex-sandbox` | VM, FB | 6 | todo |
| C4.3 | `css.flex-sizing` | Flex sizing | Core | How `flex-grow`/`shrink`/`basis` split space; the `min-width: 0` fix. | ↑ | `flex-math`: free space distribution shown as numbers | PO, BUG | 8 | todo |
| C4.4 | `css.flex-wrap-patterns` | Wrapping and patterns | Core | `flex-wrap`; build a nav bar, media object and card row. | ↑ | `flex-sandbox` | VM | 6 | todo |

### C5 · Grid — Entry: C4.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C5.1 | `css.grid-basics` | Grid basics | Core | Tracks, `fr`, `gap`. | — | `grid-sandbox` with line-number overlay | VM | 6 | todo |
| C5.2 | `css.grid-placement` | Placing items | Core | Place items by line numbers and `span`. | ↑ | `grid-sandbox` | VM, PO | 7 | todo |
| C5.3 | `css.grid-areas` | Template areas | Core | Lay out a page with `grid-template-areas`. | ↑ | `grid-sandbox` | VM | 6 | todo |
| C5.4 | `css.grid-auto` | Intrinsic grids | Core | `repeat(auto-fit, minmax())`, implicit tracks, `grid-auto-flow`. | ↑ | `grid-sandbox` + resizable container | VM | 7 | todo |
| C5.5 | `css.grid-vs-flex` | Grid or Flexbox? | Core | Decide by dimension and content-vs-layout direction. | ↑ | `layout-chooser` (same UI in both, toggle) | CH | 5 | todo |
| C5.6 | `css.subgrid` | Subgrid | Ext | Align nested content (card rows) to a parent grid. | ↑ | `grid-sandbox` | VM | 5 | todo |

### C6 · Positioning and stacking — Entry: C5.5

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C6.1 | `css.position` | Positioning | Core | `relative`, `absolute`, `fixed`, `sticky`; find the containing block. | — | `position-lab` highlights the containing block | PO, VM | 8 | todo |
| C6.2 | `css.stacking` | z-index and stacking contexts | Core | Why `z-index: 9999` doesn't work: stacking contexts. | ↑ | `stack-3d`: exploded 3-D view of layers | PO, BUG | 7 | todo |
| C6.3 | `css.transforms` | Transforms | Ext | `translate`, `rotate`, `scale` (individual properties) without affecting layout. | ↑ | `live-editor` | VM | 5 | todo |

### C7 · Responsive design — Entry: C6.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C7.1 | `css.media-queries` | Media queries | Core | Mobile-first breakpoints with `min-width` and range syntax. | — | `viewport-lab`: drag the viewport edge | VM | 6 | todo |
| C7.2 | `css.container-queries` | Container queries | Ext | Components that adapt to their container, not the viewport (`@container`, `cqi`). | ↑ | `viewport-lab` (container mode) | VM | 7 | todo |
| C7.3 | `css.intrinsic-layout` | Responsive without breakpoints | Ext | `min()`, `max()`, `clamp()` and intrinsic sizing. | ↑ | `viewport-lab` | VM | 6 | todo |
| C7.4 | `css.user-preferences` | User preferences | Ext | Respect `prefers-color-scheme` and `prefers-reduced-motion`. | ↑ | `pref-emulator` | LC | 5 | todo |

### C8 · Motion — Entry: C7.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C8.1 | `css.transitions` | Transitions | Core | Transition properties with good durations and easing. | — | `easing-editor` | VM, FB | 6 | todo |
| C8.2 | `css.keyframes` | Keyframe animations | Ext | `@keyframes` and animation properties. | ↑ | `timeline-scrubber` | VM | 6 | todo |
| C8.3 | `css.render-performance` | Smooth animation | Ext | Animate `transform`/`opacity`; see layout → paint → composite costs. | ↑ | `render-pipeline` meter | CH, BUG | 6 | todo |

### C9 · Modern CSS in teams — Entry: C8.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C9.1 | `css.nesting` | Native nesting | Ext | Nest rules with `&` without a preprocessor. | — | `live-editor` | FB, PO | 5 | todo |
| C9.2 | `css.modern-selectors` | `:is()`, `:where()`, `:has()` | Ext | Group selectors with controlled specificity; style parents with `:has()`. | ↑ | `selector-lab` | PO, LC | 6 | todo |
| C9.3 | `css.logical-properties` | Logical properties | Ext | `margin-inline`, `padding-block`, `inset` for any writing direction. | ↑ | `live-editor` with RTL toggle | VM | 4 | todo |
| C9.4 | `css.accessible-styling` | Accessible styling | Core | Visible focus styles, contrast, visually-hidden text, no info by color alone. | ↑ | `a11y-audit` overlay | BUG | 6 | todo |
| C9.5 | `css.form-styling` | Styling form controls | Ext | `accent-color`, `appearance`, consistent controls without rebuilding them. | ↑ | `live-editor` | VM | 5 | todo |
| C9.6 | `css.architecture` | Organizing CSS | Core | BEM, utility-first (Tailwind), CSS Modules: trade-offs you will meet at work. | ↑ | `architecture-compare` (same component, three styles) | CH | 6 | todo |

### C10 · Boss — Entry: C9.6

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| C10.1 | `css.boss` | Boss: responsive landing page | Core | Match a design at three viewport widths, themed with custom properties. | H8.1 | `live-editor` + `visual-diff` | VM | 10 | todo |

---

## JavaScript

**Ordering rationale:** this is where programming fundamentals are taught for the whole app (C# builds on it). Values and control flow first, then functions and closures (the core of JS), then data (arrays/objects/references) because it feeds both the DOM and Algorithms. Errors come before async so `try/catch` is known when `await` arrives. The DOM comes after the language so learners don't confuse JS with browser APIs. Classes are later and lighter than in C#: modern JS codebases are mostly functions and modules. Testing, security and performance close the track because they are what separates hobby code from production code. A TypeScript module (J14, Core) follows the boss: most professional front-end code is TypeScript, and it is far easier to learn once JavaScript itself is solid.

### J1 · Values — Entry: H1.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J1.1 | `js.first-script` | Running JavaScript | Core | Run code in the page and the console; `console.log`. | — | `live-editor` with console | PO | 4 | todo |
| J1.2 | `js.variables` | `const` and `let` | Core | Default to `const`; `let` when reassigning; `var` only in legacy code. | ↑ | `variable-boxes` | PO, BUG | 5 | todo |
| J1.3 | `js.types` | Primitive types | Core | Know the 7 primitives and `typeof` (incl. `typeof null === "object"`). | ↑ | `type-sorter` | PO | 6 | todo |
| J1.4 | `js.numbers` | Numbers | Core | Floating point (`0.1 + 0.2`), `NaN`, `Math`, formatting, `BigInt` exists. | ↑ | `float-inspector` (binary representation) | PO | 6 | todo |
| J1.5 | `js.strings` | Strings | Core | Template literals, common methods, immutability. | ↑ | `live-editor` | PO, FB | 6 | todo |
| J1.6 | `js.equality-truthiness` | Equality and truthiness | Core | `===` always; truthy/falsy; `??` vs `\|\|`; optional chaining. | ↑ | `truthiness-sorter` | PO | 7 | todo |

### J2 · Control flow — Entry: J1.6

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J2.1 | `js.conditionals` | Conditions | Core | `if`/`else`, ternary, early returns. | — | `flow-tracer`: highlights the path taken | PO | 5 | todo |
| J2.2 | `js.switch` | `switch` | Core | Use `switch` and avoid accidental fall-through. | ↑ | `flow-tracer` | BUG | 4 | todo |
| J2.3 | `js.loops` | Loops | Core | `for`, `while`, `for...of`, `break`/`continue`; off-by-one errors. | ↑ | `loop-stepper` with variable watch | PO, BUG | 7 | todo |

### J3 · Functions — Entry: J2.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J3.1 | `js.functions` | Functions | Core | Declare, call, return; parameters vs arguments. | — | `function-machine` | PO, LC | 6 | todo |
| J3.2 | `js.arrow-functions` | Arrow functions | Core | Arrow syntax, implicit return, returning object literals. | ↑ | `live-editor` | FB, BUG | 5 | todo |
| J3.3 | `js.parameters` | Default and rest parameters | Core | Defaults, rest parameters, spreading arguments. | ↑ | `function-machine` | PO | 5 | todo |
| J3.4 | `js.scope` | Scope | Core | Block and lexical scope; shadowing. | ↑ | `scope-bubbles` | PO | 7 | todo |
| J3.5 | `js.hoisting-tdz` | Hoisting and the TDZ | Ext | Why functions are callable early and `let` throws before its line. | ↑ | `scope-bubbles` (creation vs execution phase) | PO | 5 | todo |
| J3.6 | `js.closures` | Closures | Core | Functions remember their scope; counters, factories, the loop-closure bug. | ↑ | `closure-backpack` | PO, BUG | 8 | todo |
| J3.7 | `js.higher-order-functions` | Functions as values | Core | Pass and return functions; callbacks. | ↑ | `function-machine` (pluggable) | LC | 6 | todo |

### J4 · Data: arrays and objects — Entry: J3.7

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J4.1 | `js.arrays` | Arrays | Core | Create, index, `length`, `push`/`pop`/`shift`/`unshift`, `at(-1)`. | — | `array-viz` | PO | 6 | todo |
| J4.2 | `js.array-iteration` | `map`, `filter`, `reduce` and friends | Core | Transform data with `map`/`filter`/`reduce`/`find`/`some`/`every`. | ↑ | `pipeline-viz` (items flow through stages) | PO, LC | 8 | todo |
| J4.3 | `js.array-copying-methods` | Sorting and copying | Core | Default `sort` compares strings; ES2023 `toSorted`/`toReversed`/`with`. | ↑ | `array-viz` (mutate vs copy) | PO, BUG | 6 | todo |
| J4.4 | `js.objects` | Objects | Core | Literals, dot vs bracket access, shorthand, computed keys. | ↑ | `object-inspector` | PO | 6 | todo |
| J4.5 | `js.references` | Values vs references | Core | Assignment copies references; mutation is visible everywhere. | ↑ | `memory-diagram` (stack/heap arrows) | PO | 7 | todo |
| J4.6 | `js.destructuring-spread` | Destructuring and spread | Core | Destructure, spread, shallow vs deep copy (`structuredClone`). | ↑ | `memory-diagram` | PO, FB | 7 | todo |
| J4.7 | `js.object-utilities` | Working with objects | Core | `Object.keys/entries/fromEntries`, `Object.groupBy`. | ↑ | `pipeline-viz` | PO, LC | 6 | todo |
| J4.8 | `js.map-set` | `Map` and `Set` | Core | When to use `Map`/`Set` over objects/arrays; Set operations. | ↑ | `hash-buckets` (simplified) | CH, LC | 6 | todo |
| J4.9 | `js.json` | JSON | Core | `JSON.stringify`/`parse`; what doesn't survive (Dates, `undefined`, functions). | ↑ | `json-roundtrip` | PO | 5 | todo |

### J5 · Errors and debugging — Entry: J4.9

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J5.1 | `js.errors` | Errors | Core | `throw new Error`, `try/catch/finally`, error types, `cause`. | — | `flow-tracer` (exception path) | PO, BUG | 6 | todo |
| J5.2 | `js.debugging` | Debugging | Core | Read stack traces; breakpoints and stepping. | ↑ | `debugger-sim` | TR, BUG | 6 | todo |

### J6 · DOM and events — Entry: J5.2, C1.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J6.1 | `js.dom-select` | Finding elements | Core | `querySelector(All)` and the DOM tree. | — | `dom-tree` + `selector-lab` | PO, LC | 5 | todo |
| J6.2 | `js.dom-update` | Changing the page | Core | `textContent` vs `innerHTML` (XSS), `classList`, attributes, `dataset`. | ↑ | `live-editor` | BUG, LC | 7 | todo |
| J6.3 | `js.dom-create` | Creating elements | Core | `createElement`, `append`, `<template>`, removing nodes. | ↑ | `dom-tree` | LC | 6 | todo |
| J6.4 | `js.events` | Events | Core | `addEventListener`, the event object, `preventDefault`. | ↑ | `event-log` | LC | 6 | todo |
| J6.5 | `js.event-propagation` | Bubbling and delegation | Core | Capture → target → bubble; one listener for many items. | ↑ | `propagation-viz` | PO, LC | 8 | todo |
| J6.6 | `js.forms` | Forms with JavaScript | Core | `submit` events, `FormData`, the Constraint Validation API. | ↑ H5.5 | `form-inspector` | LC | 7 | todo |
| J6.7 | `js.web-storage` | Web Storage | Ext | `localStorage`/`sessionStorage` with JSON; limits and privacy. | ↑ | `storage-inspector` | PO, LC | 5 | todo |

### J7 · Asynchronous JavaScript — Entry: J6.6

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J7.1 | `js.event-loop` | The event loop | Core | Call stack, task queue, microtask queue: predict log order. | — | `event-loop` | PO | 9 | todo |
| J7.2 | `js.timers-callbacks` | Timers and callbacks | Core | `setTimeout`/`setInterval`; why nested callbacks don't scale. | ↑ | `event-loop` | PO | 5 | todo |
| J7.3 | `js.promises` | Promises | Core | States, `then`/`catch`/`finally`, chaining and returning. | ↑ | `promise-states` | PO, BUG | 8 | todo |
| J7.4 | `js.async-await` | `async`/`await` | Core | Write async code that reads top-down; sequential vs parallel. | ↑ | `async-timeline` | PO, LC | 8 | todo |
| J7.5 | `js.promise-combinators` | Running promises together | Core | `Promise.all`, `allSettled`, `race`, `any`. | ↑ | `async-timeline` | PO | 6 | todo |
| J7.6 | `js.fetch` | `fetch` | Core | Request JSON, check `response.ok` (404 doesn't reject), send bodies. | ↑ | `network-panel` (mocked API) | BUG, LC | 8 | todo |
| J7.7 | `js.abort` | Cancellation and timeouts | Ext | `AbortController`, `AbortSignal.timeout`; cancel stale requests. | ↑ | `async-timeline` | LC | 5 | todo |
| J7.8 | `js.async-errors` | Async errors | Core | Unhandled rejections, `await` in `forEach`, missing `await`. | ↑ | `async-timeline` | BUG | 6 | todo |

### J8 · Objects in depth — Entry: J7.8

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J8.1 | `js.this` | `this` | Core | The four binding rules; arrow functions don't have their own `this`. | — | `this-resolver` | PO | 8 | todo |
| J8.2 | `js.classes` | Classes | Core | Constructors, methods, getters, `static`, `#private` fields. | ↑ | `object-inspector` | FB, LC | 7 | todo |
| J8.3 | `js.prototypes-inheritance` | Inheritance and prototypes | Ext | `extends`/`super`; the prototype chain under the hood. | ↑ | `prototype-chain` | PO | 7 | todo |

### J9 · Modules and tooling — Entry: J8.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J9.1 | `js.modules` | ES modules | Core | Named vs default exports, imports, module scope. | — | `module-graph` | BUG, FB | 6 | todo |
| J9.2 | `js.npm` | npm and packages | Core | `package.json`, dependencies vs devDependencies, semver ranges, lockfiles. | ↑ | `semver-calc` | PO | 6 | todo |
| J9.3 | `js.build-tools` | What a build tool does | Ext | Dev server, bundling, minification, code splitting (Vite). | ↑ | `build-pipeline` animator | RO | 5 | todo |

### J10 · Language power tools — Entry: J9.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J10.1 | `js.iterators-generators` | Iterators and generators | Ext | The iteration protocol; lazy sequences with `function*`. | — | `pipeline-viz` (pull mode) | PO | 7 | todo |
| J10.2 | `js.immutability` | Immutable updates | Core | Pure functions and immutable state updates (as in React/Redux). | ↑ | `memory-diagram` | BUG, LC | 6 | todo |
| J10.3 | `js.regex` | Regular expressions | Ext | Read and write everyday regexes: classes, quantifiers, groups, flags. | ↑ | `regex-lab` (live match highlighting) | FB, LC | 8 | todo |
| J10.4 | `js.dates-intl` | Dates and `Intl` | Ext | `Date` pitfalls (0-based months, time zones); `Intl` formatting; where `Temporal` fits. | ↑ | `intl-lab` | PO | 7 | todo |

### J11 · Testing and security — Entry: J10.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J11.1 | `js.unit-tests` | Unit testing | Core | `describe`/`it`/`expect` (Vitest); red → green → refactor. | — | `test-runner` | LC | 7 | todo |
| J11.2 | `js.test-doubles` | Mocks and async tests | Ext | Test async code; mock functions and modules sparingly. | ↑ | `test-runner` | LC, BUG | 6 | todo |
| J11.3 | `js.security` | Front-end security | Core | XSS, never `innerHTML`/`eval` user input, CSP basics, secrets don't belong in front-ends. | ↑ | `xss-lab` (sandboxed) | BUG | 7 | todo |

### J12 · Browser performance — Entry: J11.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J12.1 | `js.debounce-throttle` | Debounce and throttle | Core | Rate-limit handlers for search boxes and scroll. | — | `event-timeline` (raw vs debounced vs throttled) | LC | 7 | todo |
| J12.2 | `js.observers` | Observers | Ext | `IntersectionObserver` and `ResizeObserver` instead of scroll/resize polling. | ↑ | `observer-lab` | LC | 6 | todo |
| J12.3 | `js.web-workers` | Web Workers | Ext | Move heavy work off the main thread. | ↑ | `jank-meter` | CH, LC | 6 | todo |
| J12.4 | `js.web-vitals` | Core Web Vitals | Ext | What LCP, INP and CLS measure and the usual fixes. | ↑ | `vitals-sim` | CH | 7 | todo |

### J13 · Boss — Entry: J12.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J13.1 | `js.boss` | Boss: searchable list app | Core | Fetch, render, filter (debounced) and persist a list, passing a test suite. | — | `live-editor` + `test-runner` | LC, BUG | 10 | todo |

### J14 · TypeScript essentials — Entry: J13.1

Core, but scheduled after Phase 6 and before the v1.0 release gate (see ROADMAP). Samples are checked with the real TypeScript compiler (`verify: tsc`), including the exact error messages shown.

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| J14.1 | `js.ts-why` | Why TypeScript | Core | Catch bugs before running; types are checked at build time and erased at runtime. | — | `compiler-sim` (TS mode) | BUG, CH | 6 | todo |
| J14.2 | `js.ts-basic-types` | Annotations and inference | Core | Annotate where it helps, let inference do the rest; `type` vs `interface`; optional properties. | ↑ | `compiler-sim` | FB, BUG | 7 | todo |
| J14.3 | `js.ts-unions-narrowing` | Unions and narrowing | Core | Union and literal types; narrow with `typeof`, `in` and discriminated unions. | ↑ | `type-narrowing` (the type at each line, live) | FB, CH | 8 | todo |
| J14.4 | `js.ts-generics-utility` | Generics and utility types | Core | Typed functions, simple generics, `Partial`, `Pick`, `Omit`, `Record`. | ↑ | `compiler-sim` | FB, PO | 7 | todo |
| J14.5 | `js.ts-unknown-boundaries` | `any`, `unknown` and runtime data | Core | Prefer `unknown` to `any`; types don't validate API responses, so validate at the boundary. | ↑ | `network-panel` (typed vs validated) | BUG, CH | 6 | todo |
| J14.6 | `js.ts-in-projects` | TypeScript in real projects | Core | `tsconfig` `strict`, `@types` packages, how build tools and recent Node versions run TS by stripping types. | ↑ | `build-pipeline` (TS mode) | RO, CH | 6 | todo |

---

## Algorithms and Data Structures

**Ordering rationale:** cost thinking first (Big O by counting, not by formula), then the two searches that make the idea of logarithmic time visceral. Sorting is the flagship race and naturally introduces divide and conquer, which needs recursion right after. Data structures follow the order learners meet them at work: arrays, lists/stacks/queues, hash tables, trees and heaps, then graphs. Problem-solving techniques come last because they combine everything. Naive sorts are covered together in one lesson: you will never write one at work, but they are the clearest way to see O(n²). Code samples have JavaScript and C# tabs; JavaScript is preselected until the learner starts the C# track.

### A1 · Complexity — Entry: J2.3, J3.1, J4.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A1.1 | `algo.what-is-an-algorithm` | Counting steps | Core | Compare strategies by counting operations, not by timing. | — | `guess-number` (linear vs halving) | TR, PO | 5 | todo |
| A1.2 | `algo.big-o` | Big O | Core | Recognize O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ) by growth. | ↑ | `growth-plot` with n slider + op counters | CH | 8 | todo |
| A1.3 | `algo.analyze-code` | Analyzing code | Core | Derive complexity from loops, nested loops and halving loops. | ↑ | `complexity-annotator` | CH, PO | 8 | todo |
| A1.4 | `algo.space-complexity` | Space complexity | Core | Count extra memory; the time/space trade-off. | ↑ | `memory-meter` | CH | 5 | todo |
| A1.5 | `algo.amortized` | Amortized cost | Ext | Why `push` is O(1) amortized: capacity doubling. | ↑ | `dynamic-array` (capacity grows, copies counted) | PO | 6 | todo |

### A2 · Searching — Entry: A1.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A2.1 | `algo.linear-search` | Linear search | Core | Scan until found; best/worst/average cases. | — | `search-race` | TR | 4 | todo |
| A2.2 | `algo.binary-search` | Binary search | Core | Halve a sorted range each step: O(log n). | ↑ | `search-race` | TR, PO, BUG, LC | 8 | done |
| A2.3 | `algo.binary-search-variants` | Boundaries and variants | Ext | Lower bound / insertion point; search "the answer" (first true). | ↑ | `step-tracer` (lo/hi/mid pointers) | BUG, LC | 7 | todo |

### A3 · Sorting — Entry: A2.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A3.1 | `algo.sorting-race` | The sorting race | Core | See algorithms race; comparisons, swaps vs writes, stability. | — | `sort-race`: pick any of bubble, selection, insertion, merge, quick and heap sort; sizes, speeds, step mode, live counters (swaps, or writes for merge sort) and Big O | CH, PO | 6 | todo |
| A3.2 | `algo.naive-sorts` | Bubble and selection sort | Ext | See why both are O(n²) and never used in production. | ↑ | `sort-race` (step mode) | TR | 7 | todo |
| A3.3 | `algo.insertion-sort` | Insertion sort | Ext | O(n²) worst, near O(n) on nearly-sorted data; used inside hybrid sorts. | ↑ | `sort-race` | TR, PO | 7 | todo |
| A3.4 | `algo.merge-sort` | Merge sort | Core | Divide and conquer; stable O(n log n); extra memory. | ↑ A4.1 | `split-merge-tree` | TR, RO | 9 | todo |
| A3.5 | `algo.quick-sort` | Quicksort | Core | Partitioning, pivot choice, the O(n²) worst case. | ↑ | `partition-viz` | TR, PO | 9 | todo |
| A3.6 | `algo.sorting-in-practice` | Sorting in real code | Core | Built-ins (TimSort in V8, introsort in .NET `Array.Sort`), stability, comparators, multi-key sorts. | ↑ | `comparator-lab` | PO, LC | 6 | todo |
| A3.7 | `algo.counting-sort` | Non-comparison sorts | Ext | Counting/radix sort beat O(n log n) for small integer keys (know it exists). | ↑ | `sort-race` | CH | 5 | todo |

### A4 · Recursion — Entry: A2.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A4.1 | `algo.recursion` | Recursion | Core | Base case + smaller problem; watch the call stack grow and unwind. | — | `call-stack` | PO, BUG | 8 | todo |
| A4.2 | `algo.recursion-trees` | Recursion trees and memoization | Core | See exponential call trees (Fibonacci) collapse with a cache. | ↑ | `call-tree` | PO | 7 | todo |

### A5 · Linear structures — Entry: A3.6, A4.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A5.1 | `algo.arrays-memory` | Arrays in memory | Core | Contiguous memory: O(1) index, O(n) insert in the middle. | — | `memory-strip` | CH | 6 | todo |
| A5.2 | `algo.linked-lists` | Linked lists | Core | Nodes and pointers; O(1) insert at a known node, O(n) access. | ↑ | `pointer-lab` | TR, BUG | 8 | todo |
| A5.3 | `algo.stacks` | Stacks | Core | LIFO: undo, call stacks, bracket matching. | ↑ | `stack-queue` | LC | 6 | todo |
| A5.4 | `algo.queues` | Queues and deques | Core | FIFO; circular buffers; queues in job processing. | ↑ | `stack-queue` | TR, LC | 6 | todo |

### A6 · Hashing — Entry: A5.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A6.1 | `algo.hash-tables` | Hash tables | Core | Hashing to buckets, collisions, load factor and resizing: O(1) average. | — | `hash-buckets` | TR, CH | 9 | todo |
| A6.2 | `algo.hash-patterns` | Hashing patterns | Core | Counting, deduplication, two-sum, grouping. | ↑ | `step-tracer` | LC | 7 | todo |

### A7 · Trees and heaps — Entry: A6.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A7.1 | `algo.trees` | Trees | Core | Root, child, leaf, depth; the DOM and file systems are trees. | — | `tree-lab` | CH | 5 | todo |
| A7.2 | `algo.tree-traversal` | Traversals | Core | Pre/in/post-order DFS and level-order BFS. | ↑ | `tree-lab` (animated traversal) | TR, PO | 8 | todo |
| A7.3 | `algo.bst` | Binary search trees | Core | Insert/search/delete; a sorted insert degenerates into a list. | ↑ | `tree-lab` (BST mode) | TR | 9 | todo |
| A7.4 | `algo.balanced-trees` | Balanced trees | Ext | Why balance matters; red-black trees power `SortedDictionary` (know it exists). | ↑ | `tree-lab` (balanced vs degenerate) | CH | 5 | todo |
| A7.5 | `algo.heaps` | Heaps and priority queues | Ext | Heap as an array; O(log n) push/pop; `PriorityQueue` in .NET. | ↑ | `heap-lab` (array + tree views) | TR, PO | 8 | todo |
| A7.6 | `algo.heap-sort` | Heap sort | Ext | Build a max-heap in place, then move the max to the end: O(n log n) with O(1) extra space, not stable; the fallback inside introsort. | ↑ | `heap-lab` (sort mode: array and tree views) | TR, PO | 7 | todo |
| A7.7 | `algo.tries` | Tries | Ext | Prefix trees for autocomplete. | ↑ | `tree-lab` (trie mode) | TR, LC | 6 | todo |

### A8 · Graphs — Entry: A7.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A8.1 | `algo.graphs` | Graphs | Core | Vertices/edges, directed/weighted; adjacency list vs matrix. | — | `graph-lab` | CH | 7 | todo |
| A8.2 | `algo.bfs` | Breadth-first search | Core | Shortest path in unweighted graphs and grids. | ↑ A5.4 | `graph-lab` (maze) | TR, LC | 8 | todo |
| A8.3 | `algo.dfs` | Depth-first search | Core | Explore, detect cycles, flood fill. | ↑ | `graph-lab` | TR | 7 | todo |
| A8.4 | `algo.topological-sort` | Topological sort | Ext | Order tasks by dependencies (build systems, package managers). | ↑ | `graph-lab` (DAG mode) | TR, RO | 7 | todo |
| A8.5 | `algo.dijkstra` | Dijkstra's algorithm | Ext | Weighted shortest paths with a priority queue. | ↑ A7.5 | `graph-lab` (weighted) | TR | 9 | todo |

### A9 · Problem-solving techniques — Entry: A8.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A9.1 | `algo.two-pointers` | Two pointers | Core | Solve sorted-array problems in O(n). | — | `step-tracer` | TR, LC | 7 | todo |
| A9.2 | `algo.sliding-window` | Sliding window | Core | Subarray/substring problems in O(n). | ↑ | `step-tracer` | TR, LC | 7 | todo |
| A9.3 | `algo.greedy` | Greedy algorithms | Ext | When a local best choice is globally optimal (interval scheduling) and when it fails. | ↑ | `interval-lab` | TR, CH | 7 | todo |
| A9.4 | `algo.dynamic-programming` | Dynamic programming | Ext | Overlapping subproblems: memoization vs tabulation. | ↑ | `dp-table` (fills cell by cell) | TR, PO | 10 | todo |
| A9.5 | `algo.dp-classics` | Classic DP: edit distance | Ext | Edit distance, the algorithm behind diffs and spell-checkers. | ↑ | `dp-table` | TR | 10 | todo |
| A9.6 | `algo.backtracking` | Backtracking | Ext | Generate permutations/combinations; prune dead branches. | ↑ | `call-tree` (pruning) | TR, PO | 8 | todo |

### A10 · Boss — Entry: A9.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| A10.1 | `algo.boss` | Boss: pick the structure | Core | Choose structure + algorithm for realistic scenarios and justify the Big O. | — | mixed visualizers | CH, TR, LC | 10 | todo |

---

## C\#

**Ordering rationale:** the C# track assumes the learner already programs (JS fundamentals are the recommended path; anyone who already codes skips it in one click), so it focuses on what is new and what JS developers get wrong: compilation and static types first, then the value/reference and nullability model (the source of most C# bugs), then OOP, which matters far more in C# than in JS. Collections are recommended after Algorithms A1/A6 so `List<T>` and `Dictionary` are understood, not memorized. Delegates come before LINQ because LINQ is lambdas all the way down. Async before modern-syntax extras because every .NET endpoint is async. Projects/NuGet and testing close the track as the bridge into .NET. C# is taught through visualizers and non-executing challenges until Phase 7; every output claim is verified with the real compiler.

### S1 · The C# toolchain — Entry: none · Recommended: J4.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S1.1 | `cs.hello-dotnet` | From C# to running code | Core | SDK vs runtime; C# → IL → JIT; top-level statements; `dotnet run`. | — | `compile-pipeline` animator | RO, CH | 6 | todo |
| S1.2 | `cs.static-typing` | The compiler has your back | Core | Compile-time vs runtime errors; the same bug in JS and C#. | ↑ | `compiler-sim` (precomputed diagnostics as squiggles) | BUG | 6 | todo |
| S1.3 | `cs.variables-types` | Variables and built-in types | Core | `int`, `long`, `double`, `decimal`, `bool`, `char`, `string`, `var`. | ↑ | `type-sorter` | PO, FB | 7 | todo |
| S1.4 | `cs.numbers` | Numbers and conversions | Core | Integer division, overflow, casts, `Parse`/`TryParse`, `decimal` for money. | ↑ | `numeric-lab` (bit widths, overflow wrap) | PO | 7 | todo |
| S1.5 | `cs.strings` | Strings | Core | Interpolation, raw string literals, immutability, `StringBuilder`. | ↑ | `string-lab` | PO, FB | 7 | todo |

### S2 · Control flow and methods — Entry: S1.5

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S2.1 | `cs.control-flow` | Control flow, the C# way | Core | `if`, loops, `foreach`: what differs from JS (no truthiness, block scope). | — | `flow-tracer` | PO, BUG | 5 | todo |
| S2.2 | `cs.switch-expressions` | Switch expressions | Core | Map values with `switch` expressions and basic patterns. | ↑ | `pattern-matcher` | PO, FB | 7 | todo |
| S2.3 | `cs.methods` | Methods | Core | Signatures, return types, overloading, optional and named arguments. | ↑ | `overload-resolver` | PO, CH | 7 | todo |
| S2.4 | `cs.ref-out` | `out`, `ref`, `in` | Core | The `TryParse` pattern; when `ref` is justified. | ↑ | `memory-diagram` | PO | 6 | todo |

### S3 · Types and memory — Entry: S2.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S3.1 | `cs.value-vs-reference` | Value vs reference types | Core | `struct` copies, `class` shares; stack/heap as a mental model. | — · rec J4.5 | `memory-diagram` | PO | 9 | todo |
| S3.2 | `cs.nullability` | Null safety | Core | Nullable value and reference types; `?.`, `??`, `??=`; why `!` is a smell. | ↑ | `compiler-sim` (nullable warnings) | BUG, PO | 8 | todo |
| S3.3 | `cs.arrays` | Arrays, indices and ranges | Core | Arrays, `^1`, `..` ranges. | ↑ | `array-viz` | PO | 6 | todo |
| S3.4 | `cs.enums` | Enums | Core | Named constants; `[Flags]`; converting to/from strings. | ↑ | `flags-lab` (bits) | PO | 5 | todo |

### S4 · Object-oriented C# — Entry: S3.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S4.1 | `cs.classes` | Classes and objects | Core | Fields, constructors, methods, object initializers. | — | `object-inspector` | PO, RO | 7 | todo |
| S4.2 | `cs.properties` | Properties | Core | Auto-properties, `init`, `required`, the `field` keyword (C# 14). | ↑ | `compiler-sim` | FB, BUG | 6 | todo |
| S4.3 | `cs.access-modifiers` | Encapsulation | Core | `public`, `private`, `protected`, `internal`; expose behavior, not data. | ↑ | `visibility-map` | CH | 5 | todo |
| S4.4 | `cs.static-members` | Static vs instance | Core | What belongs to the type vs the object; static classes. | ↑ | `object-inspector` | PO | 5 | todo |
| S4.5 | `cs.inheritance-polymorphism` | Inheritance and polymorphism | Core | `virtual`/`override`, `abstract`, `sealed`, `base`; prefer composition. | ↑ | `dispatch-viz` (which method runs) | PO | 8 | todo |
| S4.6 | `cs.interfaces` | Interfaces | Core | Contracts; programming to interfaces (the basis of DI and testing). | ↑ | `dispatch-viz` | FB, CH | 7 | todo |
| S4.7 | `cs.records` | Records | Core | Value equality, `with` expressions, `record struct`; DTOs. | ↑ | `equality-lab` | PO | 7 | todo |
| S4.8 | `cs.primary-constructors` | Primary constructors | Ext | Primary constructors on classes; capture semantics. | ↑ | `compiler-sim` | FB | 5 | todo |
| S4.9 | `cs.equality` | Equality | Core | `==` vs `Equals`, reference equality, the `GetHashCode` contract. | ↑ | `equality-lab` | PO, BUG | 7 | todo |

### S5 · Generics and collections — Entry: S4.9 · Recommended: A1.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S5.1 | `cs.generics` | Generics | Core | Type-safe reuse with generic methods/classes and constraints. | — | `compiler-sim` | FB, BUG | 7 | todo |
| S5.2 | `cs.list` | `List<T>` | Core | A dynamic array: `Capacity`, `Count`, costs of `Insert`/`Remove`. | ↑ · rec A1.5 | `dynamic-array` | PO, CH | 6 | todo |
| S5.3 | `cs.dictionary-hashset` | `Dictionary` and `HashSet` | Core | Hash-based lookup; `TryGetValue`; key requirements. | ↑ · rec A6.1 | `hash-buckets` | PO, BUG | 7 | todo |
| S5.4 | `cs.collection-interfaces` | Collection interfaces | Core | `IEnumerable<T>`, `IReadOnlyList<T>`, `IList<T>`: what to accept and return. | ↑ | `interface-ladder` | CH | 6 | todo |
| S5.5 | `cs.choosing-collections` | Choosing a collection | Ext | `Queue`, `Stack`, `PriorityQueue`, `SortedDictionary`, immutable/frozen collections. | ↑ | `collection-chooser` game | CH | 6 | todo |
| S5.6 | `cs.collection-expressions` | Collection expressions | Core | `[1, 2, ..rest]` for arrays, lists and spans (C# 12). | ↑ | `live-preview` (static) | FB, PO | 4 | todo |

### S6 · Delegates and LINQ — Entry: S5.6

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S6.1 | `cs.delegates-lambdas` | Delegates and lambdas | Core | `Func<>`, `Action<>`, lambdas, closures. | — | `function-machine` | PO, FB | 7 | todo |
| S6.2 | `cs.events` | Events | Ext | `event` and `EventHandler` (common in desktop/libraries, rare in web APIs). | ↑ | `event-log` | PO | 5 | todo |
| S6.3 | `cs.linq-basics` | LINQ basics | Core | `Where`, `Select`, `OrderBy`, `ToList`. | ↑ · rec J4.2 | `linq-pipeline` | PO, RO | 8 | todo |
| S6.4 | `cs.linq-deferred` | Deferred execution | Core | Queries run when enumerated; multiple enumeration pitfalls. | ↑ | `linq-pipeline` (pull mode, step-through) | PO, BUG | 8 | todo |
| S6.5 | `cs.linq-operators` | Essential operators | Core | `First`/`Single`/`OrDefault`, `Any`, `GroupBy`, `ToDictionary`, `DistinctBy`, `Chunk`, `CountBy`. | ↑ | `linq-pipeline` | PO, CH | 8 | todo |
| S6.6 | `cs.linq-query-syntax` | Query syntax | Ext | Read `from ... where ... select` (common in older code and EF queries). | ↑ | `linq-pipeline` | FB | 4 | todo |

### S7 · Errors and resources — Entry: S6.5

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S7.1 | `cs.exceptions` | Exceptions | Core | `try/catch/finally`, filters, `throw;` vs `throw ex;`. | — | `exception-flow` | PO, BUG | 7 | todo |
| S7.2 | `cs.disposable` | `IDisposable` and `using` | Core | Release resources deterministically; `using` declarations. | ↑ | `lifetime-timeline` | PO, BUG | 6 | todo |
| S7.3 | `cs.error-design` | Designing for failure | Ext | Guard clauses (`ArgumentNullException.ThrowIfNull`), Try-pattern vs exceptions, custom exceptions. | ↑ | `exception-flow` | CH, BUG | 6 | todo |

### S8 · Asynchronous C# — Entry: S7.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S8.1 | `cs.tasks-async-await` | `Task` and `async`/`await` | Core | Awaiting frees the thread; the method resumes later. | — | `async-state-machine` (threads vs tasks) | PO | 9 | todo |
| S8.2 | `cs.async-pitfalls` | Async pitfalls | Core | `async void`, blocking with `.Result`/`.Wait()`, forgotten `await`. | ↑ | `async-state-machine` | BUG | 8 | todo |
| S8.3 | `cs.task-combinators` | Concurrency with tasks | Core | `Task.WhenAll`/`WhenAny`; sequential vs concurrent timing. | ↑ | `async-timeline` | PO | 7 | todo |
| S8.4 | `cs.cancellation` | Cancellation | Core | Pass and honor `CancellationToken`. | ↑ | `async-timeline` | FB, BUG | 6 | todo |
| S8.5 | `cs.async-streams` | Async streams | Ext | `IAsyncEnumerable<T>` and `await foreach`. | ↑ | `linq-pipeline` (async mode) | PO | 5 | todo |
| S8.6 | `cs.thread-safety` | Thread safety | Ext | Race conditions; `lock`, `Interlocked`, concurrent collections. | ↑ | `thread-interleave` | PO, BUG | 8 | todo |

### S9 · Modern C# — Entry: S8.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S9.1 | `cs.pattern-matching` | Pattern matching | Core | Type, property, relational and list patterns. | — | `pattern-matcher` | PO, FB | 8 | todo |
| S9.2 | `cs.extension-members` | Extension members | Core | Extension methods and C# 14 extension blocks. | ↑ | `compiler-sim` | FB, PO | 6 | todo |
| S9.3 | `cs.tuples-deconstruction` | Tuples and deconstruction | Ext | Named tuples, deconstruction, discards. | ↑ | `live-preview` (static) | PO | 5 | todo |
| S9.4 | `cs.attributes-reflection` | Attributes | Ext | Read attributes as metadata (ASP.NET Core uses them everywhere); reflection exists. | ↑ | `attribute-lens` | CH | 6 | todo |
| S9.5 | `cs.span-performance` | `Span<T>` and allocations | Ext | Slicing without copying; when performance work is worth it (know it exists). | ↑ | `allocation-meter` | CH | 6 | todo |

### S10 · Projects and testing — Entry: S9.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S10.1 | `cs.projects-nuget` | Solutions, projects, NuGet | Core | `.csproj`, project references, packages, namespaces. | — | `solution-explorer` sim | RO, CH | 6 | todo |
| S10.2 | `cs.unit-testing` | Unit testing with xUnit | Core | `[Fact]`, `[Theory]`, Arrange-Act-Assert. | ↑ | `test-runner` (simulated results) | FB, RO | 7 | todo |
| S10.3 | `cs.test-doubles` | Test doubles | Core | Fakes vs mocks; design for testability with interfaces. | ↑ | `dependency-graph` | BUG, CH | 6 | todo |

### S11 · Boss — Entry: S10.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| S11.1 | `cs.boss` | Boss: code review | Core | Review a realistic class: find nullability, async, equality and LINQ bugs. | — | `compiler-sim` + `memory-diagram` | BUG, PO | 10 | todo |

---

## .NET (ASP.NET Core and EF Core)

**Ordering rationale:** HTTP first, because ASP.NET Core is an HTTP pipeline. Then the host and middleware pipeline (the backbone), dependency injection (everything is resolved through it) and configuration/logging (needed by everything after). Minimal APIs are taught as the primary style; controllers get a dedicated lesson because they dominate existing codebases. EF Core gets the largest module: change tracking, N+1 and DbContext lifetime cause most production data bugs. Security, resilience and caching follow once there is an API to protect; testing and deployment close the track. All topics are taught through simulators.

### N1 · Platform and HTTP — Entry: S4.6, S8.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N1.1 | `net.ecosystem` | The .NET platform | Core | Runtime, BCL, SDK, LTS vs STS releases, project templates. | — | `release-timeline` | CH | 5 | todo |
| N1.2 | `net.http` | HTTP for backend developers | Core | Request/response anatomy, methods, headers, status codes. | ↑ | `http-inspector` | CH, PO | 8 | todo |
| N1.3 | `net.rest-design` | Designing HTTP APIs | Core | Resources, verbs, idempotency, choosing status codes. | ↑ | `api-designer` | CH, BUG | 7 | todo |

### N2 · ASP.NET Core foundations — Entry: N1.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N2.1 | `net.host` | `Program.cs` and the host | Core | Builder phase (services) vs app phase (pipeline); Kestrel. | — | `host-builder` | RO | 6 | todo |
| N2.2 | `net.middleware-pipeline` | The middleware pipeline | Core | Requests flow in and responses flow out through ordered middleware. | ↑ | `middleware-pipeline` animator | PO | 9 | todo |
| N2.3 | `net.middleware-order` | Middleware order | Core | Order exception handling, HTTPS, static files, routing, CORS, auth correctly. | ↑ | `middleware-pipeline` (drag to reorder) | RO, BUG | 7 | todo |
| N2.4 | `net.custom-middleware` | Writing middleware | Ext | Inline and class middleware; short-circuiting. | ↑ | `middleware-pipeline` | FB, PO | 6 | todo |

### N3 · Dependency injection — Entry: N2.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N3.1 | `net.di` | Dependency injection | Core | Constructor injection and the container; why not `new`. | — | `di-graph` (resolution tree) | FB, CH | 7 | todo |
| N3.2 | `net.di-lifetimes` | Service lifetimes | Core | Singleton, Scoped, Transient across requests. | ↑ | `di-lifetimes` simulator | PO | 9 | todo |
| N3.3 | `net.captive-dependencies` | Captive dependencies | Core | Scoped inside singleton: the bug and scope validation. | ↑ | `di-lifetimes` | BUG | 7 | todo |
| N3.4 | `net.di-patterns` | DI patterns | Ext | Multiple implementations, `IEnumerable<T>`, keyed services, factories. | ↑ | `di-graph` | PO, FB | 6 | todo |

### N4 · Configuration and logging — Entry: N3.3

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N4.1 | `net.configuration` | Configuration | Core | `appsettings.json`, environments, environment variables, user secrets; layering. | — | `config-layers` (later sources override) | PO | 7 | todo |
| N4.2 | `net.options` | The options pattern | Core | `IOptions<T>`, `IOptionsSnapshot<T>`, `IOptionsMonitor<T>`; validation on start. | ↑ | `config-layers` | CH, FB | 6 | todo |
| N4.3 | `net.logging` | Logging | Core | `ILogger<T>`, levels, structured message templates (not interpolation). | ↑ | `log-console` with level filter | BUG, PO | 7 | todo |

### N5 · Building APIs — Entry: N4.3, S7.1

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N5.1 | `net.minimal-api-routing` | Routing | Core | `MapGet`/`MapPost`..., route templates and constraints. | — | `route-matcher` | PO | 7 | todo |
| N5.2 | `net.parameter-binding` | Parameter binding | Core | Where each parameter comes from: route, query, body, header, services. | ↑ | `binding-inspector` | PO, CH | 8 | todo |
| N5.3 | `net.results` | Returning results | Core | `TypedResults`, `Results<Ok<T>, NotFound>`, correct status codes. | ↑ | `http-inspector` | FB | 6 | todo |
| N5.4 | `net.route-groups-filters` | Groups and filters | Ext | `MapGroup`, shared metadata, endpoint filters. | ↑ | `middleware-pipeline` (endpoint view) | FB, PO | 6 | todo |
| N5.5 | `net.validation` | Validating input | Core | Data annotations and built-in Minimal API validation (`AddValidation`, .NET 10). | ↑ | `binding-inspector` | BUG, FB | 6 | todo |
| N5.6 | `net.error-handling` | Errors and ProblemDetails | Core | `UseExceptionHandler`, `IExceptionHandler`, ProblemDetails responses. | ↑ | `middleware-pipeline` | PO, BUG | 7 | todo |
| N5.7 | `net.openapi` | OpenAPI | Ext | Generate API docs with `Microsoft.AspNetCore.OpenApi`; explore them in a UI. | ↑ | `openapi-preview` | CH | 5 | todo |
| N5.8 | `net.controllers` | Controllers | Core | `[ApiController]`, attribute routing, action results: read existing codebases. | ↑ | `route-matcher` | FB, CH | 7 | todo |

### N6 · EF Core — Entry: N5.8, S6.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N6.1 | `net.ef-intro` | EF Core and the DbContext | Core | Map entities to tables; `DbContext`, `DbSet<T>`, conventions. | — | `entity-mapper` | CH, FB | 7 | todo |
| N6.2 | `net.ef-querying` | Querying | Core | LINQ translated to SQL; where client evaluation stops. | ↑ | `sql-mirror` (LINQ ↔ generated SQL) | PO | 8 | todo |
| N6.3 | `net.ef-change-tracking` | Change tracking | Core | Entity states (Added, Unchanged, Modified, Deleted) and what `SaveChanges` sends. | ↑ | `ef-tracker` | PO, TR | 9 | todo |
| N6.4 | `net.ef-relationships` | Relationships | Core | One-to-many, many-to-many, navigations and foreign keys. | ↑ | `entity-mapper` (ER view) | CH, FB | 8 | todo |
| N6.5 | `net.ef-loading` | Loading related data and N+1 | Core | `Include`, projections; spot and fix the N+1 problem. | ↑ | `sql-mirror` with query counter | BUG | 8 | todo |
| N6.6 | `net.ef-migrations` | Migrations | Core | Evolve the schema with migrations; apply them safely. | ↑ | `migration-timeline` | RO | 6 | todo |
| N6.7 | `net.ef-performance` | Efficient queries | Ext | `AsNoTracking`, `Select` projections, pagination, `ExecuteUpdate`/`ExecuteDelete`. | ↑ | `sql-mirror` | BUG, CH | 7 | todo |
| N6.8 | `net.ef-concurrency` | Transactions and concurrency | Ext | `SaveChanges` is a transaction; optimistic concurrency tokens. | ↑ | `ef-tracker` (two users) | PO | 6 | todo |
| N6.9 | `net.dbcontext-lifetime` | DbContext lifetime | Core | Scoped, not thread-safe; no DbContext in singletons or parallel queries. | ↑ N3.3 | `di-lifetimes` | BUG | 6 | todo |

### N7 · Security — Entry: N6.9

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N7.1 | `net.authn-authz` | Authentication vs authorization | Core | Who you are vs what you may do; cookies vs bearer tokens. | — | `auth-flow` | CH | 6 | todo |
| N7.2 | `net.jwt` | JWT bearer tokens | Core | Anatomy, signature, validation parameters, expiry. | ↑ | `jwt-decoder` (fake tokens only) | PO, BUG | 7 | todo |
| N7.3 | `net.authorization` | Authorization policies | Core | `RequireAuthorization`, `[Authorize]`, roles, claims and policies. | ↑ | `middleware-pipeline` (auth view) | FB, PO | 6 | todo |
| N7.4 | `net.web-security` | Web API security | Core | HTTPS, CORS, secrets management, SQL injection and parameterization. | ↑ | `cors-sim` | BUG, CH | 8 | todo |

### N8 · Production concerns — Entry: N7.4

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N8.1 | `net.background-services` | Background work | Ext | `BackgroundService`; scopes inside hosted services. | — | `di-lifetimes` (hosted) | BUG | 6 | todo |
| N8.2 | `net.httpclient` | Calling other APIs | Core | `IHttpClientFactory`, typed clients, resilience (retries, timeouts). | ↑ | `network-panel` (failure injection) | BUG, CH | 7 | todo |
| N8.3 | `net.caching` | Caching | Ext | In-memory, `HybridCache`, output caching; invalidation trade-offs. | ↑ | `cache-sim` (hits/misses/staleness) | PO, CH | 7 | todo |
| N8.4 | `net.observability` | Health and observability | Ext | Health checks, structured logs, OpenTelemetry traces and metrics. | ↑ | `trace-waterfall` | CH | 6 | todo |
| N8.5 | `net.rate-limiting` | Rate limiting | Ext | Fixed/sliding window and token bucket limiters. | ↑ | `rate-limit-sim` | PO | 5 | todo |

### N9 · Testing and shipping — Entry: N8.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N9.1 | `net.integration-tests` | Integration tests | Core | `WebApplicationFactory`, test databases (Testcontainers). | S10.2 | `test-runner` (simulated) | RO, FB | 7 | todo |
| N9.2 | `net.deployment` | Deploying | Core | `dotnet publish`, containers without a Dockerfile, environments, reverse proxies. | ↑ | `deploy-pipeline` | RO, CH | 7 | todo |

### N10 · Boss — Entry: N9.2

| # | id | Lesson | Tier | Objective | Req | Interactive | Ch | Min | Status |
|---|---|---|---|---|---|---|---|---|---|
| N10.1 | `net.boss` | Boss: production incident | Core | Diagnose a failing API from logs, the pipeline and SQL traces; fix in order. | — | `middleware-pipeline` + `sql-mirror` + `di-lifetimes` | BUG, RO, PO | 10 | todo |

---

## Visualizer inventory

Visualizers are reusable; one implementation powers many lessons through props. Grouped by the phase that first needs them (most lessons reuse an earlier one).

| Phase | Visualizers |
|---|---|
| 1 (engine) | `live-editor`, `search-race`, `step-tracer`, `box-inspector` |
| 2 (HTML/CSS) | `anatomy-explorer`, `skeleton-toggles`, `dom-tree`, `devtools-sim`, `outline-view`, `sr-preview`, `landmark-map`, `url-resolver`, `image-lab`, `srcset-picker`, `table-builder`, `form-inspector`, `input-gallery`, `validation-lab`, `a11y-tree`, `focus-path`, `share-preview`, `load-waterfall`, `selector-lab`, `specificity-duel`, `cascade-trace`, `unit-lab`, `color-lab`, `theme-switcher`, `type-lab`, `flex-sandbox`, `flex-math`, `grid-sandbox`, `layout-chooser`, `position-lab`, `stack-3d`, `viewport-lab`, `pref-emulator`, `easing-editor`, `timeline-scrubber`, `render-pipeline`, `a11y-audit`, `architecture-compare`, `visual-diff` |
| 3 (JS) | `variable-boxes`, `type-sorter`, `float-inspector`, `truthiness-sorter`, `flow-tracer`, `loop-stepper`, `function-machine`, `scope-bubbles`, `closure-backpack`, `array-viz`, `pipeline-viz`, `object-inspector`, `memory-diagram`, `json-roundtrip`, `debugger-sim`, `event-log`, `propagation-viz`, `storage-inspector`, `event-loop`, `promise-states`, `async-timeline`, `network-panel`, `this-resolver`, `prototype-chain`, `module-graph`, `semver-calc`, `build-pipeline`, `regex-lab`, `intl-lab`, `test-runner`, `xss-lab`, `event-timeline`, `observer-lab`, `jank-meter`, `vitals-sim` |
| 4 (Algorithms) | `guess-number`, `growth-plot`, `complexity-annotator`, `memory-meter`, `dynamic-array`, `sort-race`, `split-merge-tree`, `partition-viz`, `comparator-lab`, `call-stack`, `call-tree`, `memory-strip`, `pointer-lab`, `stack-queue`, `hash-buckets`, `tree-lab`, `heap-lab`, `graph-lab`, `interval-lab`, `dp-table` |
| 5 (C#) | `compile-pipeline`, `compiler-sim`, `numeric-lab`, `string-lab`, `pattern-matcher`, `overload-resolver`, `flags-lab`, `visibility-map`, `dispatch-viz`, `equality-lab`, `interface-ladder`, `collection-chooser`, `live-preview`, `linq-pipeline`, `exception-flow`, `lifetime-timeline`, `async-state-machine`, `thread-interleave`, `attribute-lens`, `allocation-meter`, `solution-explorer`, `dependency-graph` |
| 6 (.NET) | `release-timeline`, `http-inspector`, `api-designer`, `host-builder`, `middleware-pipeline`, `di-graph`, `di-lifetimes`, `config-layers`, `log-console`, `route-matcher`, `binding-inspector`, `openapi-preview`, `entity-mapper`, `sql-mirror`, `ef-tracker`, `migration-timeline`, `auth-flow`, `jwt-decoder`, `cors-sim`, `cache-sim`, `trace-waterfall`, `rate-limit-sim`, `deploy-pipeline` |
| After Phase 6 (TypeScript) | `type-narrowing` (plus TS modes of `compiler-sim`, `build-pipeline`, `network-panel`) |

Many small "visualizers" (e.g. `type-sorter`, `truthiness-sorter`) are configurations of one generic `bucket-sort` widget; Phase 2 starts by extracting shared primitives (step engine, bucket sorter, timeline, tree renderer) so later visualizers are mostly configuration.
