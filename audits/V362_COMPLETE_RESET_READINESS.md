# v362 — Complete reset readiness correction

Status: PASS — complete-reset readiness gate cleared.

## Finding

After a full reset, stored learning evidence was empty, XP and streak were zero, but the dashboard showed Subject A practice 18% and total readiness 4%.

The cause was not stale storage. The internal category-skill prior deliberately starts at 50 for adaptive question selection. The readiness calculation counted 35% of that neutral prior even when the learner had no diagnostic or question-attempt evidence: round(50 × .35) = 18, contributing about 4 points to total readiness.

## Correction and boundaries

- If both diagnostic evidence and Subject A question attempts are absent, Subject A practice is displayed as 0.
- A completed diagnostic, diagnostic score payload or an actual question attempt enables the existing calculation unchanged.
- The neutral internal skill prior remains 50; the adaptive selector is not forced to treat a fresh learner as weak in every category.
- The existing v333 reset persistence path, pre-reset recovery point, deliberate Recovery Center snapshots, last-good refresh, two-step confirmation and first-run defaults are unchanged.
- No profile schema, question bank, lesson progress, XP award, storage/recovery, cloud runtime, CSS or diagram changes.

## Required verification

- The entire v362 JS must equal v361 plus the version update and reviewed readiness calculation replacement.
- A semantic model must distinguish neutral priors from diagnostic/attempt evidence.
- Browser automation must seed progress/settings, invoke the real reset button through confirm → prompt → alert, survive reload, and assert total readiness 0%, all six readiness components 0%, cleared learning evidence, first-use planning settings, persistent reset data, and no page errors.
- Target browsers: Chromium 1366/1024 and WebKit 390/320. WebKit does not claim physical iPhone Safari testing.

## Observed results

- Implementation/test head: `e6e30339b7261b81ab446c23c8442f46322e089a`
- GitHub Actions run: `33719286913` — success
- Static/source-of-truth contract: 25/25 PASS
- Readiness semantic model: 5/5 PASS
- Existing v360 stack/queue semantic model: 15/15 PASS (unchanged)
- Real reset browser journeys: 4/4 PASS, 44/44 assertions
- Dialog sequence: confirm → prompt (`初期化`) → alert in all four journeys
- Post-reset result: total readiness 0% and all six readiness components 0%
- Stored evidence and planning settings reset to first-use state; neutral internal skill priors remain 50
- Uncaught page errors and unexpected recovery UI: 0
- Evidence artifact: `v362-complete-reset-readiness-evidence` (`9879655972`)
- Screenshot review: Chromium 1366/1024 and WebKit 390/320 all show the corrected 0% state without readiness-card layout breakage
