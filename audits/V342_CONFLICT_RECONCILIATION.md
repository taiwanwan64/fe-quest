# FE QUEST v342 — Conflict lifecycle and explicit reconciliation validation

Result: **PASS — 16 / 16 CONFLICT / TWO-DEVICE SAFETY CASES PASS**

- first account link distinguishes no-remote, identical, fresh-local, and both-have-learning-data states
- a detected remote conflict persists even when the learner continues studying locally
- later local commits still coalesce to the newest outbox entry but do not erase the unresolved conflict
- `flush()` performs zero transport writes while a conflict is pending
- choosing local is explicit; when remote revision is higher/equal, the selected local snapshot must first receive a real atomic local revision above the remote before CAS rebasing
- choosing cloud is explicit; a recovery checkpoint must succeed before replacing learner data
- adopted cloud data is committed locally at a revision above the observed remote, queued, then rebased to that remote ancestry
- neither keep-local nor use-cloud automatically calls `flush()`; network upload remains a separate operation
- failed recovery or failed local replacement leaves conflict ancestry unresolved instead of pretending success
- explicit keep-local can recover from a known remote deletion by rebasing to a missing remote only after user choice
- the reconciliation layer remains transport-neutral and does not call learner persistence functions directly
- the v341 learning runtime is unchanged and reconciliation remains absent from the production shell

This closes the dangerous gap where a local save after a detected conflict could temporarily erase the conflict marker or repeated flushes could hammer the same unresolved remote state. Learner-facing conflict UI and exact production persistence callbacks remain to be wired before cloud activation.
