# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-13 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main: `fa2d360fe7f4fa7d745f4e46873451560bfa6008`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `e3cc83a1f0f92404f361d49e32089c5ca22f3da3`
- active protected questions: **1031**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 v1–v6 83 + v7 16 + v8 16 + v9 12 = **1031**
- PWA cache remains `fe-quest-v377-12`

Latest protected imports were performed through the existing `private main + workflow_dispatch + GitHub OIDC` path and verified in production.

### Question batch v8

- content version: `ipa92-questions-v8`
- active count: 16
- production total after import: 1019
- public-safe activation: PR #41

### Question batch v9

- content version: `ipa92-questions-v9`
- active count: 12
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `e3cc83a1f0f92404f361d49e32089c5ca22f3da3`
- payload SHA-256: `64618ca447addac7bd1482c8669e8025f3a04d9b874f8983467106c96214e384`
- imported at: `2026-09-13 05:42:17.996+00`
- import workflow run: `34740945338` — success
- production total after import: **1031**
- public-safe activation: PR #42, merge commit `fa2d360fe7f4fa7d745f4e46873451560bfa6008`

Protected stems/options/answers/explanations/hints remain private. The public repository contains only safe metadata and the browser provider contract.

## Pages / CI state

PR #42 passed all pull-request checks before merge:

- `Validate sanitized FE QUEST publication`
- `Validate IPA 9.2 question v7 public activation`
- `Validate IPA 9.2 question v8 public activation`
- `Validate IPA 9.2 question v9 public activation`

Post-merge Pages run #58 (`34741372469`) completed successfully for main `fa2d360f...`.

The latest provider contract is:

- provider version: `v376-provider-6-ipa92-v1-v9`
- merged catalog total: **1031**
- extension content versions: v1 through v9
- historical v7/v8 readiness aliases resolve to the latest provider

## Official IPA Ver.9.2 inventory milestone

Authority:

- IPA 基本情報技術者試験シラバス Ver.9.2
- published 2026-01-08
- official structure: 9 large classifications / 23 middle classifications / 96 small classifications

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. The ledgers deliberately distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are **not** final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

The first high-priority semantic-review bundle has now been reviewed and selectively remediated with original protected questions where genuine direct-practice gaps remained.

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

Broader neighboring concepts that were already semantically covered were not duplicated merely because an exact official term was missing.

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

1. Review the remaining SR-P0 clusters after subtracting v8/v9 remediation: UI accessibility, database architecture, network access/control, secure boot, and remaining platform/legal updates.
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
