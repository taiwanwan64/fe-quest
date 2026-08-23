# FE QUEST v343 — Adaptive evidence discovery

Result: **PASS — existing v342 evidence is sufficient for a schema-free first precision upgrade**

## What the production v342 bundle already records

Subject A question stats already carry attempts/correct, `lastReason`, memory stability/lapses, recovery state, and response-time aggregates (`avgSeconds`, `timedAnswers`). Normal practice measures the first-answer seconds and writes them through the existing memory update path. Subject A mock also stores per-question seconds in attempt details. Therefore v343 does not need a profile schema migration merely to combine mistake reason and answer time.

The current memory scheduler already uses time conservatively: correct-answer stability growth is adjusted by response speed, while `2択で迷った` and `時間不足` reduce the growth factor. Recovered second attempts are tracked separately and do not inflate first-attempt accuracy.

## Existing adaptive hooks

Subject A `categoryAnalytics` already combines mastery, accuracy, cognitive weakness, mock mistakes, time, and repeated errors. Its current priority mix is 34% mastery risk, 18% accuracy risk, 20% cognitive risk, 10% mock risk, 6% time risk, and 12% repeat risk. `recommendedPrescription` maps the dominant mistake reason to knowledge/calculation/reading/contrast/speed/repeat practice, and `buildTodayTasks` already consumes that prescription.

The main precision gap is not missing raw evidence. It is evidence confidence: the dominant Subject A reason is largely based on each question's most recent `lastReason`, the normalized attempt stream omits seconds/reason, and there is no explicit minimum-sample gate before reason/time signals can alter the prescription.

## Subject B precedent

The existing v254/v257 Subject B local-adaptive path is a useful safety model. It persists `elapsedMs`, computes recent accuracy and median response time by layer, requires minimum sample counts and a uniquely weak layer, and only changes the recommendation below an accuracy threshold. Response time is supporting evidence rather than a sole trigger.

## v343 implementation direction

The first v343 behavior change should therefore remain schema-free and conservative:

- reuse existing Subject A timing, reason, memory, session, and mock evidence;
- require enough recent evidence before a reason/time signal changes the recommended prescription;
- keep accuracy and repeated mistakes primary;
- do not turn a merely slow-but-correct learner into a speed prescription without corroborating evidence;
- use recent/repeated reason evidence instead of treating one stale `lastReason` as equally strong;
- preserve the existing `recommendedPrescription` → `buildTodayTasks` integration so the visible daily-plan architecture does not change.

## Safety boundary

This discovery PR changes no learner-facing behavior, profile schema, question content, cloud-sync semantics, production v342 assets, or Service Worker. It only adds audit tooling/evidence for the next v343 implementation step.
