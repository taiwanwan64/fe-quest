# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-14 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v19 activation: `cd4b5a88863dcba948c0370ac57a029326bdc89d`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `b3c632878700adef7ae5d2ca3055f8647f5028f9`
- open PRs immediately after v19 activation: public **0** / private **0**
- active protected questions: **1094**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 extensions v1–v19 **190** = **1094**
  - v1–v6 83 + v7 16 + v8 16 + v9 12 + v10 16 + v11 8 + v12 8 + v13 6 + v14 4 + v15 5 + v16 4 + v17 4 + v18 3 + v19 5 = 190
- PWA cache: `fe-quest-v377-18`
- latest provider version: `v376-provider-16-ipa92-v1-v19`
- public merged catalog total: **1094**
- public extension metadata total: **190**
- merged Subject-A count: **900**
- tracked Subject-A count: **909**

Protected imports are automated without weakening the production authorization boundary. Relevant changes merged to private `main` trigger the automatic dispatcher, which invokes the trusted `Import latest protected content` workflow in a `workflow_dispatch` context; that importer obtains GitHub OIDC credentials and performs the production import. Protected stems/options/answers/explanations/hints and lesson bodies remain private. The public repository contains safe metadata and browser provider contracts only.

## Recent protected batches

### v16 — IT governance / internal control
- content version: `ipa92-questions-v16`
- active count: 4
- production total after import: **1082**
- public-safe activation: PR #56
- remediation: COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls

### v17 — enterprise architecture
- content version: `ipa92-questions-v17`
- active count: 4
- production total after import: **1086**
- public-safe activation: PR #58
- remediation: EA direct practice, WFA, SOA, Zachman framework

### v18 — strategy frameworks
- content version: `ipa92-questions-v18`
- active count: **3**
- staging rows after finalization: **0**
- production total after import: **1089**
- public-safe activation: PR #60
- remediation: VRIO, growth matrix, 3C direct practice; value-chain analysis was not duplicated because direct semantic practice already existed, while lesson context was reinforced

### v19 — modern marketing
- content version: `ipa92-questions-v19`
- active count: **5**
- staging rows after finalization: **0**
- private source / manifest source commit: `b3c632878700adef7ae5d2ca3055f8647f5028f9`
- payload SHA-256: `e71184f6366e79d9b9acb8ca73848e1f2932da6919bfac4daf604d61bbbb770b`
- imported at: `2026-09-13 23:40:26.086+00`
- automatic dispatcher run: `34790343337` — success
- automatic unified protected import run: `34790346760` — success
- production total after import: **1094**
- public-safe activation: PR #62, merge commit `cd4b5a88863dcba948c0370ac57a029326bdc89d`
- remediation: persona + customer-journey map, dynamic pricing, subscription model, omnichannel, SEO + LPO. Seven official terms were intentionally covered with five comparison/application questions rather than interchangeable definition questions.

Protected lessons remain **130** active rows. The latest lesson import manifest still uses `content_version: v376-lessons-1`; v19 extends the protected `core_18_05` marketing lesson while preserving stable lesson IDs and the existing lesson-bank version contract. Latest protected lesson payload SHA-256 is `32afd16bb8c8591f3bf948772ce6214f48c595a99c1d34cd2cffb203f9fd02d0` from source commit `b3c632878700adef7ae5d2ca3055f8647f5028f9`.

## Pages / CI state

PR #62 passed the release checks before merge:

- `Validate IPA 9.2 question v18 public activation` — run `34801729311` — success
- `Validate IPA 9.2 question v19 public activation` — run `34801729360` — success
- `Validate sanitized FE QUEST publication` — run `34801729347` — success

Post-merge Pages run #82 (`34801768040`) completed successfully for main `cd4b5a88863dcba948c0370ac57a029326bdc89d`.

The publication and Pages guards verify the v19 public-safe provider/catalog assets and the `fe-quest-v377-18` cache contract. Historical provider/catalog artifacts remain immutable; historical readiness aliases resolve to the latest provider so callers do not pin the browser runtime to an older catalog.

## Official IPA Ver.9.2 inventory milestone

Authority: IPA 基本情報技術者試験シラバス Ver.9.2, published 2026-01-08. Official structure: 9 large classifications / 23 middle classifications / 96 small classifications.

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. Ledgers distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are not final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

- **v8:** SLI/SLO; service request/known error; SaaS/PaaS/IaaS and deployment models; XAI/HITL/hallucination; anonymized/pseudonymized information; 中小受託取引適正化法.
- **v9:** ITIL/JIS Q 20000; CAB/PIR; DevOps/DevSecOps/TDD/SRE/MLOps; GDPR/JIS Q 15001/電子署名法.
- **v10:** WCAG/responsive Web/heuristic/usability; three-schema; key-value/document NoSQL; CSMA/CD/CA/spanning tree; RADIUS/QoS; secure boot; stub/condition coverage.
- **v11:** 情報流通プラットフォーム対処法/発信者情報; cloud-native/cloud-by-default; test driver and stub/driver distinction. This completed the first SR-P0 remediation pass.
- **v12 requirements engineering:** SysML/UML; user stories/acceptance criteria; use-case diagrams; mockups; prototyping; mockup/prototype distinction.
- **v13 development-process variants:** low-code, no-code, pair programming, mob programming, KPT, YAGNI.
- **v14 project-management detail:** PMO, WBS dictionary, COCOMO, CCB.
- **v15 service/facility:** AIOps, operations job scheduling, hot-aisle/cold-aisle layout, MDF, Green IT.
- **v16 IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls.
- **v17 enterprise architecture:** EA direct practice, WFA, SOA, Zachman framework.
- **v18 strategy frameworks:** VRIO, growth matrix, 3C. Existing value-chain direct practice was retained rather than duplicated; lesson context was expanded.
- **v19 modern marketing:** persona/customer-journey map, dynamic pricing, subscription model, omnichannel, SEO/LPO. The batch emphasizes distinctions and application rather than one-definition-per-term expansion.

The completed bundles above are complete at the source/import/deploy level only; they are not automatically `verified-covered`.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Full coverage is **not yet verified**. Open gates remain:

- semantic review of remaining SR-P1/SR-P2 zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification across the enlarged **1094-question** catalog

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Re-read the live semantic-review backlog and current production corpus, then continue with the next remaining SR-P1 cluster: **technology strategy** — MOT, open innovation, innovation dilemma, lean startup, PoC/PoV. Check semantic equivalence, neighboring technology-management content, and collisions before creating any v20 content.
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
- Preserve the automatic private-main dispatcher → trusted `workflow_dispatch` importer → GitHub OIDC production boundary.
- Keep `implemented`, `imported`, `deployed`, `source-covered`, and `verified-covered` as separate states.
