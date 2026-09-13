# FE QUEST — IPA Ver.9.2 question v12 activation — 2026-09-13

## Verified protected import

The protected v12 batch was imported through the existing private `main + workflow_dispatch + GitHub OIDC` path and then verified against production before any public-safe activation work began.

- private repository: `taiwanwan64/fe-quest-private-source`
- private source/main commit: `e3920bb8178c7d85518c988d547776b9760fa410`
- content version: `ipa92-questions-v12`
- imported questions: **8**
- active protected question total after import: **1063**
- active protected lessons: **130**
- staging rows after finalization: **0**
- import manifest rows for v12: **1**
- payload SHA-256: `736d2202b9ba1499975588ce33a1d906e8ffba640227de5707a51639670c3a82`
- source commit recorded by manifest: `e3920bb8178c7d85518c988d547776b9760fa410`
- imported at: `2026-09-13 09:40:20.152+00`
- import workflow run: `34749958968`
- workflow attempt: **1**
- workflow conclusion: **success**

The import Edge Function `fequest-ipa92-question-import-v12` keeps the same trust boundary as earlier batches: GitHub OIDC, private repository only, `refs/heads/main`, and `workflow_dispatch` only. It does not delete the protected question bank.

## Semantic-review decision

This batch is a narrow SR-P1 remediation after semantic review of the live 1055-question / 130-lesson corpus.

Added direct practice:

- SysML and its relationship to UML
- user stories and acceptance criteria
- UML use-case diagrams
- mockups
- prototyping
- mockup/prototype distinction

Bidirectional traceability was reviewed but deliberately not duplicated: existing lessons and direct practice already teach tracing requirements through design and testing semantically even where the exact official phrase is absent.

All eight questions are original FE QUEST content. Existing IDs and protected question bodies were not modified.

## Public-safe activation contract

The public repository may expose only safe metadata for these eight IDs after this verified import. It must not contain stems, options, answers, explanations, hints, or choice explanations.

The v12 browser-provider target is:

- provider version: `v376-provider-9-ipa92-v1-v12`
- merged public catalog total: **1063**
- extension content versions: `ipa92-questions-v1` through `ipa92-questions-v12`

Historical provider/catalog artifacts remain immutable. Historical readiness aliases may resolve to the latest provider so callers do not pin the browser runtime to an old catalog.

## Completion status

This activation supplies direct-practice evidence for the reviewed concepts, but it does **not** promote them or the overall IPA Ver.9.2 coverage to `verified-covered`. Practice density, required visual/interactive behavior, iPhone-equivalent QA, and learning-history/save-restore compatibility remain separate gates.
