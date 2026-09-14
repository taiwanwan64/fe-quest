# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-14 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main after v21 activation: `5063a97e757689e13821396f48e1d9719caeb515`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `6f5d4991262f0d70baf150546a03cd98c2bb859d`
- active protected questions: **1104**
- active protected lessons: **130**
- v21 staging rows after finalization: **0**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 extensions v1–v21 **200** = **1104**
- PWA cache: `fe-quest-v377-20`
- latest provider version: `v376-provider-18-ipa92-v1-v21`
- public merged catalog total: **1104**
- public extension metadata total: **200**
- merged Subject-A count: **910**
- tracked Subject-A count: **919**

Protected imports remain automated without weakening the production authorization boundary. Relevant changes merged to private `main` trigger the automatic dispatcher, which invokes the trusted `Import latest protected content` workflow as `workflow_dispatch`; that importer obtains GitHub OIDC credentials and performs the production import. Protected stems/options/answers/explanations/hints and lesson bodies remain private. The public repository contains safe metadata and browser provider contracts only.

## Recent semantic-remediation batches

- **v16 — IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, IT general controls vs application controls. Production total 1082.
- **v17 — enterprise architecture:** EA, WFA, SOA, Zachman framework. Production total 1086.
- **v18 — strategy frameworks:** VRIO, growth matrix, 3C. Existing value-chain direct practice was retained rather than duplicated. Production total 1089.
- **v19 — modern marketing:** persona/customer-journey map, dynamic pricing, subscription model, omnichannel, SEO/LPO. Five application/comparison questions covered seven official terms without one-definition-per-term inflation. Production total 1094.
- **v20 — technology strategy:** MOT, open innovation, innovator's dilemma, lean startup, and the PoC/PoV distinction. Five application/comparison questions cover six official ideas. Production total 1099.
- **v21 — digital business:** digital twin/CPS, smart contract, eKYC, CBDC, NFT. Five application/comparison questions cover six official ideas while preserving existing IoT/e-business foundations. Production total **1104**.

### v21 verified production evidence

- content version: `ipa92-questions-v21`
- active count: **5**
- private PR: #41
- private source / manifest source commit: `6f5d4991262f0d70baf150546a03cd98c2bb859d`
- payload SHA-256: `aa359621288e7420865246a1d3fabcecc6d35f63ef0a9ad9e70d8dbc10676953`
- automatic dispatcher run: `34803853907` — success
- automatic unified protected import run: `34803860430` — success
- public-safe activation: PR #66, merge commit `5063a97e757689e13821396f48e1d9719caeb515`

Protected lessons remain **130** active rows. Their DB `content_version` remains `v376-lessons-1`. The v21 lesson materialization reinforces `core_19_01`, `core_19_03`, and `core_19_04` while preserving stable lesson IDs. Latest lesson payload SHA-256: `ee0370824bd667133fc04751f708db1d7b67d3051224db8d9c14f7724b0ca139`, source commit `6f5d4991262f0d70baf150546a03cd98c2bb859d`.

## Pages / CI state

PR #66 passed all release checks before merge:

- `Validate IPA 9.2 question v20 historical artifacts` — run `34804555016` — success
- `Validate IPA 9.2 question v21 public activation` — run `34804555100` — success
- `Validate sanitized FE QUEST publication` — run `34804555024` — success

Post-merge Pages run #86 (`34804592915`) successfully completed for main `5063a97e757689e13821396f48e1d9719caeb515`.

The publication and Pages guards verify the v21 public-safe provider/catalog assets and the `fe-quest-v377-20` cache contract. Historical provider/catalog artifacts remain immutable; historical readiness aliases resolve to the latest provider so callers do not pin the runtime to an older catalog.

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
- **v20:** technology strategy — MOT, open innovation, innovator's dilemma, lean startup, PoC/PoV.
- **v21:** digital business — digital twin/CPS, smart contract, eKYC, CBDC, NFT. Digital twin and CPS were deliberately paired; eKYC was kept distinct from ordinary access authentication; NFT wording avoids implying automatic transfer of copyright or all linked-asset rights.

The completed bundles above are complete at the source/import/deploy level only; they are not automatically `verified-covered`.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Full coverage is **not yet verified**. Open gates remain:

- semantic review of remaining SR-P1/SR-P2 zero/mixed/lesson-only findings
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification across the enlarged **1104-question** catalog

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, deployed, or present in an exact-term probe.

## Next work order

1. Re-read the live production corpus and continue with the next remaining SR-P1 cluster: **industrial/consumer tech** — edge AI, HEMS, M2M, smart factory/agriculture, MaaS, autonomous driving. Check semantic equivalence and neighboring IoT/business-industry content before creating any v22 content.
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
