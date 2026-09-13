# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-14 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v16 activation: `372308158011d4928f93ddb54493f4a835131fe2`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `f3ee6692a2b84709c50c80f98811d7ee0b791ddc`
- open PRs: public **0** / private **0**
- active protected questions: **1082**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 v1–v6 83 + v7 16 + v8 16 + v9 12 + v10 16 + v11 8 + v12 8 + v13 6 + v14 4 + v15 5 + v16 4 = **1082**
- PWA cache: `fe-quest-v377-15`
- latest provider version: `v376-provider-13-ipa92-v1-v16`
- public merged catalog total: **1082**
- public extension metadata total: **178**
- merged Subject-A count: **888**
- tracked Subject-A count: **897**

Latest protected imports were performed through the existing `private main + workflow_dispatch + GitHub OIDC` path and verified in production. Protected stems/options/answers/explanations/hints remain private. The public repository contains only safe metadata and browser provider contracts.

## Recent protected batches

### v11
- content version: `ipa92-questions-v11`
- active count: 8
- source commit: `17fa3f92a8a569c7500794f4fe0b32b33caa6c53`
- payload SHA-256: `82fc0e3dc890a16ab3a3af8cca6185e864a6366f7cfc719d4bbd04cfa0931018`
- import workflow run: `34747639449`, attempt 2 — success
- production total: **1055**

### v12
- content version: `ipa92-questions-v12`
- active count: 8
- source commit: `e3920bb8178c7d85518c988d547776b9760fa410`
- payload SHA-256: `736d2202b9ba1499975588ce33a1d906e8ffba640227de5707a51639670c3a82`
- import workflow run: `34749958968`, attempt 1 — success
- production total: **1063**

### v13
- content version: `ipa92-questions-v13`
- active count: 6
- source commit: `a8251780b473afb8ea635651c7324d37eb3790c3`
- payload SHA-256: `102ccee76eb57f24e5ed970abbcf167cb16dc8714ba4cc4f6b16f771ebf80bad`
- import workflow run: `34751177331`, attempt 1 — success
- production total: **1069**

### v14
- content version: `ipa92-questions-v14`
- active count: 4
- source commit: `5e559865621fbc810b8d3e3abd1b1db9625e304e`
- payload SHA-256: `97ae7336e982f4e6dace924c061556332d5a7a8ae3836a90d9b44f32d188669a`
- import workflow run: `34752476889`, attempt 1 — success
- production total: **1073**
- public-safe activation: PR #52

### v15
- content version: `ipa92-questions-v15`
- active count: 5
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `ab0ac7b562a82707897f2e1243a6998746833633`
- payload SHA-256: `07b36e2ab421a355e360043c5b4bad934e3ea25253a26052a568e75d25ed9c61`
- import workflow run: `34753935502`, attempt 1 — success
- production total after import: **1078**
- public-safe activation: PR #54

### v16
- content version: `ipa92-questions-v16`
- active count: 4
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `f3ee6692a2b84709c50c80f98811d7ee0b791ddc`
- payload SHA-256: `9b4282bda6d758e4ef57c744ea4508739e952a98abed704ac94990242fa9ce89`
- import workflow run: `34756180050`, attempt 1 — success
- protected lesson import workflow run: `34756204627` — success
- production total after import: **1082**
- public-safe activation: PR #56, merge commit `372308158011d4928f93ddb54493f4a835131fe2`
- remediation: COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls

The protected `core_15_06` lesson body was verified after import to contain the v16 distinctions while preserving its stable lesson ID.

## Pages / CI state

PR #56 passed the v16 release checks before merge, including:

- `Validate IPA 9.2 question v16 public activation` — run `34756876776` — success
- the current sanitized-publication guard — success

Post-merge Pages run #76 (`34756897458`) completed successfully for main `372308158011d4928f93ddb54493f4a835131fe2`.

The publication and Pages guards explicitly verify the v16 public-safe provider/catalog assets and the `fe-quest-v377-15` cache contract. Historical provider/catalog artifacts remain immutable; historical readiness aliases resolve to the latest provider so callers do not pin the browser runtime to an older catalog.

## Official IPA Ver.9.2 inventory milestone

Authority: IPA 基本情報技術者試験シラバス Ver.9.2, published 2026-01-08. Official structure: 9 large classifications / 23 middle classifications / 96 small classifications.

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. Ledgers distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are not final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

- **v8:** SLI/SLO; service request/known error; SaaS/PaaS/IaaS and deployment models; XAI/HITL/hallucination; anonymized/pseudonymized information; 中小受託取引適正化法.
- **v9:** ITIL/JIS Q 20000; CAB/PIR; DevOps/DevSecOps/TDD/SRE/MLOps; GDPR/JIS Q 15001/電子署名法.
- **v10:** WCAG/responsive Web/heuristic/usability; three-schema; key-value/document NoSQL; CSMA/CD/CA/spanning tree; RADIUS/QoS; secure boot; stub/condition coverage. Boundary-value analysis and equivalence partitioning were deliberately not duplicated because direct semantic practice already existed.
- **v11:** 情報流通プラットフォーム対処法/発信者情報; cloud-native/cloud-by-default; test driver and stub/driver distinction. This completed the first SR-P0 remediation pass.
- **v12 requirements engineering:** SysML/UML; user stories/acceptance criteria; use-case diagrams; mockups; prototyping; mockup/prototype distinction. Bidirectional traceability was reviewed but not duplicated because semantic coverage already existed.
- **v13 development-process variants:** low-code, no-code, pair programming, mob programming, KPT, YAGNI.
- **v14 project-management detail:** PMO, WBS dictionary, COCOMO, CCB. Responsibility matrix/RACI was reviewed and deliberately not duplicated because existing `core_14_03` material already teaches the relevant semantics.
- **v15 service/facility:** AIOps, operations job scheduling, hot-aisle/cold-aisle layout, MDF, Green IT. CPU scheduling was not treated as equivalent to operations job scheduling.
- **v16 IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls. Existing internal-control fundamentals were retained and the genuinely missing distinctions were added.

The completed bundles above are complete at the source/import/deploy level only; they are not automatically `verified-covered`.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Full coverage is **not yet verified**. Open gates remain:

- semantic review of remaining SR-P1/SR-P2 zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification across the enlarged **1082-question** catalog

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Continue the remaining SR-P1 pass with **enterprise architecture**: EA direct practice, SOA, WFA, and the Zachman framework. Live production review already shows `core_16_01` teaches EA at lesson level, while direct EA practice is thin and SOA/WFA/Zachman have no direct production evidence; inspect semantics/collisions before creating a small original batch.
2. In parallel, continue practice-density verification for classifications whose syllabus breadth is already strong.
3. Prefer semantic equivalence and representative coverage over one-question-per-term expansion. Create a small original private batch only for confirmed learning gaps.
4. Expand mobile/touch/iPhone-equivalent QA and verify required interactive/visual learning paths without weakening non-interactive fallbacks.
5. Verify learning-history and save/restore compatibility before any coverage-complete promotion.

## Safety rules

- GitHub/Supabase current state is always the source of truth.
- Keep question/material/paywall logic behind the private/protected boundary.
- Never publish protected stems, options, answers, explanations, hints or choice explanations.
- Do not copy copyrighted proprietary questions; new questions are original unless they are public official past questions handled under project policy.
- Preserve existing IDs, answers, learner history, and save/restore contracts.
- Never weaken the `private main + workflow_dispatch + GitHub OIDC` import boundary.
- Keep `implemented`, `imported`, `deployed`, `source-covered`, and `verified-covered` as separate states.
