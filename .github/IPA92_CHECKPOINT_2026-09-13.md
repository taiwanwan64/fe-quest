# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-13 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main: `1e4acb5a41f95b549722990417b423c1d72b6963`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `d1d52cd8bd51150edf72b65a5fc58c7e486c005a`
- active protected questions: **1047**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 v1–v6 83 + v7 16 + v8 16 + v9 12 + v10 16 = **1047**
- PWA cache remains `fe-quest-v377-12`

Latest protected imports were performed through the existing `private main + workflow_dispatch + GitHub OIDC` path and verified in production.

### Question batch v9

- content version: `ipa92-questions-v9`
- active count: 12
- source commit: `e3cc83a1f0f92404f361d49e32089c5ca22f3da3`
- payload SHA-256: `64618ca447addac7bd1482c8669e8025f3a04d9b874f8983467106c96214e384`
- production total after import: **1031**
- public-safe activation: PR #42

### Question batch v10

- content version: `ipa92-questions-v10`
- active count: 16
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `d1d52cd8bd51150edf72b65a5fc58c7e486c005a`
- payload SHA-256: `b1323e475a79040c9239a668dcc7ce3f0239b018721980a464fd8d4316bc46c4`
- imported at: `2026-09-13 06:11:43.617+00`
- import workflow run: `34742129660` — success
- production total after import: **1047**
- public-safe activation: PR #44, merge commit `1e4acb5a41f95b549722990417b423c1d72b6963`

Protected stems/options/answers/explanations/hints remain private. The public repository contains only safe metadata and the browser provider contract.

## Pages / CI state

PR #44 passed the current latest-provider and publication checks before merge:

- `Validate IPA 9.2 question v10 public activation`
- `Validate sanitized FE QUEST publication`

Historical v7/v8/v9 validators were changed to validate their immutable historical artifacts only, rather than treating each old provider as the latest runtime. This prevents a valid newer provider activation from making historical checks fail by construction.

Post-merge Pages run #60 (`34742727068`) completed successfully for main `1e4acb5a...`.

The latest provider contract is:

- provider version: `v376-provider-7-ipa92-v1-v10`
- merged catalog total: **1047**
- extension content versions: v1 through v10
- historical v7/v8/v9 readiness aliases resolve to the latest provider

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

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Large-classification traversal and several remediation batches are complete, but **full coverage is not yet verified**. The following remain open:

- semantic review of remaining zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Review the reduced SR-P0 remainder after v10: platform/provider legal updates, cloud-native/cloud-by-default terminology, and test-design variants not yet directly practiced such as driver-related distinctions.
2. Inspect all relevant current questions and protected lesson payloads semantically before declaring a genuine gap.
3. For confirmed gaps, create only a small original private batch after ID/content collision checks.
4. Import through the existing protected workflow only; expose public-safe metadata only after production verification.
5. In parallel, begin mobile/touch and learning-history QA for topics that already have sufficient practice density.

## Safety rules

- GitHub/Supabase current state is always the source of truth.
- Keep question/material/paywall logic behind the private/protected boundary.
- Never publish protected stems, options, answers, explanations, hints or choice explanations.
- Do not copy copyrighted proprietary questions; new questions are original unless they are public official past questions handled under the project policy.
- Preserve existing IDs, answers, learner history, and save/restore contracts.
- Never weaken the `private main + workflow_dispatch + GitHub OIDC` import boundary.
- Keep `implemented`, `imported`, `deployed`, `source-covered`, and `verified-covered` as separate states.
