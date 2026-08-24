# FE QUEST v346 — External beta readiness audit

Date: 2026-08-24  
Production baseline: **v345**  
Result: **READY FOR PREPARATION / NOT YET READY TO INVITE EXTERNAL TESTERS**

## Why this audit comes next

The production app has reached v345 with the recent-learning report and exam-date-aware pace presentation already released. The roadmap's next phase is a small external beta rather than another large learner-facing feature. Before inviting people outside the developer's own devices, this audit checks whether the existing account/cloud/recovery foundation is safe enough and identifies the smallest remaining beta-preparation work.

This is intentionally an **audit-only** step. It does not change learner data, profile schema, question content, adaptive planning, cloud synchronization behavior, or the production version.

## Baseline confirmed

The automated audit locks the following current contracts:

- Production root and Service Worker are v345.
- Profile schema remains v5.
- The v345 exam-pace presentation is materialized in production and keeps the explicit "not pass probability" wording.
- Supabase browser configuration is enabled through an HTTPS endpoint and uses the publishable key contract rather than a service-role assignment.
- Magic Link redirects to the canonical GitHub Pages production root.
- Cloud sync remains optional and local-first; signing in is not required to continue learning.
- Sync conflicts continue to require an explicit learner choice instead of silently overwriting newer local progress.
- Learner-facing account deletion is present and states that cloud learning data is deleted while local learning data remains.

These are important because the first external beta should not weaken the data-protection work already completed in v342-v345.

## Remaining items before external invitations

### 1. Public privacy / beta-use information — must fix before invite

No public privacy-policy / beta-use document was found at the audited repository paths.

Because the beta can use email Magic Link authentication and cloud learning-data synchronization, external testers need a clear public explanation of at least:

- what data FE QUEST stores locally and in the cloud;
- why the data is used;
- whether optional beta measurement is collected;
- how cloud sync can be disabled;
- how an account and cloud data can be deleted;
- how a tester can ask a privacy or support question.

This should be written before invitations rather than inferred from implementation comments.

### 2. Explicit beta feedback / bug-report route — must fix before invite

No dedicated beta feedback/support file or issue template was found at the audited paths.

For a 10-30 person beta, the feedback route should make it easy to report:

- what the tester was trying to do;
- app version and broad environment;
- what happened vs. what was expected;
- whether the problem affected learning-data persistence or cloud sync.

Do **not** ask testers to paste raw exported learning data, authentication tokens, email addresses, or full localStorage contents into public reports.

### 3. Beta measurement plan — design before invite

The roadmap proposes observing day 1 / 3 / 7 / 30 continuation, use of the automatically generated daily plan, and whether FE QUEST reduced the need to decide what to study next.

The current audit deliberately does **not** add third-party analytics or silent tracking. Before measurement is implemented, decide the minimum data needed and how consent/notice will work. For the first 10-30 testers, a lightweight manual or explicitly opted-in approach is preferable to introducing a new analytics stack simply to obtain early signals.

## Recommended next implementation order

1. Add a public privacy / beta-use page that accurately reflects the current local-first + optional-cloud behavior.
2. Add a dedicated beta feedback route and a safe diagnostic-information format that excludes learning content and account secrets.
3. Define the minimum beta metrics and consent model; only then decide whether product analytics code is necessary.
4. Re-run the v346 readiness audit and invite a small external cohort only after the must-fix items are cleared.

## What not to change in this phase

- Do not add a paywall merely because the old roadmap mentioned a Premium pilot.
- Do not alter the 710-question bank or Subject B semantics for beta-readiness work.
- Do not migrate profile schema unless a concrete beta requirement cannot be met without it.
- Do not make cloud sync mandatory.
- Do not weaken Recovery Center / JSON export / local-first persistence in order to simplify beta support.
- Do not add silent third-party tracking before the privacy/measurement design is explicit.

## Automation

CI entry point: `.github/v346/audit_external_beta_readiness.py`  
Regression fixture: `_regression/v346-external-beta-readiness.fixture.json`  
Workflow: `.github/workflows/v346-external-beta-readiness.yml`

The audit currently records 12 production/baseline checks and 3 beta-readiness items. A passing audit means the repository state matches this assessment; it does **not** mean external invitations are approved yet.
