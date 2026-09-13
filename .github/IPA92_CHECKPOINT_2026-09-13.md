# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-13 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v13 activation: `25f997060a154f693045594ce06d464cec96e1c6`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `a8251780b473afb8ea635651c7324d37eb3790c3`
- active protected questions: **1069**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 v1–v6 83 + v7 16 + v8 16 + v9 12 + v10 16 + v11 8 + v12 8 + v13 6 = **1069**
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

### Question batch v12

- content version: `ipa92-questions-v12`
- active count: 8
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `e3920bb8178c7d85518c988d547776b9760fa410`
- payload SHA-256: `736d2202b9ba1499975588ce33a1d906e8ffba640227de5707a51639670c3a82`
- imported at: `2026-09-13 09:40:20.152+00`
- import workflow run: `34749958968`, attempt 1 — success
- production total after import: **1063**
- public-safe activation: PR #48, merge commit `5eb23fd375b3ac811524afd0ef892bfdf1e020b8`

### Question batch v13

- content version: `ipa92-questions-v13`
- active count: 6
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `a8251780b473afb8ea635651c7324d37eb3790c3`
- payload SHA-256: `102ccee76eb57f24e5ed970abbcf167cb16dc8714ba4cc4f6b16f771ebf80bad`
- imported at: `2026-09-13 10:11:03.808+00`
- import workflow run: `34751177331`, attempt 1 — success
- production total after import: **1069**
- public-safe activation: PR #50, merge commit `25f997060a154f693045594ce06d464cec96e1c6`

Protected stems/options/answers/explanations/hints remain private. The public repository contains only safe metadata and the browser provider contract.

## Pages / CI state

PR #50 passed both current release checks before merge:

- `Validate IPA 9.2 question v13 public activation` — run `34751579621` — success
- `Validate sanitized FE QUEST publication` — run `34751579578` — success

The v12 validator was converted to an immutable historical-artifact check during the v13 activation, matching the existing historical-validator pattern. Historical readiness aliases now resolve to the latest provider rather than pinning callers to older catalogs.

Post-merge Pages run #66 (`34751602125`) completed successfully for main `25f997060a154f693045594ce06d464cec96e1c6`.

The latest provider contract is:

- provider version: `v376-provider-10-ipa92-v1-v13`
- merged catalog total: **1069**
- extension content versions: v1 through v13
- historical v7/v8/v9/v10/v11/v12 readiness aliases resolve to the latest provider

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

The reduced SR-P0 remainder explicitly named after v10 was semantically reviewed and, where a genuine direct-practice gap was confirmed, remediated by v11.

### v12 remediation — first SR-P1 bundle

After semantic review of the live 1055-question / 130-lesson corpus, v12 added direct practice for:

- SysML and the SysML/UML distinction
- user stories and acceptance criteria
- UML use-case diagrams
- mockups
- prototyping
- mockup/prototype distinction

Bidirectional traceability was reviewed but deliberately not duplicated. Existing lessons and direct practice already teach semantic traceability from requirements through design and testing even though the exact official phrase is sparse.

### v13 remediation — development-process variants

After semantic review of the live 1063-question / 130-lesson corpus, v13 added one representative direct-practice item for each confirmed gap:

- low-code development
- no-code development
- pair programming
- mob programming
- KPT
- YAGNI

Existing agile, Scrum, DevOps, DevSecOps, TDD, SRE, MLOps, prototyping, and general development-model material was retained rather than duplicated. The development-process SR-P1 bundle is therefore complete at the source/import/deploy level, not at the final `verified-covered` level.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Large-classification traversal, targeted P0 remediation, the requirements-engineering SR-P1 bundle, and the development-process SR-P1 bundle are complete, but **full coverage is not yet verified**. The following remain open:

- semantic review of remaining zero/mixed/lesson-only findings outside completed bundles
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Continue SR-P1 semantic review with the project-management detail bundle: PMO, CCB, WBS dictionary, responsibility matrix, and COCOMO. Inspect current protected questions and lessons semantically before creating anything.
2. In parallel, begin practice-density verification for classifications whose conceptual breadth is already strong; distinguish syllabus breadth from enough varied repetition to learn reliably.
3. For each remaining SR-P1 cluster, prefer semantic equivalence and representative coverage over one-question-per-term expansion. Create a small original private batch only for confirmed learning gaps.
4. Expand mobile/touch/iPhone-equivalent QA and verify required interactive/visual learning paths without weakening non-interactive fallbacks.
5. Verify learning-history and save/restore compatibility across the enlarged **1069-question** catalog before any coverage-complete promotion.

## Safety rules

- GitHub/Supabase current state is always the source of truth.
- Keep question/material/paywall logic behind the private/protected boundary.
- Never publish protected stems, options, answers, explanations, hints or choice explanations.
- Do not copy copyrighted proprietary questions; new questions are original unless they are public official past questions handled under the project policy.
- Preserve existing IDs, answers, learner history, and save/restore contracts.
- Never weaken the `private main + workflow_dispatch + GitHub OIDC` import boundary.
- Keep `implemented`, `imported`, `deployed`, `source-covered`, and `verified-covered` as separate states.
