# FE QUEST v348 — Production Browser Acceptance

Status: **BLOCKED — LIVE PRODUCTION IS NOT YET STABLE ENOUGH FOR THE FINAL BETA GATE**  
Production under test: **v345**  
Target: `https://taiwanwan64.github.io/fe-quest/`  
Profile schema: **v5**

## Purpose

v346 cleared the operational/privacy gates for a small external beta, and v347 verified the intended learner journey in source/runtime contracts. v348 tests the **actual production GitHub Pages site** in desktop Chromium and a mobile-sized WebKit context before any external invitation.

This branch is audit/acceptance only. It does not change learner data, content, planning logic, cloud sync, Recovery Center, or the production service worker.

## Evidence so far

A full live run (`32722971975`) passed in both Chromium and WebKit. It confirmed HTTP 200, FE QUEST v345, fresh first-run setup, four generated daily tasks, first learning launch, four diagnostic choices, reload persistence, current privacy wording, and zero uncaught page errors.

However the immediate later run (`32723182500`) did **not** reproduce that clean result:

- Chromium loaded v345 with HTTP 200 and showed first-run correctly, but after `今日の計画を作る` the expected ready state did not appear within 30 seconds. There were no uncaught page errors, console errors, or recorded request failures, so the exact state still needs diagnosis rather than being dismissed as a test failure.
- WebKit loaded v345 with HTTP 200, but `cloud/reconciliation-v342.js` was cancelled and the global asset-recovery UI was shown. This is significant because the v342 cloud activation loader explicitly declares cloud asset/runtime failures as **fail-open / local study continues**. The current v345 global recovery bootstrap reacts to any script/link load error, so an optional cloud asset failure can still be presented as a fatal app-load failure.

The WebKit observation exposes a real contract mismatch between:

- `cloud/activation-loader-v342.js`: `same-origin-pinned-sdk-fail-open-local-first`
- the v345 shell recovery bootstrap: any script/link resource error → full-screen reload prompt

Therefore the latest red result must not be papered over by simply retrying CI until green.

## Earlier test-only finding

The first implementation of v348 also failed because the test intentionally abandoned the diagnostic and then expected the normal Home `todayResumeBtn` immediately. That assertion was incorrect: onboarding may remain gated while diagnosis is incomplete. The test was corrected without changing production code.

## Current decision

**Do not merge v348 yet.**

The next safe action is a narrowly scoped production hotfix that preserves the local-first contract when an optional cloud asset fails, followed by a fresh v348 live-browser rerun. The Chromium first-run timeout will also receive stronger state diagnostics in the next acceptance run so a genuine save/planning issue cannot be hidden by network retries.

## Safety boundary

- no question or explanation changes
- no adaptive-plan semantic changes
- no profile-schema migration
- no analytics SDK or silent tracking
- no paywall
- no external tester invitations

A WebKit engine run is still not represented as a physical iPhone/iPad Safari test. Even after automated acceptance becomes stable, one final physical-device pass remains a human go/no-go gate before inviting the first 10–30 testers.
