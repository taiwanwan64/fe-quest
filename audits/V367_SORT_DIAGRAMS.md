# v367 — Bubble and selection sort diagrams

Status: IN PROGRESS — local static/model gates passed; browser acceptance, screenshot review, PR CI, merge, and production verification remain.

## Learner-facing change

- Add one static comparison figure to `core_03_03`.
- Compare one pass of bubble sort and selection sort using the same array.
- Show that bubble sort compares adjacent elements and swaps immediately.
- Show that selection sort updates `minPos` while scanning and swaps after the scan.
- Show the current `i` / `i+1` in the existing bubble-sort trace.
- Show `j`, `minPos`, and the fixed left edge in the existing selection-sort trace.
- Reuse the same sort renderer in the Subject B mini mock.

## Safety boundary

- Production baseline: v366, main `7233a5ff20aaf1652ff94f70c7ef664dc277b48f`.
- Immutable split release: v367; v366 assets remain unchanged.
- Profile schema remains 5.
- Question bank remains 710.
- Existing questions, correct answers, trace steps, progression, XP, persistence, recovery, and cloud behavior remain unchanged.
- The core figure is static and creates no new completion gate.
- Array exercises other than `bubble_sort_b` and `selection_sort_b` retain the existing renderers.

## Acceptance

Commands:

```text
python .github/v367/materialize_sort_diagrams.py
python .github/v367/validate_sort_diagrams.py
node .github/v367/browser_sort_diagrams.cjs
```

Current result:

- static contract: 25 / 25 PASS
- renderer model: 8 / 8 PASS
- JavaScript syntax: PASS
- browser gate: pending

The browser gate covers Chromium 1366 / 1024 and WebKit 390 / 320. It verifies scope, the exact first-pass results, responsive overflow, rerender uniqueness, the shared lab/mini-mock renderer, unchanged answer contracts, unchanged saved learning state, and absence of uncaught errors or recovery UI. WebKit coverage does not claim physical-device Safari testing.

Reference books were used only to confirm the learning approach of tracing execution order, array indices, updated variables, and intermediate states. All examples, wording, markup, and diagrams in FE QUEST are original.
