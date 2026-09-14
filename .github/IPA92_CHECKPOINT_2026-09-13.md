# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-14 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v22 activation: `54bf420b18a80d82f8247cef8769b58675d4e820`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `846382c447e78416d4d25266edb49b3bc275f00b`
- active protected questions: **1109**
- active protected lessons: **130**
- v22 active questions: **5**
- v22 staging rows after finalization: **0**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 extensions v1–v22 **205** = **1109**
- PWA cache: `fe-quest-v377-21`
- latest provider version: `v376-provider-19-ipa92-v1-v22`
- public merged catalog total: **1109**
- public extension metadata total: **205**
- merged Subject-A count: **915**
- tracked Subject-A count: **924**

Protected imports remain automated without weakening the production authorization boundary. Relevant changes merged to private `main` trigger the automatic dispatcher, which invokes the trusted `Import latest protected content` workflow as `workflow_dispatch`; that importer obtains GitHub OIDC credentials and performs the production import. Protected stems/options/answers/explanations/hints and lesson bodies remain private. The public repository contains safe metadata and browser provider contracts only.

## Recent semantic-remediation batches

- **v16 — IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls. Production total 1082.
- **v17 — enterprise architecture:** EA, WFA, SOA, Zachman framework. Production total 1086.
- **v18 — strategy frameworks:** VRIO, growth matrix, 3C. Existing value-chain direct practice was retained rather than duplicated. Production total 1089.
- **v19 — modern marketing:** persona/customer-journey map, dynamic pricing, subscription model, omnichannel, SEO/LPO. Five application/comparison questions covered seven official terms. Production total 1094.
- **v20 — technology strategy:** MOT, open innovation, innovator's dilemma, lean startup, PoC/PoV. Production total 1099.
- **v21 — digital business:** digital twin/CPS, smart contract, eKYC, CBDC, NFT. Production total 1104.
- **v22 — industrial/consumer technology:** edge AI, HEMS, M2M, smart factory/smart agriculture, MaaS/autonomous driving. Existing edge-computing, IoT and FA/CIM foundations were retained rather than duplicated. Production total **1109**.

### v22 verified production evidence

- content version: `ipa92-questions-v22`
- active count: **5**
- private PR: #42
- private source / manifest source commit: `846382c447e78416d4d25266edb49b3bc275f00b`
- question payload SHA-256: `9a50319e2633a233754fe39d6b5ae80d75529a47b8f94bf4406cec571ba72a36`
- automatic dispatcher run: `34820828775` — success
- automatic unified protected import run: `34820837808` — success
- public-safe activation: PR #68, merge commit `54bf420b18a80d82f8247cef8769b58675d4e820`

Protected lessons remain **130** active rows. Their DB `content_version` remains `v376-lessons-1`. The v22 lesson materialization reinforces `core_19_01`, `core_19_02`, and `core_19_04` while preserving stable lesson IDs. Latest lesson payload SHA-256: `1bbf02f42e0c12337a9fca60b9be00cd2170952e37a35cbb281bb61bb17bba1c`, source commit `846382c447e78416d4d25266edb49b3bc275f00b`.

## Pages / CI state

PR #68 passed all release checks before merge:

- `Validate IPA 9.2 question v21 historical artifacts` — run `34821561878` — success
- `Validate IPA 9.2 question v22 public activation` — run `34821561919` — success
- `Validate sanitized FE QUEST publication` — run `34821561913` — success

Post-merge Pages run #88 (`34821625145`) successfully completed for main `54bf420b18a80d82f8247cef8769b58675d4e820`.

The publication and Pages guards include the v22 public-safe provider/catalog assets and the `fe-quest-v377-21` cache contract. Historical provider/catalog artifacts remain immutable; historical readiness aliases resolve to the latest provider so callers do not pin the runtime to an older catalog.

## Official IPA Ver.9.2 inventory milestone

Authority: IPA 基本情報技術者試験シラバス Ver.9.2, published 2026-01-08. Official structure: 9 large classifications / 23 middle classifications / 96 small classifications.

The evidence-ledger audit has traversed **all 9 large classifications and all 23 middle classifications** across tranches 1–9. Ledgers distinguish `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are not final missing verdicts; semantic review is required before new content is created.

## Semantic-review remediation completed so far

- **v8–v11:** service/cloud/AI/privacy/legal/UI/database/network/security/test/cloud-modernization and platform/legal SR-P0 bundles.
- **v12:** requirements-engineering detail.
- **v13:** development-process variants.
- **v14:** project-management detail.
- **v15:** service/facility detail.
- **v16:** IT governance/internal control.
- **v17:** enterprise architecture.
- **v18:** strategy frameworks.
- **v19:** modern marketing.
- **v20:** technology strategy.
- **v21:** digital business.
- **v22:** industrial/consumer technology — edge AI, HEMS, M2M, smart factory/smart agriculture, MaaS/autonomous driving. Smart factory/agriculture and MaaS/autonomous driving were deliberately paired to emphasize semantic distinctions rather than vocabulary inflation.

The completed bundles above are complete at the source/import/deploy level only; they are not automatically `verified-covered`.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Full coverage is **not yet verified**. Open gates remain:

- semantic review of remaining SR-P1/SR-P2 zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification across the enlarged **1109-question** catalog

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Re-read the live production corpus and continue with the next remaining SR-P1 cluster: **corporate/data analysis** — BCP/BCM/BIA, regression/moving average, BI/data mining, box plot/heat map. Check semantic equivalence and neighboring statistics/business-analysis/continuity material before creating any v23 content.
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
