# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-14 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v20 activation: `8a3e5f8e8409afb965afb7ae93fc1ddeb2ba5d17`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `d8682a97bbea7979ed3d0b0cab41dd28b492e0ba`
- active protected questions: **1099**
- active protected lessons: **130**
- v20 staging rows after finalization: **0**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 extensions v1–v20 **195** = **1099**
- PWA cache: `fe-quest-v377-19`
- latest provider version: `v376-provider-17-ipa92-v1-v20`
- public merged catalog total: **1099**
- public extension metadata total: **195**
- merged Subject-A count: **905**
- tracked Subject-A count: **914**

Protected imports remain automated without weakening the production authorization boundary. Relevant changes merged to private `main` trigger the automatic dispatcher, which invokes the trusted `Import latest protected content` workflow as `workflow_dispatch`; that importer obtains GitHub OIDC credentials and performs the production import. Protected stems/options/answers/explanations/hints and lesson bodies remain private. The public repository contains safe metadata and browser provider contracts only.

## Recent semantic-remediation batches

- **v16 — IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls. Production total 1082.
- **v17 — enterprise architecture:** EA, WFA, SOA, Zachman framework. Production total 1086.
- **v18 — strategy frameworks:** VRIO, growth matrix, 3C. Existing value-chain direct practice was retained rather than duplicated. Production total 1089.
- **v19 — modern marketing:** persona/customer-journey map, dynamic pricing, subscription model, omnichannel, SEO/LPO. Five application/comparison questions covered seven official terms without one-definition-per-term inflation. Production total 1094.
- **v20 — technology strategy:** MOT, open innovation, innovator's dilemma, lean startup, and the PoC/PoV distinction. Five application/comparison questions cover six official ideas. Production total **1099**.

### v20 verified production evidence

- content version: `ipa92-questions-v20`
- active count: **5**
- private PR: #40
- private source / manifest source commit: `d8682a97bbea7979ed3d0b0cab41dd28b492e0ba`
- payload SHA-256: `d8bb655dce3e5fe8f41a9ac75eac7fbacc7be01ef26c68e46db13871607a4d64`
- automatic dispatcher run: `34802597426` — success
- automatic unified protected import run: `34802602188` — success
- public-safe activation: PR #64, merge commit `8a3e5f8e8409afb965afb7ae93fc1ddeb2ba5d17`

Protected lessons remain **130** active rows. Their DB `content_version` remains `v376-lessons-1`. The v20 lesson materialization reinforces `core_18_07` and `core_18_08` while preserving stable lesson IDs. Latest lesson payload SHA-256: `4bfb02102320ad059734c261246746a3622ce4f3e46df3ccad520dc602eb9746`, source commit `d8682a97bbea7979ed3d0b0cab41dd28b492e0ba`.

## Pages / CI state

PR #64 passed all release checks before merge:

- `Validate IPA 9.2 question v19 historical artifacts` — run `34802918279` — success
- `Validate IPA 9.2 question v20 public activation` — run `34802918228` — success
- `Validate sanitized FE QUEST publication` — run `34802918203` — success

Post-merge Pages run #84 (`34802950813`) successfully completed its build/upload/deploy steps for main `8a3e5f8e8409afb965afb7ae93fc1ddeb2ba5d17`.

The publication and Pages guards verify the v20 public-safe provider/catalog assets and the `fe-quest-v377-19` cache contract. Historical provider/catalog artifacts remain immutable; historical readiness aliases resolve to the latest provider so callers do not pin the runtime to an older catalog.

## Official IPA Ver.9.2 inventory milestone

Authority: IPA 基本情報技術者試験シラバス Ver.9.2, published 2026-01-08. Official structure: 9 large classifications / 23 middle classifications / 96 small classifications.

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. Ledgers distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are not final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

- **v8:** SLI/SLO; service request/known error; cloud service/deployment models; XAI/HITL/hallucination; anonymized/pseudonymized information; 中小受託取引適正化法.
- **v9:** ITIL/JIS Q 20000; CAB/PIR; DevOps/DevSecOps/TDD/SRE/MLOps; GDPR/JIS Q 15001/電子署名法.
- **v10:** accessibility/UI; three-schema and NoSQL variants; network/access topics; secure boot; test coverage detail.
- **v11:** platform/provider legal terminology; cloud-native/cloud-by-default; test driver distinction. First SR-P0 pass completed.
- **v12:** requirements-engineering detail.
- **v13:** development-process variants.
- **v14:** project-management detail.
- **v15:** service/facility detail.
- **v16:** IT governance/internal control.
- **v17:** enterprise architecture.
- **v18:** strategy frameworks.
- **v19:** modern marketing.
- **v20:** technology strategy — MOT, open innovation, innovator's dilemma, lean startup, PoC/PoV. Semantic review explicitly rejected false-positive substring hits such as `Promotion` for MOT and `SPOC` for PoC before deciding the direct-practice gaps.

The completed bundles above are complete at the source/import/deploy level only; they are not automatically `verified-covered`.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Full coverage is **not yet verified**. Open gates remain:

- semantic review of remaining SR-P1/SR-P2 zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification across the enlarged **1099-question** catalog

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Re-read the live production corpus and continue with the next remaining SR-P1 cluster: **digital business** — digital twin, CPS, smart contract, eKYC, CBDC, NFT. Check semantic equivalence and neighboring e-business/IoT/finance content before creating any v21 content.
2. Continue practice-density verification for classifications whose syllabus breadth is already strong.
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
