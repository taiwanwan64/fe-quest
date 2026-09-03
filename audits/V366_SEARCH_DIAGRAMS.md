# v366 — Linear and binary search diagrams

Status: implementation and local static/model acceptance complete; browser acceptance pending CI.

## Learner-facing change

- Add one static comparison figure to `core_03_03`.
- Compare a linear scan with binary range reduction using the same sorted array and target.
- State explicitly that linear search can work on unsorted data and binary search requires sorted data.
- Show the current `i` in the existing linear-search trace.
- Show `low`, `mid`, `high`, active range, discarded range, and found cell in the existing binary-search trace.
- Reuse the same search renderer in the Subject B mini mock.

## Safety boundary

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

Final CI and browser evidence will be recorded before merge.

Local result:

- static contract: 25 / 25 PASS
- renderer model: 6 / 6 PASS
- JavaScript syntax and workflow YAML: PASS
