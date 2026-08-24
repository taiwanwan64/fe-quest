# FE QUEST v348 — Production Browser Acceptance

Status: **PASS — AUTOMATED PRODUCTION BROWSER GATE CLEARED**  
Production under test: **v345**  
Target: `https://taiwanwan64.github.io/fe-quest/`  
Profile schema: **v5**  
Passing workflow run: **32729323010**

## Purpose

v346 cleared the operational/privacy gates for a small external beta, and v347 verified the intended learner journey in source/runtime contracts. v348 tests the **actual production GitHub Pages site** in desktop Chromium and a mobile-sized WebKit context before any external invitation.

This branch is audit/acceptance only. It does not change learner data, content, planning logic, cloud sync, Recovery Center, the profile schema, or the production service worker.

## Final automated evidence

Workflow run `32729323010` completed successfully with every acceptance gate green.

### Deterministic local-first / failure behavior

- optional-cloud fail-open probe: **PASS**
- optional cloud failure does not replace the usable local learner path with the fatal asset-recovery screen
- an intentionally missing essential app asset still triggers the recovery UI, preserving the intended protection for a genuinely incomplete app load

### Deterministic Chromium first-run lifecycle

Six fresh Chromium runs against the production v345 shell all passed after the document reached the learner-interactable boundary (`load` + `pageshow`):

- **6/6 PASS**
- future exam-date input remained stable: **6/6**
- setup → ready transition visible: **6/6**
- `最初の学習を始める` visible: **6/6**
- daily plan generated: **6/6**
- uncaught page errors: **0**

The generated fresh plan remained four tasks, consistent with the v347 runtime dry run.

### Live GitHub Pages acceptance

Both automated live-browser cases passed against `https://taiwanwan64.github.io/fe-quest/`:

| Check | Chromium desktop | WebKit mobile-sized |
| --- | --- | --- |
| production title/version | PASS — v345 | PASS — v345 |
| fresh first-run setup | PASS | PASS |
| exam-date entry | PASS | PASS |
| generated first-run tasks | PASS — 4 | PASS — 4 |
| first learning launch | PASS — `problems` | PASS — `problems` |
| diagnostic entry/options | PASS — 4 choices | PASS — 4 choices |
| first-run settings survive reload | PASS | PASS |
| privacy page | PASS — HTTP 200 | PASS — HTTP 200 |
| visible asset-recovery UI after settled boot | none | none |
| visible asset-recovery UI after learning start | none | none |
| visible asset-recovery UI after reload | none | none |
| uncaught page errors | 0 | 0 |

The acceptance harness waits for a navigation-stable document after `load` / `pageshow`, including a possible short PWA boot/update navigation, before learner interaction. This is important because first-run setup intentionally re-renders from the stored profile on `pageshow`.

## What the earlier red runs actually showed

The earlier v348 failures did **not** establish a production learner defect.

Two test-harness problems were isolated:

1. The first-run probe could fill the exam date while the page was still between `DOMContentLoaded` and the intentional `pageshow` first-run re-render. The re-render then replaced the input element, making the automated value disappear. Six settled-load Chromium repetitions now pass.
2. The local probe looked for a non-existent ready-state button id (`firstRunPrimaryActionV340`) instead of the production id `firstRunStartV340`.

A later live run also observed an execution context being destroyed during a short production navigation and, in WebKit, an asset-recovery node before the document had settled. The final harness now waits for a stable `performance.timeOrigin` and evaluates whether recovery UI is actually visible in the settled learner document. In the passing run, the recovery node count is **0** at settled boot, after learning start, and after reload in both engines.

No learner-facing production change was required to clear these findings.

## Current decision

**Automated production browser acceptance is clear. v348 is safe to merge as an audit-only change.**

This does **not** start the external beta automatically. One final physical-device pass remains the human go/no-go gate before the first 10–30 testers are invited.

## Safety boundary

- no question or explanation changes
- no adaptive-plan semantic changes
- no profile-schema migration
- no cloud-sync behavior change
- no analytics SDK or silent tracking
- no paywall
- no external tester invitations

Playwright WebKit is a browser-engine acceptance test, not a claim that an actual iPhone/iPad Safari session was performed.
