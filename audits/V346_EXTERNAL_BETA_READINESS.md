# FE QUEST v346 — External beta preparation readiness

Date: 2026-08-24  
Production baseline: **v345**  
Result: **BETA PREPARATION GATES CLEARED**

External invitations remain a manual go/no-go decision. This milestone prepares the repository for a small external beta without changing learner behavior or adding silent analytics.

## Why this comes next

Production is v345 with the recent-learning report and exam-date-aware pace presentation already released. The roadmap's next practical phase is a small external beta rather than another large learner-facing feature or an immediate paywall.

This v346 work therefore focuses on the minimum safety and feedback foundation needed before inviting 10–30 people.

## Production baseline confirmed

The automated audit locks these current contracts:

- Production root and Service Worker remain v345.
- Profile schema remains v5.
- The v345 exam-pace presentation is materialized and retains the explicit "not pass probability" wording.
- Supabase browser configuration is enabled through an HTTPS endpoint and uses a publishable key rather than a service-role assignment.
- Magic Link redirects to the canonical GitHub Pages production root.
- Cloud sync remains optional and local-first; signing in is not required to continue learning.
- Sync conflicts require an explicit learner choice instead of silently overwriting progress.
- Learner-facing account deletion remains available and deletes cloud learning data while preserving local learning data.

## Beta-preparation work completed

### 1. Privacy policy refreshed for the current production baseline

An existing `privacy.html` was present and already described the local-first and optional-cloud design. Its footer still referred to the pre-v342 cloud-enablement stage, so it was refreshed to the current v345 production baseline.

The policy now also warns users not to place email addresses, authentication tokens, or full JSON exports in public GitHub Issues. It continues to state that FE QUEST does not currently include a third-party behavior-analytics SDK.

### 2. Structured beta feedback route added

`.github/ISSUE_TEMPLATE/beta-feedback.md` gives testers a consistent way to report:

- what they were trying to do;
- actual vs. expected behavior;
- reproduction steps;
- broad device/browser/PWA information;
- whether learning-data persistence or cloud sync may have been affected.

The template explicitly warns against posting Magic Links, authentication tokens, Supabase sessions, full JSON exports, or full localStorage/IndexedDB contents in a public issue.

### 3. Minimal-consent beta measurement plan defined

`docs/BETA_MEASUREMENT_PLAN_v346.md` defines the first 10–30 tester evaluation without adding automatic product analytics.

The first cohort will focus on:

- day 1 / 3 / 7 / 30 continuation using a small manual beta-management record;
- whether learners actually start from "今日の学習";
- whether FE QUEST reduces the burden of deciding what to study next;
- early friction in first-run setup, outcome/pace presentation, Subject B navigation, persistence, recovery, and cloud sync.

Question-level learning history, raw JSON exports, browser-storage dumps, authentication data, and other unnecessary personal information are excluded from the beta-management record.

If automated analytics becomes necessary later, the event fields, storage, retention, deletion, notice/consent, and privacy-policy update must be defined before implementation.

## Automated gate

The v346 audit now covers **24 checks** across production versioning, profile schema, cloud configuration, local-first conflict/deletion behavior, privacy wording, beta feedback safety, and the minimal measurement plan.

Expected result:

- 24 / 24 checks pass
- 0 open beta-preparation blockers
- production remains v345
- profile schema remains v5

A green CI result means the repository matches this preparation contract. It does not automatically authorize inviting testers.

## Remaining human gates before invitations

1. Read `privacy.html` and the beta measurement document once as a prospective tester and confirm the wording is understandable.
2. Dry-run the beta feedback Issue template with a harmless sample report and confirm it asks for enough information without requesting sensitive data.
3. Reconfirm the existing production regressions and cloud-sync path are healthy.
4. Only then invite a small 10–30 person cohort and keep the first beta deliberately narrow.

## What this phase does not change

- No paywall or Premium gate is added.
- No question-bank or Subject B semantic content is changed.
- No adaptive-planning behavior is changed.
- No profile-schema migration is introduced.
- Cloud sync is not made mandatory.
- Recovery Center, JSON export, and local-first persistence are not weakened.
- No third-party analytics or silent behavioral tracking is added.
- Production assets remain v345; v346 is a beta-preparation milestone, not a learner-runtime release.

## Automation

CI entry point: `.github/v346/audit_external_beta_readiness.py`  
Regression fixture: `_regression/v346-external-beta-readiness.fixture.json`  
Workflow: `.github/workflows/v346-external-beta-readiness.yml`
