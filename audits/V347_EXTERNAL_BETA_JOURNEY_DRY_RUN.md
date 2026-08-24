# FE QUEST v347 — External beta learner journey dry run

Date: 2026-08-24  
Production baseline: **v345**  
Result: **PASS — 51 / 51 checks**

## Purpose

v346 cleared the preparation gates for a small external beta: current privacy information, a structured beta-feedback route, and a minimal-consent measurement plan are present. v347 checks the next question before inviting anyone: **does the current production product still connect the intended learner journey from first open to the next useful study action without weakening data safety?**

This remains an audit/operations step. It does not change question content, adaptive planning, profile schema, cloud synchronization behavior, or the production version.

## Journey verified

### 1. Fresh first run

The production v345 contract still:

- identifies a learner with no history and no exam date as needing setup;
- requires an exam date and rejects a past date;
- stores the selected daily study minutes;
- enables the existing auto-pace contract;
- requires `saveProfile()` to succeed before presenting the ready state;
- creates the current-day plan snapshot through the existing scheduler;
- presents the generated plan rather than inventing a separate onboarding-only plan.

The runtime smoke confirmed that a genuinely fresh profile requires first-run setup, while setting a valid future exam date clears that gate.

### 2. Diagnostic handoff

The home diagnostic CTA still starts the diagnostic flow. More importantly, completing the diagnostic returns to home and triggers the existing `todayResumeBtn`, so the learner is handed directly into the highest-priority unfinished item rather than being left on a results dead end.

### 3. Today's learning

The home CTA and right-side continuation route both select the first unfinished task from the same daily plan and delegate to `launchDailyTask()`.

A fresh runtime plan produced **4 tasks** with the current types:

1. `review`
2. `lesson`
3. `subjectB`
4. `boss`

This is valuable evidence for the beta because it proves the daily plan is not merely a Subject A shortcut; it already joins review, lesson progression, Subject B, and final confirmation in one guided route.

### 4. Results and learning outcomes

The audit confirmed:

- the recent learning report remains present;
- the v345 exam-date-aware pace row reuses the existing `examPaceStatus()` contract;
- exam pace explicitly remains **not pass probability**;
- Subject B result screens retain their primary “next Subject B” route;
- the Subject A mock result keeps review of wrong/flagged items as the primary action.

Runtime Subject B semantic validation also remains green.

### 5. Data safety and beta operations

The external-beta path still preserves the v342+ safety model:

- login is optional;
- local learning works without cloud sync;
- sync conflicts require an explicit local/cloud choice rather than silent overwrite;
- account deletion is learner-facing;
- `privacy.html` reflects the current v345 baseline and warns against sharing authentication/export data in public Issues;
- the beta feedback template asks for reproducible environment/impact information without requesting sensitive dumps;
- the measurement plan keeps the first cohort manual/minimal-consent-first and does not add silent analytics.

The production shell/app also contains none of the common third-party analytics endpoints checked by this audit.

## Runtime regression result

- Production app version: **v345**
- Profile schema: **v5**
- Fresh first-run gate: PASS
- Future exam date clears first-run gate: PASS
- Fresh daily plan task count: **4**
- Subject B semantic validation: PASS
- Current Contract: **71 / 71**
- Browser UI Contract: **23 / 23**
- Runtime contract failures: **0**

## Operational dry-run guide

`docs/EXTERNAL_BETA_DRY_RUN_v347.md` now defines the human browser pass to perform immediately before invitations:

**first run → diagnostic → today plan → routine continuation → learning outcomes → optional cloud sync → feedback-report dry run**

It also gives the production/privacy destinations and repeats the rule that public Issues must not contain email addresses, Magic Links, tokens, JSON exports, or storage dumps.

## Decision

**The code-level and operational beta journey gate is clear.**

This does not automatically start the beta. The remaining action before inviting external testers is one real-browser dry run on the production site using the v347 guide. If that human pass finds no device/browser-specific issue, a 10–30 person cohort can be started without first adding another learner-facing feature or analytics stack.

## Evidence

- Audit entry point: `.github/v347/audit_beta_journey.py`
- Regression fixture: `_regression/v347-beta-journey-dry-run.fixture.json`
- CI workflow: `.github/workflows/v347-beta-journey-dry-run.yml`
- Operator guide: `docs/EXTERNAL_BETA_DRY_RUN_v347.md`
