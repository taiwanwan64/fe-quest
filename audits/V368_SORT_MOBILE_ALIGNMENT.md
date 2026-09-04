# v368 — Sort diagram mobile alignment

Status: implementation and local acceptance in progress.

## Reported friction

At a 402 CSS px mobile viewport, the bubble-sort heading wrapped as `バブルソー / ト`, while the selection-sort heading remained on one line. The badge beside the title also wrapped. Although both outer panels used the same grid width, the horizontal heading layout gave the longer bubble-sort title less usable space and made the two explanations look uneven.

## Learner-facing change

- Keep the desktop two-column heading presentation unchanged.
- At 700 px and below, place the algorithm title and its explanatory badge on two consistent rows.
- Keep both titles and both badges on one line.
- Explicitly stretch both sort panels, row content areas, and array regions to the same available width.
- Cover the reported 402 px width as well as 390 px and 320 px in WebKit browser acceptance.

## Safety boundary

- Immutable split release: v368; v367 assets remain unchanged.
- Profile schema remains 5 and the question bank remains 710.
- No question, answer, curriculum, trace step, progression, XP, persistence, recovery, or cloud behavior changes.
- No new learner interaction or completion gate.

## Acceptance

Commands:

```text
python .github/v368/materialize_sort_mobile_alignment.py
python .github/v368/validate_sort_mobile_alignment.py
node .github/v368/browser_sort_mobile_alignment.cjs
```

The browser gate checks desktop Chromium 1366 and mobile WebKit at 402, 390, and 320 CSS px. It verifies equal panel and array-region widths, one-line titles and badges, equal mobile heading and badge widths, preserved desktop layout, no overflow, unchanged saved learning state, and no uncaught errors or recovery UI.
