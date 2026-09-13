# FE QUEST — IPA Ver.9.2 question v13 activation — 2026-09-13

## Verified protected import

The protected v13 batch was imported through the existing private `main + workflow_dispatch + GitHub OIDC` path and then verified against production before public-safe activation work began.

- private repository: `taiwanwan64/fe-quest-private-source`
- private source/main commit: `a8251780b473afb8ea635651c7324d37eb3790c3`
- content version: `ipa92-questions-v13`
- imported questions: **6**
- active protected question total after import: **1069**
- active protected lessons: **130**
- staging rows after finalization: **0**
- import manifest rows for v13: **1**
- payload SHA-256: `102ccee76eb57f24e5ed970abbcf167cb16dc8714ba4cc4f6b16f771ebf80bad`
- source commit recorded by manifest: `a8251780b473afb8ea635651c7324d37eb3790c3`
- imported at: `2026-09-13 10:11:03.808+00`
- import workflow run: `34751177331`
- workflow attempt: **1**
- workflow conclusion: **success**

The import Edge Function `fequest-ipa92-question-import-v13` keeps the established trust boundary: GitHub OIDC, private repository only, `refs/heads/main`, and `workflow_dispatch` only. It does not delete the protected question bank.

## Semantic-review decision

This batch is the next narrow SR-P1 remediation after semantic review of the live 1063-question / 130-lesson corpus.

Direct-practice gaps were confirmed for:

- low-code development
- no-code development
- pair programming
- mob programming
- KPT
- YAGNI

Existing production already had strong neighboring coverage for agile development, Scrum, DevOps, DevSecOps, TDD, SRE, MLOps, prototyping, and general development-model selection. Therefore the batch deliberately adds only one representative original question for each confirmed missing concept instead of broad one-question-per-term expansion beyond the reviewed gaps.

All six questions are original FE QUEST content. Existing IDs and protected question bodies were not modified.

## Public-safe activation contract

The public repository may expose only safe metadata for these six IDs after the verified import. It must not contain stems, options, answers, explanations, hints, or choice explanations.

The v13 browser-provider target is:

- provider version: `v376-provider-10-ipa92-v1-v13`
- merged public catalog total: **1069**
- extension content versions: `ipa92-questions-v1` through `ipa92-questions-v13`

Historical provider/catalog artifacts remain immutable. Historical readiness aliases may resolve to the latest provider so callers do not pin the browser runtime to an old catalog.

## Completion status

This activation supplies direct-practice evidence for the reviewed concepts, but it does **not** promote them or overall IPA Ver.9.2 coverage to `verified-covered`. Practice-density verification, required visual/interactive verification, iPhone-equivalent visual/touch/scroll QA, and learning-history/save-restore compatibility remain separate gates.
