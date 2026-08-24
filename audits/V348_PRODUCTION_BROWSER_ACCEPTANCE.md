# FE QUEST v348 — Production Browser Acceptance

Status: **PENDING CI LIVE-BROWSER RUN**  
Production under test: **v345**  
Target: `https://taiwanwan64.github.io/fe-quest/`  
Profile schema: **v5**

## Purpose

v346 cleared the operational/privacy gates for a small external beta, and v347 verified the intended learner journey in source/runtime contracts. v348 closes the remaining automated browser gap by opening the **actual production GitHub Pages site** in real Chromium and WebKit browser engines.

This is an audit/acceptance version only. It does not publish v348 runtime assets and does not change learner data, content, planning logic, cloud sync, Recovery Center, or the production service worker.

## Browser journey under test

For a fresh browser context, both desktop Chromium and mobile-sized WebKit must verify:

1. live production loads as FE QUEST v345 without the asset-recovery error UI;
2. the v340 first-run setup appears;
3. a future exam date can be saved and today's adaptive plan is generated without reload;
4. the ready plan contains at least one task and exposes the primary start action;
5. starting the plan leaves Home and opens the first learning route;
6. returning Home and opening the diagnostic renders the first diagnostic question/options;
7. the Home `todayResumeBtn` remains an enabled route into the current unfinished task;
8. reloading preserves first-run settings and does not reopen the setup overlay;
9. `privacy.html` returns successfully and still describes the current v345 local-first/optional-cloud baseline;
10. no uncaught browser `pageerror` occurs during the journey.

The workflow stores screenshots and a JSON result as a short-lived GitHub Actions artifact. It does **not** add product analytics or send learner history anywhere.

## Boundary

The complete 12-question diagnostic-finish handoff is already contract-covered by v347. v348 verifies the real-browser diagnostic entry and first-question rendering rather than scripting answers to the whole diagnostic merely to satisfy CI.

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

## Merge gate

Do not merge until the v348 workflow has completed successfully against the live production URL and this document has been updated with the recorded result.
