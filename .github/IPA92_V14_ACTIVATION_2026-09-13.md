# FE QUEST — IPA Ver.9.2 question v14 activation — 2026-09-13

## Verified protected import

The protected v14 batch was imported through the existing private `main + workflow_dispatch + GitHub OIDC` path and then verified against production before public-safe activation work began.

- private repository: `taiwanwan64/fe-quest-private-source`
- private source/main commit: `5e559865621fbc810b8d3e3abd1b1db9625e304e`
- content version: `ipa92-questions-v14`
- imported questions: **4**
- active protected question total after import: **1073**
- active protected lessons: **130**
- staging rows after finalization: **0**
- import manifest rows for v14: **1**
- payload SHA-256: `97ae7336e982f4e6dace924c061556332d5a7a8ae3836a90d9b44f32d188669a`
- source commit recorded by manifest: `5e559865621fbc810b8d3e3abd1b1db9625e304e`
- imported at: `2026-09-13 10:40:59.46+00`
- import workflow run: `34752476889`
- workflow attempt: **1**
- workflow conclusion: **success**

The import Edge Function `fequest-ipa92-question-import-v14` keeps the established trust boundary: GitHub OIDC, private repository only, `refs/heads/main`, and `workflow_dispatch` only. It does not delete the protected question bank.

## Semantic-review decision

This batch is a narrow SR-P1 remediation after semantic review of the live 1069-question / 130-lesson corpus.

Direct-practice gaps were confirmed for PMO, WBS辞書, COCOMO, and CCB. Existing `core_14_03` lesson/practice already covers the role/responsibility-matrix semantics sufficiently for this review pass, so a separate RACI/responsibility-matrix question was deliberately not added merely to satisfy an exact-term checklist.

All four questions are original FE QUEST content. Existing IDs and protected question bodies were not modified.

## Public-safe activation contract

The public repository may expose only safe metadata for these four IDs after the verified import. It must not contain stems, options, answers, explanations, hints, or choice explanations.

The v14 browser-provider target is:

- provider version: `v376-provider-11-ipa92-v1-v14`
- merged public catalog total: **1073**
- extension content versions: `ipa92-questions-v1` through `ipa92-questions-v14`

Historical provider/catalog artifacts remain immutable. Historical readiness aliases may resolve to the latest provider so callers do not pin the browser runtime to an old catalog.

## Completion status

This activation supplies direct-practice evidence for the reviewed concepts, but it does **not** promote them or overall IPA Ver.9.2 coverage to `verified-covered`. Practice-density verification, required visual/interactive verification, iPhone-equivalent visual/touch/scroll QA, and learning-history/save-restore compatibility remain separate gates.
