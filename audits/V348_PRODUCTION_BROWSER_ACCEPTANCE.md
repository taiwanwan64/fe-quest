# FE QUEST v348 — Production Browser Acceptance

Status: **PASS — AUTOMATED PRODUCTION BROWSER GATE CLEARED**  
Production under test: **v345**  
Target: `https://taiwanwan64.github.io/fe-quest/`  
Profile schema: **v5**

## Purpose

v346 cleared the operational/privacy gates for a small external beta, and v347 verified the intended learner journey in source/runtime contracts. v348 tests the **actual production GitHub Pages site** in desktop Chromium and a mobile-sized WebKit context before any external invitation.

This branch is audit/acceptance only. It does not change learner data, content, planning logic, cloud sync, Recovery Center, or the production service worker.

## Final automated evidence

Latest passing workflow: `32729690435`  
Head under test: `41684b9ef8f2880d49435b1519e41fc3b2dd023f`

All acceptance gates passed:

- deterministic optional-cloud failure remains fail-open for local study while an essential app-asset failure still shows recovery
- deterministic local Chromium first-run lifecycle: 6 / 6 PASS
- live production Chromium desktop: PASS
- live production WebKit mobile-sized: PASS
- production title/baseline: FE QUEST v345
- fresh first-run setup visible in both live engines
- exam-date input remains stable after the post-load/pageshow lifecycle settles
- fresh plan generation: 4 tasks in both live engines
- first learning launch leaves Home and enters `problems` in both live engines
- diagnostic entry renders the first question with 4 choices in both live engines
- saved first-run settings survive reload in both live engines
- `privacy.html`: HTTP 200 and current v345 privacy wording
- asset-recovery UI: not visible after settled boot, learning start, or reload in either live engine
- uncaught page errors: 0

## What the earlier red runs taught us

Earlier failing runs were investigated rather than retried until green.

One failure occurred because browser automation entered the exam date before the intentional `pageshow` first-run re-render had fully settled. That could replace the input node and erase automation-entered state even though a human could not meaningfully interact until the settled page state. The acceptance boundary now waits for application boot, document `load`, and `pageshow` before interacting.

A separate deterministic local probe failure used a non-existent ready-state button id. The actual learner CTA is `firstRunStartV340`; correcting that selector made the six repeated lifecycle checks pass without any learner-facing production change.

The temporary concern that an optional cloud asset failure necessarily caused a fatal local-first outage was also tested directly. A deterministic probe now verifies the required contract: optional cloud failure remains fail-open, while essential app-asset failure still presents recovery. The live acceptance additionally checks that the recovery overlay is not visible in the settled learner state.

## Decision

**Automated production browser gate is cleared.**

No production hotfix was required. The current production remains v345 / profile schema v5.

The remaining beta boundary is intentionally human: one final physical-device pass on the production URL (at minimum iPhone/iPad Safari, and preferably a second mainstream browser/device) before inviting the first 10–30 external testers. Playwright WebKit is useful engine-level evidence, but it is not represented as a physical iPhone/iPad Safari test.

## Safety boundary

- no question or explanation changes
- no adaptive-plan semantic changes
- no profile-schema migration
- no cloud-sync behavior change
- no Recovery Center / JSON-export behavior change
- no analytics SDK or silent tracking
- no paywall
- no external tester invitations
