# v366 — Linear and binary search diagrams

Status: PASS — local static/model gates, CI browser acceptance and screenshot review cleared. Production implementation head `db547badb1d91817924d1be2d6cc75e3b8870adc` passed [run 33817755487](https://github.com/taiwanwan64/fe-quest/actions/runs/33817755487). The final documentation/test-only head must also pass before merge; its run is recorded in [PR #160](https://github.com/taiwanwan64/fe-quest/pull/160).

## Learner-facing change

- Add one static comparison figure to `core_03_03`.
- Compare a linear scan with binary range reduction using the same sorted array and target.
- State explicitly that linear search can work on unsorted data and binary search requires sorted data.
- Show the current `i` in the existing linear-search trace.
- Show `low`, `mid`, `high`, active range, discarded range, and found cell in the existing binary-search trace.
- Reuse the same search renderer in the Subject B mini mock.

## Safety boundary

- Production baseline: v365, main `4a7b103ec8ec867592b8ca4ffa31255b604b1cd4`.
- Immutable split release: v366; v365 assets remain unchanged.
- Profile schema remains 5.
- Question bank remains 710.
- Existing questions, correct answers, trace steps, progression, XP, persistence, recovery, and cloud behavior remain unchanged.
- The core figure is static and creates no new completion gate.
- Array exercises other than `linear_search` and `binary_search_b` retain the existing generic renderer.

## Acceptance

Commands:

```text
python .github/v366/materialize_search_diagrams.py
python .github/v366/validate_search_diagrams.py
node .github/v366/browser_search_diagrams.cjs
```

Acceptance result:

- static contract: 25 / 25 PASS
- renderer model: 6 / 6 PASS
- JavaScript syntax and workflow YAML: PASS
- browser gate: 4 / 4 PASS, 18 checks per viewport (72 / 72 assertions)
- browsers and widths: Chromium 1366 / 1024; WebKit 390 / 320
- evidence artifact: `v366-search-diagrams-evidence`, artifact ID `9917172254`

The browser gate verifies scope, exact comparison counts, search prerequisites, responsive overflow, rerender uniqueness, the shared lab/mini-mock renderer, unchanged answer contracts, unchanged saved learning state, and absence of uncaught errors or recovery UI. WebKit coverage does not claim physical-device Safari testing.

Screenshot review confirmed that the same seven-cell array remains readable at all four widths. The first passing screenshots exposed one presentation issue that overflow checks did not catch: the `low` marker sat too close to the `1回目` label in the binary-search panel. The final CSS adds vertical separation without changing the diagram data, exercise behavior or protected contracts. The screenshot helper was then adjusted to center short trace figures so evidence is not needlessly obscured by the fixed mobile navigation.

Reference books were used only to confirm the concepts of tracking array indices and narrowing the comparison range. All examples, wording, markup and diagrams in FE QUEST are original.
