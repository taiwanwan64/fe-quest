# v367 — Bubble and selection sort diagrams

Status: PASS — local static/model gates, CI browser acceptance, and screenshot review cleared. Production implementation head `14484c41ba71ebb6f105ce3e11e015ce49331ede` passed [run 33863500628](https://github.com/taiwanwan64/fe-quest/actions/runs/33863500628). The final documentation/test-only head must also pass before merge; its run is recorded in [PR #161](https://github.com/taiwanwan64/fe-quest/pull/161).

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

Acceptance result:

- static contract: 25 / 25 PASS
- renderer model: 8 / 8 PASS
- JavaScript syntax: PASS
- browser gate: 4 / 4 PASS, 19 checks per viewport (76 / 76 assertions)
- browsers and widths: Chromium 1366 / 1024; WebKit 390 / 320
- evidence artifact: `v367-sort-diagrams-evidence`, artifact ID `9933064901`

The browser gate covers Chromium 1366 / 1024 and WebKit 390 / 320. It verifies scope, the exact first-pass results, responsive overflow, rerender uniqueness, the shared lab/mini-mock renderer, unchanged answer contracts, unchanged saved learning state, and absence of uncaught errors or recovery UI. WebKit coverage does not claim physical-device Safari testing.

The first browser run exposed that the 320 px layout gave each static array cell only about 6 px because the comparison note shared the same row. The final responsive layout moves the note below the array on mobile widths. The passing evidence measures a minimum static cell width of about 43 px at 390 px and 29 px at 320 px, with no component or document overflow. Screenshot review also confirmed that the comparison pair, `minPos`, scan position, fixed cell, and first-pass result remain distinguishable. Long element screenshots can contain the app's existing fixed header or bottom navigation over the captured lesson, but the live page scrolls normally and the tested diagram itself does not overflow.

Reference books were used only to confirm the learning approach of tracing execution order, array indices, updated variables, and intermediate states. All examples, wording, markup, and diagrams in FE QUEST are original.
