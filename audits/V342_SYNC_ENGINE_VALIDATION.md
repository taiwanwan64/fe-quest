# FE QUEST v342 — Local-first sync engine validation

Result: **PASS — POST-LOCAL-COMMIT OUTBOX AND EXPLICIT FLUSH KEEP CLOUD OUTSIDE THE ATOMIC SAVE PATH**

- deterministic engine cases: **12 / 12 PASS**
- sync remains disabled until an authenticated user explicitly enables it
- `queueAfterLocalCommit()` is synchronous and performs no network request
- `flush()` is separate, single-flight, and can be retried independently of local saving
- offline/provider failures keep the newest pending local commit
- remote conflicts keep pending data and record explicit reconciliation metadata
- account mismatch blocks all transport activity
- a newer committed local profile replaces a stale pending descriptor while retaining the last successful remote base
- unexpected transport throws are contained as retryable sync errors
- pending sync metadata survives engine recreation
- disabling sync clears only sync metadata and does not touch learner data
- production v341 shell remains unchanged and does not load the engine

The remaining production integration work is to obtain the exact committed-profile descriptor after the existing local save succeeds, add an authenticated Supabase session boundary, and expose explicit enable/conflict UI before activating v342 cloud sync.
