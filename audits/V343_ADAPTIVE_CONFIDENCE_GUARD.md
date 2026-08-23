# FE QUEST v343 — Adaptive evidence confidence guard

Result: **PASS — 38 / 38 ADAPTIVE-CONFIDENCE CASES PASS**

The first v343 precision change is schema-free and conservative. It reuses existing Subject A per-question reason/timing evidence, requires repeated/recent reason support for reason-specific prescriptions, requires measured timing plus weak accuracy to corroborate a single `時間不足` report, preserves repeated-error priority, and does not allow slow-but-correct timing alone to force speed practice.

Validated release simulation also preserves the 710-question bank, answer distribution `[178,178,177,177]`, cognitive distribution `[166,323,221]`, Subject B semantic checks, fresh first-run behavior, profile schema v5, runtime contract failure count 0, current contract 71/71, Browser UI contract 23, and inherited v342 cloud activation/runtime assets.

Production remains **v342** during this validation. v343 is materialized only in the validation simulation; `index.html`, `sw.js`, the v342 split assets, cloud runtime, and vendored Supabase SDK remain byte-untouched by this PR.
