# FE QUEST v348 — Production Browser Acceptance

Status: **PASS — LIVE PRODUCTION ACCEPTED IN CHROMIUM + WEBKIT**  
Production under test: **v345**  
Target: `https://taiwanwan64.github.io/fe-quest/`  
Profile schema: **v5**  
Passing workflow run: **32722971975**

## Purpose

v346 cleared the operational/privacy gates for a small external beta, and v347 verified the intended learner journey in source/runtime contracts. v348 closes the remaining automated browser gap by opening the **actual production GitHub Pages site** in real Chromium and WebKit browser engines.

This is an audit/acceptance version only. It does not publish v348 runtime assets and does not change learner data, content, planning logic, cloud sync, Recovery Center, or the production service worker.

## Result

The live-browser workflow passed in both target cases:

- desktop Chromium, 1440 × 1000
- mobile-sized WebKit, 390 × 844 with touch/mobile context

Both engines confirmed:

1. HTTP 200 and title `FE QUEST PWA v345`;
2. fresh first-run setup was visible;
3. a future exam date was saved;
4. the fresh adaptive plan contained four tasks;
5. the primary first-run action opened a learning route (`problems` in the passing run);
6. diagnostic entry rendered four answer choices;
7. returning Home from an intentionally interrupted diagnostic succeeded;
8. reload preserved first-run settings and did not reopen the setup overlay;
9. `privacy.html` returned HTTP 200 and matched the current v345 policy baseline;
10. uncaught browser `pageerror`: **0** in both engines;
11. asset-recovery error UI: **not shown**.

The passing fresh-plan presentation in both engines contained the same four learner-facing tasks:

- 記憶の復習
- データの単位
- プログラムトレース：ループで合計
- 今日の総合チェック

Chromium completed with no failed requests. WebKit recorded one `cloud/reconciliation-v342.js` request cancelled at a navigation/reload boundary, with no console error, uncaught page error, or learner-flow failure. It is retained in the evidence rather than hidden.

The workflow uploaded seven evidence files (JSON + screenshots) as the short-lived `v348-production-browser-evidence` Actions artifact.

## First CI finding and test correction

The first live-browser run successfully loaded production, generated four fresh-plan tasks in both engines, opened the first learning route, and rendered four diagnostic choices. It then failed because the test abandoned the diagnostic and incorrectly expected the normal Home `todayResumeBtn` to be visible immediately afterward.

That assertion did not match the intended onboarding sequence. The completed-diagnostic → Home → today-task handoff is already contract-covered by v347, while an incomplete diagnostic may continue to gate the normal Home study CTA. v348 therefore no longer treats the intentionally interrupted state as if diagnosis had finished. No production code was changed in response to this test-only finding.

## Boundary

The complete 12-question diagnostic-finish handoff and normal today-resume route are already contract-covered by v347. v348 verifies the real-browser diagnostic entry and first-question rendering rather than scripting answers to the whole diagnostic merely to satisfy CI.

Optional cloud sync is not re-certified as a live cloud test by v348. The v348 acceptance target is the local-first learner journey; cloud-sync behavior remains protected by the existing v342/v343 contracts and dedicated acceptance history.

A WebKit engine run is also not represented as a physical iPhone/iPad Safari test. One final physical-device pass remains a human go/no-go gate before external invitations.

## Safety

- no question or explanation changes
- no adaptive-plan changes
- no profile-schema migration
- no production version bump
- no cloud-sync behavior changes
- no Recovery Center / JSON export changes
- no analytics SDK or silent tracking
- no paywall
- no external tester invitations

## Decision

**Automated production-browser gate: cleared.**

v348 may be merged as an audit/operations milestone. The remaining pre-invitation gate is one real physical-device pass using `docs/EXTERNAL_BETA_DRY_RUN_v347.md`, followed by a human decision on whether to invite the first 10–30 testers.
