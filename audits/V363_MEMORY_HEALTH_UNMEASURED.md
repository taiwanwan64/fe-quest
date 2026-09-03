# v363 — Memory health unmeasured state

Status: implementation prepared. Static, browser and screenshot gates must pass before merge; final results are recorded in the release PR.

## Finding

With no answered questions, the memory-health card displayed an estimated retention of 100% while Stable, Soon and Due were all zero. The stored profile was already empty and the readiness calculation already assigned zero memory evidence; only the standalone memory-health average and presentation treated the empty set as 100%.

An empty evidence set has no meaningful retention percentage. Showing 0% alone would also resemble a learner who studied and forgot everything, so the fresh/reset presentation should be explicitly unmeasured.

## Correction

- With zero attempted questions, `memoryHealth()` returns an average of 0 for safe downstream arithmetic.
- The ring is empty and its center reads `未計測` with the caption `問題演習後に表示`.
- Stable, Soon and Due remain zero, and the assistive label says that retention is unmeasured.
- After the first real attempt, the existing estimated percentage, `推定保持` caption and band counts return unchanged.
- A complete reset returns a previously measured card to the unmeasured state after reload.

## Boundaries

- Readiness weights and the v362 fresh-readiness correction are unchanged.
- Measured retention, forgetting, scheduling and review-candidate algorithms are unchanged.
- The v333 reset implementation and persistence/recovery paths are unchanged.
- No profile schema, question bank, lesson progress, XP, cloud runtime or diagram changes.

## Required verification

- The v363 runtime must equal the version-transformed v362 runtime plus only the reviewed `memoryHealth()` and `renderMemoryHealth()` replacements.
- A semantic model must cover empty, measured, weighted and zero-attempt-placeholder states.
- Browser automation must verify fresh → measured → real complete reset → unmeasured across Chromium 1366/1024 and WebKit 390/320.
- Screenshots must show the unmeasured caption inside the ring without wrapping or overflow.
