# v363 — Memory health unmeasured state

Status: PASS — fresh/reset memory-health presentation gate cleared.

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

## Observed results

- Implementation/test head: `269e6b531e301ad7fbea8879ffaac5539dd4949a`
- GitHub Actions run: `33725439700` — success
- Static/release contract: 31/31 PASS
- Memory-health semantic model: 5/5 PASS
- Existing v362 complete-reset readiness model: 5/5 PASS
- Existing v360 stack/queue semantic model: 15/15 PASS
- Browser journeys: 4/4 PASS, 48/48 assertions
- Fresh state: `attempted: 0`, `avg: 0`, `未計測`, `問題演習後に表示`, all three counts 0
- Measured state: one real attempt restores `100%`, `推定保持` and the measured ring
- Complete reset: confirm → prompt (`初期化`) → alert → reload restores the unmeasured state
- Uncaught page errors and unexpected recovery UI: 0
- Evidence artifact: `v363-memory-health-unmeasured-evidence` (`9881826312`)
- Screenshot review: Chromium 1366/1024 and WebKit 390/320 all keep the unmeasured value and no-wrap caption inside the ring
