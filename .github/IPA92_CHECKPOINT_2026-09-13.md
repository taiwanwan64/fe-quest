# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-14 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v17 activation: `d52cf60904ee3a8aedb14c2c389a2992d9a0532d`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `7f8fc5702aa07ea6f61029c65733c4232c3a1074`
- open PRs immediately after v17 activation: public **0** / private **0**
- active protected questions: **1086**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 extensions v1–v17 **182** = **1086**
  - v1–v6 83 + v7 16 + v8 16 + v9 12 + v10 16 + v11 8 + v12 8 + v13 6 + v14 4 + v15 5 + v16 4 + v17 4 = 182
- PWA cache: `fe-quest-v377-16`
- latest provider version: `v376-provider-14-ipa92-v1-v17`
- public merged catalog total: **1086**
- public extension metadata total: **182**
- merged Subject-A count: **892**
- tracked Subject-A count: **901**

Latest protected imports were performed through the existing `private main + workflow_dispatch + GitHub OIDC` path and verified in production. Protected stems/options/answers/explanations/hints remain private. The public repository contains only safe metadata and browser provider contracts.

## Recent protected batches

### v14
- content version: `ipa92-questions-v14`
- active count: 4
- source commit: `5e559865621fbc810b8d3e3abd1b1db9625e304e`
- payload SHA-256: `97ae7336e982f4e6dace924c061556332d5a7a8ae3836a90d9b44f32d188669a`
- import workflow run: `34752476889` — success
- production total: **1073**
- public-safe activation: PR #52

### v15
- content version: `ipa92-questions-v15`
- active count: 5
- source commit: `ab0ac7b562a82707897f2e1243a6998746833633`
- payload SHA-256: `07b36e2ab421a355e360043c5b4bad934e3ea25253a26052a568e75d25ed9c61`
- import workflow run: `34753935502` — success
- production total: **1078**
- public-safe activation: PR #54

### v16 — IT governance / internal control
- content version: `ipa92-questions-v16`
- active count: 4
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `f3ee6692a2b84709c50c80f98811d7ee0b791ddc`
- payload SHA-256: `9b4282bda6d758e4ef57c744ea4508739e952a98abed704ac94990242fa9ce89`
- import workflow run: `34756180050` — success
- protected lesson import workflow run: `34756204627` — success
- production total after import: **1082**
- public-safe activation: PR #56, merge commit `372308158011d4928f93ddb54493f4a835131fe2`
- remediation: COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls

### v17 — enterprise architecture
- content version: `ipa92-questions-v17`
- active count: 4
- staging rows after finalization: 0
- import manifest rows: 1
- source commit: `7f8fc5702aa07ea6f61029c65733c4232c3a1074`
- payload SHA-256: `7a95d75d87b986238e2a686800ed0b1b4394e22317c64c352b7c3a2c800874f2`
- imported at: `2026-09-13 22:10:59.887+00`
- import workflow run: `34786004882` — success
- protected lesson import workflow run: `34786016692` — success
- production total after import: **1086**
- public-safe activation: PR #58, merge commit `d52cf60904ee3a8aedb14c2c389a2992d9a0532d`
- remediation: EA direct practice, WFA, SOA, Zachman framework

The protected `core_16_01` lesson body was verified after import to contain the v17 EA/WFA/SOA/Zachman distinctions while preserving its stable lesson ID. The database lesson row continues to report the existing `content_version` value; the verified body content, not that legacy label alone, is the source of truth for the overlay result.

## Pages / CI state

PR #58 passed all current release checks before merge:

- `Validate IPA 9.2 question v16 public activation` — run `34786665758` — success
- `Validate IPA 9.2 question v17 public activation` — run `34786665814` — success
- `Validate sanitized FE QUEST publication` — run `34786665782` — success

Post-merge Pages run #78 (`34786687567`) completed successfully for main `d52cf60904ee3a8aedb14c2c389a2992d9a0532d`.

The publication and Pages guards now verify the v17 public-safe provider/catalog assets and the `fe-quest-v377-16` cache contract. Historical provider/catalog artifacts remain immutable; historical readiness aliases resolve to the latest provider so callers do not pin the browser runtime to an older catalog.

## Official IPA Ver.9.2 inventory milestone

Authority: IPA 基本情報技術者試験シラバス Ver.9.2, published 2026-01-08. Official structure: 9 large classifications / 23 middle classifications / 96 small classifications.

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. Ledgers distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are not final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

- **v8:** SLI/SLO; service request/known error; SaaS/PaaS/IaaS and deployment models; XAI/HITL/hallucination; anonymized/pseudonymized information; 中小受託取引適正化法.
- **v9:** ITIL/JIS Q 20000; CAB/PIR; DevOps/DevSecOps/TDD/SRE/MLOps; GDPR/JIS Q 15001/電子署名法.
- **v10:** WCAG/responsive Web/heuristic/usability; three-schema; key-value/document NoSQL; CSMA/CD/CA/spanning tree; RADIUS/QoS; secure boot; stub/condition coverage. Boundary-value analysis and equivalence partitioning were reviewed but not duplicated because direct semantic practice already existed.
- **v11:** 情報流通プラットフォーム対処法/発信者情報; cloud-native/cloud-by-default; test driver and stub/driver distinction. This completed the first SR-P0 remediation pass.
- **v12 requirements engineering:** SysML/UML; user stories/acceptance criteria; use-case diagrams; mockups; prototyping; mockup/prototype distinction. Bidirectional traceability was reviewed but not duplicated because semantic coverage already existed.
- **v13 development-process variants:** low-code, no-code, pair programming, mob programming, KPT, YAGNI.
- **v14 project-management detail:** PMO, WBS dictionary, COCOMO, CCB. Responsibility matrix/RACI was reviewed and deliberately not duplicated because existing material already teaches the relevant role/responsibility-matrix semantics.
- **v15 service/facility:** AIOps, operations job scheduling, hot-aisle/cold-aisle layout, MDF, Green IT. CPU scheduling was not treated as equivalent to operations job scheduling.
- **v16 IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls. Existing internal-control fundamentals were retained and only genuinely missing distinctions were added.
- **v17 enterprise architecture:** EA direct practice, WFA, SOA, Zachman framework. Existing whole-enterprise strategy semantics were retained; the new batch focuses on distinctions that were absent or lesson-only.

The completed bundles above are complete at the source/import/deploy level only; they are not automatically `verified-covered`.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Full coverage is **not yet verified**. Open gates remain:

- semantic review of remaining SR-P1/SR-P2 zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification across the enlarged **1086-question** catalog

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Re-read the live semantic-review backlog and current production corpus, then continue with the next remaining SR-P1 cluster. The next queue item after enterprise architecture is **strategy frameworks** (VRIO, value chain, growth matrix, 3C), but semantic equivalence and collisions must be checked before any v18 content is created.
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
