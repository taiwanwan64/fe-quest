# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-13 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main: `e2e1e4bd8b85bdcac922698c6f196fc9d034ee8f`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `17fa3f92a8a569c7500794f4fe0b32b33caa6c53`
- active protected questions: **1055**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 v1–v6 83 + v7 16 + v8 16 + v9 12 + v10 16 + v11 8 = **1055**
- PWA cache remains `fe-quest-v377-12`

Latest protected imports were performed through the existing `private main + workflow_dispatch + GitHub OIDC` path and verified in production.

### Question batch v10

- content version: `ipa92-questions-v10`
- active count: 16
- source commit: `d1d52cd8bd51150edf72b65a5fc58c7e486c005a`
- payload SHA-256: `b1323e475a79040c9239a668dcc7ce3f0239b018721980a464fd8d4316bc46c4`
- production total after import: **1047**
- public-safe activation: PR #44

### Question batch v11

- content version: `ipa92-questions-v11`
- active count: 8
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `17fa3f92a8a569c7500794f4fe0b32b33caa6c53`
- payload SHA-256: `82fc0e3dc890a16ab3a3af8cca6185e864a6366f7cfc719d4bbd04cfa0931018`
- imported at: `2026-09-13 08:28:27.356+00`
- import workflow run: `34747639449`, attempt 2 — success
- production total after import: **1055**
- public-safe activation: PR #46, merge commit `e2e1e4bd8b85bdcac922698c6f196fc9d034ee8f`

The first v11 import attempt failed before staging because the v11 import Edge Function did not yet exist. `fequest-ipa92-question-import-v11` was then deployed with the same GitHub OIDC trust boundary as prior batches and the failed workflow was rerun successfully. Production staging is clean and no failed-attempt rows remain.

Protected stems/options/answers/explanations/hints remain private. The public repository contains only safe metadata and the browser provider contract.

## Pages / CI state

PR #46 passed the current latest-provider and publication checks before merge:

- `Validate IPA 9.2 question v11 public activation`
- `Validate sanitized FE QUEST publication`

The v10 validator was converted to an immutable historical-artifact check during the v11 activation, matching the existing v7/v8/v9 pattern. Historical validators no longer treat an older provider as the latest runtime.

Post-merge Pages run #62 (`34748125505`) completed successfully for main `e2e1e4bd...`.

The latest provider contract is:

- provider version: `v376-provider-8-ipa92-v1-v11`
- merged catalog total: **1055**
- extension content versions: v1 through v11
- historical v7/v8/v9/v10 readiness aliases resolve to the latest provider

## Official IPA Ver.9.2 inventory milestone

Authority:

- IPA 基本情報技術者試験シラバス Ver.9.2
- published 2026-01-08
- official structure: 9 large classifications / 23 middle classifications / 96 small classifications

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. The ledgers deliberately distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are **not** final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

Broader neighboring concepts that were already semantically covered were not duplicated merely because an exact official term was missing.

### v8 remediation

- SLI / SLO
- service request / known error
- SaaS / PaaS / IaaS and cloud deployment models
- XAI / HITL / hallucination
- anonymized / pseudonymized information
- 中小受託取引適正化法

### v9 remediation

- ITIL / JIS Q 20000
- CAB / PIR
- DevOps / DevSecOps / TDD / SRE / MLOps
- GDPR / JIS Q 15001 / 電子署名法

### v10 remediation

- WCAG / responsive Web design / heuristic evaluation / usability testing
- three-schema architecture
- key-value / document-oriented NoSQL
- CSMA/CD / CSMA/CA / spanning tree
- RADIUS / QoS
- secure boot
- stub / condition coverage

Boundary-value analysis and equivalence partitioning were deliberately not duplicated in v10 because current production already had direct semantic practice under `境界値分析` and `同値分割`.

### v11 remediation

- 情報流通プラットフォーム対処法 / 発信者情報
- cloud-native / cloud-by-default
- test driver and stub/driver distinction

The reduced SR-P0 remainder explicitly named after v10 has now been semantically reviewed and, where a genuine direct-practice gap was confirmed, remediated by v11.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Large-classification traversal and the targeted P0 remediation sequence are complete, but **full coverage is not yet verified**. The following remain open:

- semantic review of remaining zero/mixed/lesson-only findings outside the completed targeted P0 bundle
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Continue semantic review of the remaining zero/mixed/lesson-only evidence-ledger findings, prioritizing exam-relevant concepts with weak direct-practice evidence.
2. Do not create new questions from exact-term misses alone; inspect current protected questions and lesson payloads semantically first.
3. Begin practice-density verification for classifications whose direct conceptual coverage is already strong, separating breadth coverage from enough repetition to learn reliably.
4. Expand mobile/touch/iPhone-equivalent QA and verify required interactive/visual learning paths without weakening non-interactive fallbacks.
5. Verify learning-history and save/restore compatibility across the enlarged 1055-question catalog before any coverage-complete promotion.

## Safety rules

- GitHub/Supabase current state is always the source of truth.
- Keep question/material/paywall logic behind the private/protected boundary.
- Never publish protected stems, options, answers, explanations, hints or choice explanations.
- Do not copy copyrighted proprietary questions; new questions are original unless they are public official past questions handled under the project policy.
- Preserve existing IDs, answers, learner history, and save/restore contracts.
- Never weaken the `private main + workflow_dispatch + GitHub OIDC` import boundary.
- Keep `implemented`, `imported`, `deployed`, `source-covered`, and `verified-covered` as separate states.
