# FE QUEST — IPA Ver.9.2 P0/P1 source-readiness audit — 2026-09-13

## Purpose

This is a safe-metadata audit of the currently registered P0/P1 items in `.github/ipa92-coverage.json` against the protected original-question batches and public interactive labs. It intentionally does **not** contain protected question stems, options, answers, explanations, or private lesson bodies.

`source-ready` in this document means that an appropriate lesson/practice/interactive source now exists in the repository set. It does **not** mean production import, mobile QA, learner-history compatibility, or the final `verified-covered` gate has completed.

## P0 readiness

| Coverage item | Current source evidence | Readiness note |
| --- | --- | --- |
| FE92-THEORY-SET-VENN | baseline set/logic practice + public Venn touch lab | source-ready; mobile touch QA still required |
| FE92-THEORY-PREDICATE-LOGIC | protected question batch v1 | source-ready; production v1 already active |
| FE92-THEORY-FORMAL-LANGUAGE | protected question batch v1 | source-ready; production v1 already active |
| FE92-MATH-MARKOV | protected question batch v1 | source-ready; production v1 already active |
| FE92-MATH-HYPOTHESIS-TEST | protected question batch v1 | source-ready; production v1 already active |
| FE92-MATH-GRAPH-THEORY | protected question batch v1 + public graph lab | source-ready; mobile touch QA still required |
| FE92-AI-SVM-PCA | protected question batch v2 | source-ready; production import pending |
| FE92-AI-CNN-RNN | protected question batch v2 | source-ready; production import pending |
| FE92-AI-FOUNDATION-LLM | protected question batch v2 | source-ready; production import pending |
| FE92-AI-PROMPT-ENGINEERING | protected question batch v2 | source-ready; production import pending |
| FE92-COMMS-MODULATION | protected question batch v2 | source-ready; production import pending |
| FE92-COMMS-SYNCHRONIZATION | protected question batch v2 | source-ready; production import pending |
| FE92-ALGO-MERGE-SORT | protected question batch v6 + public sort lab | source-ready; production import and mobile touch QA pending |
| FE92-ALGO-INSERTION-SORT | protected question batch v6 + public sort lab | source-ready; production import and mobile touch QA pending |
| FE92-ALGO-SHELL-SORT | protected question batch v6 + public sort lab | source-ready; production import and mobile touch QA pending |
| FE92-ALGO-HEAP-SORT | protected question batch v6 + public sort lab | source-ready; production import and mobile touch QA pending |
| FE92-ALGO-STRING-MATCH | protected question batch v6 | source-ready; production import pending |
| FE92-ALGO-CONTROL-BREAK | protected question batch v6 | source-ready; production import pending |
| FE92-ALGO-DECISION-TABLE | protected question batch v6 | source-ready; production import pending |
| FE92-PROG-CODING-STANDARD | protected question batch v6 | source-ready; production import pending |
| FE92-PROG-WEB | protected question batch v6 | source-ready; production import pending |
| FE92-PROG-BNF | protected question batch v1 (`BNF` practice is already present) | source-ready; do not add a duplicate batch solely for this item |

## P1 readiness

| Coverage item | Current source evidence | Readiness note |
| --- | --- | --- |
| FE92-MATH-NUMERICAL | protected question batch v5 | source-ready; production import pending |
| FE92-MATH-LINEAR-PROGRAMMING | protected question batch v5 | source-ready; production import pending |
| FE92-COMMS-MULTIPLEXING | protected question batch v2 | source-ready; production import pending |
| FE92-DESIGN-UML-DFD-ER | protected question batch v3 + public modeling lab | source-ready; production import and mobile touch QA pending |
| FE92-DB-DISTRIBUTED-2PC | protected question batch v3 | source-ready; production import pending |
| FE92-COMPUTER-GPU-PARALLEL | protected question batch v3 | source-ready; production import pending |
| FE92-MEMORY-TLB-REPLACEMENT | protected question batch v3 + public memory lab | source-ready; production import and mobile touch QA pending |
| FE92-NETWORK-SDN | protected question batch v4 | source-ready; production import pending |
| FE92-SEC-OAUTH-OIDC | protected question batch v4 | source-ready; production import pending |
| FE92-SERVICE-RTO-RPO | protected question batch v4 | source-ready; production import pending |
| FE92-RELIABILITY-FAILSAFE | protected question batch v4 | source-ready; production import pending |
| FE92-BUSINESS-EOQ | protected question batch v5 | source-ready; production import pending |
| FE92-DEV-REFACTOR-REVIEW | protected question batch v5 | source-ready; production import pending |
| FE92-CONTROL-PWM | protected question batch v5 | source-ready; production import pending |
| FE92-DESIGN-OOP-SOLID-DDD | protected question batch v5 | source-ready; production import pending |

## Audit conclusion

For every P0/P1 item currently registered in the partial coverage manifest, the repository set now has a plausible lesson/practice source, and all items that explicitly require a public interactive lab have an implementation source or existing baseline implementation. Therefore, the next efficient step is **not** to keep adding broad P0/P1 question batches blindly.

The blockers to final coverage are now chiefly operational and verification-oriented:

1. Import protected question batches v2 → v3 → v4 → v5 → v6 through the existing private `main` + `workflow_dispatch` + GitHub OIDC path and verify counts/manifests/hashes after each batch.
2. Import the current protected lesson overlays through the existing manual protected-lessons workflow and verify the 130-lesson materialization and manifest.
3. Add public safe question metadata/runtime entries only after the corresponding protected batch is confirmed active in production.
4. Perform iPhone-equivalent visual/touch/scroll QA for the Venn, sorting, graph, modeling, and memory labs before promoting interactive items to `verified-covered`.
5. Expand the official Ver.9.2 inventory below the current partial-baseline level. A newly registered fine-grained item may still reveal a real lesson or practice gap; handle those as small, independent additions instead of assuming the current P0/P1 list is the complete syllabus.

## Safety conclusions

- Do not change current `in-progress` statuses merely because source files exist.
- Do not publish protected question bodies in the public repository.
- Do not bypass `workflow_dispatch` or OIDC to make the pending batches appear live.
- Do not add duplicate BNF or other questions just because an older coverage note says the baseline was weak; re-check v1-v6 first.
- Treat the official IPA Ver.9.2 inventory, production import state, and completion gates as separate axes. Source-ready is only one of them.
