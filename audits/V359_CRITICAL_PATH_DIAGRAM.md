# V359 — Critical path duration comparison

Status: IMPLEMENTED — release checks pending.

First browser run 33696525421 identified a 320px sum overflow and unequal mobile task alignment. The scoped CSS now stacks both sum results consistently at narrow widths and overrides inherited article paragraph rules. A connector-metric bug (reading coordinates from DOM nodes instead of measured route records) was corrected without weakening its tolerance. Browser verification is being repeated.

## Scope

- Baseline: main v358, a9eeac0a303ad2ddb6475d544ddf2ce20b058293.
- Target: core_14_04, プロジェクトスケジュールマネジメント.
- Add a static, accessible HTML/CSS diagram after the existing lesson diagram mounts.
- A: A1 (3 days) → A2 (4 days), total 7; B: B1 (2) → B2 (3), total 5.
- Both paths are required and may start together. Completion is an AND-join, not a choice.
- Overall duration max(7, 5) = 7 days; path A is critical with zero float; B has 2 days float.
- The example explicitly assumes adequate parallel resources, finish-to-start dependencies, and zero-duration start/finish nodes.
- Equal-width columns remain adjacent at narrow widths; labels, sums, arrows and float descriptions supplement color.

## Non-change boundary

The release changes only the application version, the new renderer/mount, appended scoped CSS, and versioned delivery metadata. Existing lesson prose, 710 questions, schema v5, learning progress, adaptive behavior, persistence/recovery and cloud v342 remain unchanged. All v358 assets remain immutable.

## Verification

- Static contract checks exact generated JS/CSS/shell deltas, source and asset hashes, renderer scope, numerical examples, version pointers and syntax.
- Browser checks use Chromium at 1366/1024 px and Playwright WebKit at 390/320 px. They read visible task values, verify sums/float, proportional duration bars, connector alignment, overflow, repeat rendering, existing memory/logic/automata diagrams, and uncaught errors.
- Screenshots and machine-readable results are retained as CI artifacts. WebKit automation is not a claim of physical iPhone testing.
- No beta invitation, tracking SDK or monetization change.

## Delivery

Use a separate v359 split release. Merge only after the latest-head CI is green; confirm GitHub Pages deployment separately. Prior v358 assets remain available for an explicitly reviewed rollback without altering learner data.
