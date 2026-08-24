# FE QUEST — Physical Device Beta Gate

Status: **HUMAN GO / NO-GO REQUIRED**  
Production target: `https://taiwanwan64.github.io/fe-quest/`  
Expected production version: **v345**  
Profile schema: **v5**

## Purpose

v348 cleared the automated production-browser gate in Chromium and Playwright WebKit. This checklist covers the one thing CI must not pretend to have done: a short end-to-end pass on an actual phone/tablet browser before the first 10–30 external beta testers are invited.

This is an operator checklist, not an automated test. Do not mark it PASS from Playwright, screenshots, source inspection, or emulation alone.

## Preferred devices

Minimum:

- iPhone or iPad + current Safari

Preferably add one second independent path:

- Android + Chrome, or
- desktop Chrome / Edge / Safari on a machine that is not the development environment

Record only broad device/browser information. Do not collect tester identifiers that are unnecessary for this gate.

## Pre-check

- Open the production URL, not a branch preview or local server.
- Use a fresh/private browser context when checking first-run onboarding.
- Confirm the page identifies itself as FE QUEST v345.
- If an existing real learning profile is important, export a JSON backup before deliberately resetting anything. Do not destroy production learning history just to create a fresh-context test.

## Required learner journey

Mark each item PASS / FAIL and add a short note only when needed.

| # | Check | Expected result | Result |
|---|---|---|---|
| 1 | Open production | Home renders without a fatal recovery overlay | ☐ PASS / ☐ FAIL |
| 2 | First-run setup | Exam-date and study-time controls are readable and usable | ☐ PASS / ☐ FAIL |
| 3 | Enter future exam date | Value remains visible and no unexpected redraw erases it | ☐ PASS / ☐ FAIL |
| 4 | Create today's plan | Ready state appears with at least one task | ☐ PASS / ☐ FAIL |
| 5 | Start first learning task | The app leaves Home and opens the intended learning screen | ☐ PASS / ☐ FAIL |
| 6 | Return Home | Navigation works without losing the saved setup | ☐ PASS / ☐ FAIL |
| 7 | Start diagnostic | First diagnostic question and answer choices render normally | ☐ PASS / ☐ FAIL |
| 8 | Reload production | Saved first-run settings remain; onboarding is not incorrectly reset | ☐ PASS / ☐ FAIL |
| 9 | Today's learning | The main CTA clearly communicates the next action | ☐ PASS / ☐ FAIL |
| 10 | Layout / touch | No horizontal overflow, clipped CTA, unreachable control, or unusable tap target | ☐ PASS / ☐ FAIL |
| 11 | Privacy page | `privacy.html` opens and is readable on the device | ☐ PASS / ☐ FAIL |
| 12 | PWA path, if tested | Install/add-to-home behavior does not block normal browser learning | ☐ PASS / ☐ FAIL / ☐ N/A |

## Optional local-first / cloud checks

Cloud sync is not required to pass the core beta gate because login is optional. If cloud is exercised, additionally confirm:

- learning remains usable before login
- Magic Link login does not erase local progress
- conflict resolution asks which version to keep rather than silently overwriting
- logout leaves local data available
- account deletion removes cloud data according to the current UI wording without pretending to delete unrelated local data automatically

Do not paste Magic Links, auth tokens, session contents, full JSON exports, or complete localStorage / IndexedDB contents into a public GitHub Issue.

## Immediate No-Go conditions

Do **not** invite external testers yet if any of the following occurs reproducibly on the physical device:

- app cannot reach Home
- first-run setup cannot be completed
- entered exam date is lost during normal human interaction
- today's plan cannot be generated or started
- reload loses newly saved setup/progress
- fatal recovery overlay appears under normal network conditions
- core controls are clipped/unreachable on the target phone
- existing learning data is unexpectedly destroyed or overwritten

A cosmetic issue that does not block learning can be logged for beta without automatically becoming a No-Go. Data-loss, startup, save, navigation, and first-learning blockers are No-Go.

## Result record

Copy this small block into a private note or the release discussion after the test:

```text
Physical beta gate: PASS / FAIL
Date:
Device family:
OS major version:
Browser + major version:
Production shown: v345 / other
Required checks: __ / 12 PASS (N/A: __)
Data-loss/startup blocker: yes / no
Notes:
```

Do not include email addresses, Magic Links, auth tokens, exported learning JSON, or other unnecessary personal data.

## Go decision

The physical-device gate is **PASS** when all applicable required learner-journey checks pass and there is no startup/save/data-loss blocker.

After PASS, the project may move to the deliberately small 10–30-person external beta described in `docs/BETA_MEASUREMENT_PLAN_v346.md`. External invitation remains a human product decision; CI must not auto-invite users.
