# FE QUEST — IPA Ver.9.2 question v15 activation — 2026-09-13

## Verified protected import

The protected v15 batch was imported through the existing private `main + workflow_dispatch + GitHub OIDC` path and verified against production before public-safe activation work began.

- private repository: `taiwanwan64/fe-quest-private-source`
- private source/main commit: `ab0ac7b562a82707897f2e1243a6998746833633`
- content version: `ipa92-questions-v15`
- imported questions: **5**
- active protected question total after import: **1078**
- active protected lessons: **130**
- staging rows after finalization: **0**
- import manifest rows for v15: **1**
- payload SHA-256: `07b36e2ab421a355e360043c5b4bad934e3ea25253a26052a568e75d25ed9c61`
- source commit recorded by manifest: `ab0ac7b562a82707897f2e1243a6998746833633`
- imported at: `2026-09-13 11:15:11.741+00`
- import workflow run: `34753935502`
- workflow attempt: **1**
- workflow conclusion: **success**

The import Edge Function `fequest-ipa92-question-import-v15` keeps the established trust boundary: GitHub OIDC, private repository only, `refs/heads/main`, and `workflow_dispatch` only. It does not delete the protected question bank.

## Semantic-review decision

This batch is a narrow SR-P1 remediation after semantic review of the live 1073-question / 130-lesson corpus.

Representative direct-practice gaps were confirmed for AIOps, operations job scheduling, hot-aisle/cold-aisle layout, MDF, and Green IT. Existing operating-system CPU scheduling was not treated as equivalent to operations job scheduling: CPU scheduling allocates processor time among processes, while operations job scheduling controls business/batch job timing, dependencies, and execution conditions. Existing facility material already covers power, UPS, generation, air conditioning, and physical security, but did not provide these facility-specific decision rules directly.

All five questions are original FE QUEST content. Existing IDs and protected question bodies were not modified.

## Public-safe activation contract

The public repository may expose only safe metadata for these five IDs after the verified import. It must not contain stems, options, answers, explanations, hints, or choice explanations.

The v15 browser-provider target is:

- provider version: `v376-provider-12-ipa92-v1-v15`
- merged public catalog total: **1078**
- extension content versions: `ipa92-questions-v1` through `ipa92-questions-v15`
- public-safe extension metadata total: **174**
- merged Subject-A count: **884**
- tracked Subject-A count: **893**

Historical provider/catalog artifacts remain immutable. Historical readiness aliases may resolve to the latest provider so callers do not pin the browser runtime to an old catalog.

## Completion status

This activation supplies direct-practice evidence for the reviewed concepts, but it does **not** promote them or overall IPA Ver.9.2 coverage to `verified-covered`. Practice-density verification, required visual/interactive verification, iPhone-equivalent visual/touch/scroll QA, and learning-history/save-restore compatibility remain separate gates.
