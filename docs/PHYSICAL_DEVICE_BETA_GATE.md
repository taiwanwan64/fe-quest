# FE QUEST — Physical Device Beta Gate

Status: **PASS — CLEARED 2026-08-25**  
Production target: `https://taiwanwan64.github.io/fe-quest/`  
Expected production version: **v345**  
Profile schema: **v5**  
Tracking issue: **#142 (completed)**

## Result

The operator reported that the complete physical-device acceptance path passed on 2026-08-25. This closes the one pre-beta gate that automated Chromium / Playwright WebKit testing could not honestly complete.

No device family, OS major version, or browser major version was supplied with the PASS report, so this document does **not** infer or invent those details after the fact.

```text
Physical beta gate: PASS
Date: 2026-08-25
Device family: not recorded
OS major version: not recorded
Browser + major version: not recorded
Required checks: 12 / 12 PASS
Data-loss/startup blocker: no blocker reported
```

## Completed learner journey

| # | Check | Expected result | Result |
|---|---|---|---|
| 1 | Open production | Home renders without a fatal recovery overlay | ✅ PASS |
| 2 | First-run setup | Exam-date and study-time controls are readable and usable | ✅ PASS |
| 3 | Enter future exam date | Value remains visible and no unexpected redraw erases it | ✅ PASS |
| 4 | Create today's plan | Ready state appears with at least one task | ✅ PASS |
| 5 | Start first learning task | The app leaves Home and opens the intended learning screen | ✅ PASS |
| 6 | Return Home | Navigation works without losing the saved setup | ✅ PASS |
| 7 | Start diagnostic | First diagnostic question and answer choices render normally | ✅ PASS |
| 8 | Reload production | Saved first-run settings remain; onboarding is not incorrectly reset | ✅ PASS |
| 9 | Today's learning | The main CTA clearly communicates the next action | ✅ PASS |
| 10 | Layout / touch | No horizontal overflow, clipped CTA, unreachable control, or unusable tap target | ✅ PASS |
| 11 | Privacy page | `privacy.html` opens and is readable on the device | ✅ PASS |
| 12 | PWA path | Install/add-to-home behavior does not block normal browser learning | ✅ PASS |

## Why this is meaningful

v348 had already cleared the automated production-browser gate in desktop Chromium and mobile-sized Playwright WebKit. That automated result was intentionally **not** treated as proof of a real physical-device browser pass. The 2026-08-25 operator report supplies that missing human acceptance step.

## Beta decision

**GO for the deliberately small 10–30-person external beta.**

Next operational tracker: **Issue #143 — External beta cohort 1: 10–30 learner validation**.

Use:

- `docs/EXTERNAL_BETA_ROLLOUT_PLAYBOOK.md`
- `docs/BETA_MEASUREMENT_PLAN_v346.md`
- `docs/BETA_FEEDBACK_LOG_TEMPLATE.md`

The first few learners should be observed before expanding toward the full 10–30-person cohort. A reproducible startup, save, data-loss, today-plan, or core-navigation blocker remains a reason to pause new invitations immediately.

## Privacy / data safety

Do not record email addresses, Magic Links, auth tokens, session contents, full JSON exports, or complete localStorage / IndexedDB contents in public GitHub issues. Tester identity/contact information must remain outside the public repository; use pseudonymous codes such as `B01` when a tracker is needed.
