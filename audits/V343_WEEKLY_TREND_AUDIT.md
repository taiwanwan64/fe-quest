# FE QUEST v343 — Weekly trend weighting audit

Result: **PASS — audit completed; do not add weekly trend weighting to v343**

The current v343 bundle can build a dated attempt stream from `profile.sessions[].log` and `profile.mockHistory[].details`, but ordinary runtime writes keep only 20 quiz sessions, only the first 10 attempt rows per saved quiz session, and 10 mock histories. `qStats` retains aggregates and latest dates/reasons rather than a reconstructable dated attempt history.

Because an active learner can consume 20 quiz sessions in fewer than 14 calendar days, a fixed “last 7 days vs previous 7 days” comparison is not guaranteed to contain the complete earlier window. Using that incomplete stream to change today's learning weights could incorrectly label improvement or slowdown.

Decision: **do not change learner behavior, profile schema, or retention solely to finish this v343 candidate.** Keep the v343 evidence-confidence guard as the final learner-facing precision improvement. For v344, weekly reporting should either describe explicitly bounded “recent recorded sessions” or introduce a deliberate rolling aggregate only after schema/migration review.

Production v343 assets were byte-untouched by this audit.
