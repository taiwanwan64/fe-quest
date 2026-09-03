# v362 — Complete reset readiness correction

Status: implementation prepared. Static, browser and screenshot gates must pass before merge; final results are recorded in the release PR.

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
