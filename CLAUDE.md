# CLAUDE.md

Persistent project memory. Read this first in every session; details live in `docs/`.

## Product

Interactive learning web app (working title **Project Neon**; the name lives only in `APP_NAME` in `src/config/app.ts` and will change). Teaches HTML, CSS, JavaScript, C#, .NET (ASP.NET Core, EF Core) and Algorithms & Data Structures, from fundamentals to professional essentials. Audience: novices and experienced developers refreshing skills.

**Core principle: SHOW, DON'T TELL.** Every concept is grasped through interaction within the first 30 seconds of a lesson. Precise, no filler. Teach what is used professionally today (C# 14 / .NET 10 LTS, ES2023+, modern CSS, semantic and accessible HTML). Legacy material only if still common in real codebases, and labelled as such.

**Lesson anatomy (fixed, 3–10 min):** 1. Concept card (one mental model, 30–60 s read) · 2. Interactive playground · 3. Auto-checked challenge(s) · 4. "In production" · 5. "Common mistake" · 6. Recap (2–3 bullets).

**Challenge types:** predict-output, fill-blank, find-bug, reorder, live-code (HTML/CSS/JS), visual-match (CSS), trace, choice. C# has no execution until the optional `dotnet-wasm` runner (Phase 7) adds `cs-live-code` as a plugin. ASP.NET Core / EF Core are always taught through simulators.

**Design:** game-like skill-tree map (locked/available/completed nodes, prerequisite edges), XP, levels, streaks. Dark neon + Matrix/cyberpunk **only in the frame** (landing digital rain, terminal loaders, level-up glitch). Lesson/challenge/cheat-sheet surfaces stay calm and readable. Respect `prefers-reduced-motion`, WCAG 2.2 AA, fully responsive.

**Cheat sheets:** one per track (HTML, CSS, JS, C#, .NET, Algorithms Big O table). Original content only, never copied. Each entry: snippet, one-line explanation, usage tag (daily / common / rare), copy button, Learn link (only when the lesson is published). Instant search + usage filter, never gated, print-friendly, stored as data.

**Constraints:** static frontend only, no backend/accounts. Progress in localStorage with JSON export/import. Hosted on GitHub Pages from the public repo https://github.com/krasimir-paunov/code-learning-app. Lessons and cheat sheets are data; adding one never requires engine changes. Every lesson's visualizer is lazy-loaded. English only.

## Approved decisions (Phase 0)

- **272 lessons**, each tagged **Core** (job-ready, 207) or **Extended** (depth, 65). All are on the map from Phase 1; unbuilt ones show "coming soon".
- **Two passes:** Pass 1 builds Core lessons track by track (Phases 2–6, then J14) and can ship as v1.0; Pass 2 adds Extended lessons in the same order. A Core lesson never hard-requires an Extended one.
- **C# gate is soft:** the C# track *recommends* JS fundamentals (and some Algorithms lessons) via a "Recommended path" banner with a one-click, per-track skip. Never a hard lock. **Free roam** is a global setting that opens everything.
- **TypeScript module** (J14, 6 Core lessons) at the end of the JS track, built after Phase 6 and before the v1.0 release gate.
- **Dark theme only** for now; tokens are two-layer (primitive → semantic) so a light theme is just a new token set.

## Docs (source of truth)

- `docs/CURRICULUM.md`: all tracks/modules/lessons with ids, prerequisites, interactive element, challenge types, minutes, status.
- `docs/ARCHITECTURE.md`: stack, folders, content format (full example lesson), plugin contracts, progress model, hosting.
- `docs/DESIGN.md`: tokens, typography, motion, component inventory, where effects may and may not appear.
- `docs/ROADMAP.md`: phases 1–8 and the lesson Definition of Done.

**Current phase:** 0 (planning) approved and complete. Phase 1 starts only when the user says so.

## Stack

React 19 + TypeScript (strict) + Vite, React Router, Zustand, Zod, CSS Modules + custom-property tokens, CodeMirror 6 (lazy), Shiki (build time), Motion (visualizer/map chunks only), dnd-kit, MiniSearch, dagre (build time), Vitest + Testing Library + Playwright + axe, ESLint (jsx-a11y) + Prettier. Node 22 LTS. .NET 10 SDK for snippet verification.

## Commands (created in Phase 1)

```
npm run dev              # dev server
npm run build            # production build (+ route shells)
npm run test             # Vitest
npm run e2e              # Playwright + axe
npm run lint             # ESLint + Prettier check
npm run typecheck
npm run content:check    # schemas, ids, prerequisite graph, links, CURRICULUM.md parity
npm run verify:snippets  # executes JS (Node/Chromium), C# (dotnet run) and TS (tsc) samples, compares outputs
```

## Non-negotiable rules

1. **Accuracy.** Every code sample and every "this prints X" claim is executed by `verify:snippets` (Node 22, Chromium, `dotnet run file.cs` on .NET 10, or `tsc`). Never write an output by reasoning alone. Compiler diagnostics and EF-generated SQL shown to learners are captured from the real tools. `verify: none` needs a written reason.
2. **Lesson and challenge ids are permanent** (they key saved progress). Rename titles freely, never ids.
3. **Content is data.** No lesson-specific code in `src/engine/`. New behavior = new visualizer, challenge type or runner plugin.
4. **Effects never touch reading surfaces** (concept, code, challenges, feedback, cheat sheets, forms). See DESIGN.md §5.
5. **`APP_NAME` is the only place the name appears.** Storage keys use the fixed `STORAGE_NAMESPACE`, never the name.
6. Planning-only sessions don't write app code. Don't start a new phase without the user's approval.

## Code conventions

- TypeScript strict; no `any` (use `unknown` + Zod parsing at boundaries). Prefer `type`-only imports where possible.
- Function components and hooks only. Named exports; default export only where lazy loading requires it (`View.tsx`).
- File names: components `PascalCase.tsx` + `PascalCase.module.css`; everything else `kebab-case.ts`. Content folders and ids `kebab-case`, ids namespaced `track.slug`.
- Pure logic (visualizer models, graders, XP/streak math, unlock rules, migrations) lives in plain `.ts` files with unit tests next to them (`*.test.ts`). React components render; they don't compute domain logic.
- Styles: semantic tokens only (`var(--…)`), no raw colors/sizes outside `tokens.css`; components never reference primitive tokens. Modern CSS (nesting, `:has()`, container queries, logical properties). Mobile-first. Every animation behind the motion preference.
- Accessibility: semantic HTML first, ARIA only when needed; every control keyboard-operable with a visible focus ring; icon buttons have accessible names; visualizers announce state as text.
- Performance: route-level and lesson-level code splitting; respect bundle budgets (ARCHITECTURE §12); never import CodeMirror, Motion or a visualizer from the shell.
- Comments explain *why*, not *what*. No dead code, no commented-out code.
- Git: Conventional Commits (`feat:`, `fix:`, `content:`, `docs:`, `chore:`, `test:`, `refactor:`). One lesson or one engine concern per commit. Update the lesson's status in `CURRICULUM.md` in the same commit that publishes it.

## Content style

- Second person, present tense, short sentences. No "simply", "just", "obviously", no filler intros.
- Concept card: one mental model; ≤ 120 words.
- Every claim about a platform feature reflects current behavior; label Baseline status for web features that are "newly available".
- JavaScript: `const`/`let`, `===`, arrow functions, modules, `async`/`await`. C#: file-scoped namespaces, nullable enabled, collection expressions, primary constructors where natural, `var` when the type is obvious.
- Algorithm samples: JS and C# tabs, both verified.
