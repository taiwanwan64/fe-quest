# FE QUEST — IPA Ver.9.2 official inventory tranche 8 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類8「経営戦略」** against the verified production snapshot of 1003 active questions and 130 active protected lessons.

Covered classifications:

- 中分類19「経営戦略マネジメント」
  - 経営戦略手法
  - マーケティング
  - ビジネス戦略と目標・評価
  - 経営管理システム
- 中分類20「技術戦略マネジメント」
  - 技術開発戦略の立案
  - 技術開発計画
- 中分類21「ビジネスインダストリ」
  - ビジネスシステム
  - エンジニアリングシステム
  - e-ビジネス
  - 民生機器
  - 産業機器

The structured evidence ledger is `.github/ipa92-official-inventory-tranche8.json`.

## Production snapshot

- public main at audit start: `4cd64dd00a41b9cc2f6bb8de92fcfc689d39aa88`
- private main: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- active protected questions: 1003
- active protected lessons: 130

No protected question or lesson bodies are copied into this public audit.

## Method

The audit uses official Ver.9.2 content/example terms as evidence probes against the protected production corpus. Japanese phrases use case-insensitive phrase matching. Compact ASCII abbreviations use token-boundary matching.

Token boundaries are not sufficient for every acronym. In particular, `CASE` is also a common English word, so its raw matches are treated as noisy and remain `mixed-evidence` rather than direct coverage.

A zero direct hit remains a semantic-review candidate, not a final missing verdict.

## Findings

The ledger records 91 fine-grained findings:

- `direct-covered`: 13
- `mixed-evidence`: 12
- `lesson-only`: 1
- `no-direct-evidence`: 65
- `verified-covered` promotions: 0

### Strong existing evidence

Representative stronger areas include:

- SWOT, STP and PPM
- CSF, KGI and KPI
- focus strategy
- technology roadmap
- CAD, CAE and CAM
- IoT and POS

These remain `direct-covered`, not `verified-covered`; mobile/touch QA, practice density, learning-history compatibility, and any required interactive behavior remain separate gates.

### Mixed or lesson-only evidence

Depth review is still required for benchmark use, cost-leadership/differentiation terminology, BSC, A/B testing, scale economies, CIM/MRP, electronic commerce/EDI/SNS, and the automotive `CASE` acronym. M&A is `lesson-only` in this exact-term pass.

### Highest-value semantic-review candidates

No reliable direct exact-term evidence was found in this pass for many official Ver.9.2 items, including:

- strategy: dynamic capabilities, circular economy, core competence, blue-ocean strategy, VRIO, value-chain analysis, growth matrix
- marketing: 3C, conjoint analysis, customer-journey map, persona, PLC, dynamic pricing, subscription models, omnichannel, SEO/LPO, Six Sigma/TQM
- technology strategy: MOT, open innovation, innovation dilemma, lean startup, API economy, PoC/PoV, CVC/VC, concurrent engineering
- business systems/public systems: XBRL, digital twin, CPS, smart contract, e-Gov, LGWAN, EDINET
- AI utilization: XAI, HITL and hallucination terminology
- engineering/e-business: JIT, PDM, CBDC, eKYC and NFT
- consumer/industrial devices: edge AI, real-time OS, BLE beacon, HEMS, M2M, smart factory/agriculture, MaaS, drones and autonomous driving

These should be semantically reviewed against broader existing questions and lessons before any new protected batch is created.

## Next step

1. merge this evidence-only tranche after inventory/publication CI passes;
2. continue the official inventory into the final large classification, 大分類9「企業と法務」 / 中分類22〜23;
3. then consolidate tranche 1–9 thin-area findings into a ranked semantic-review backlog;
4. create only small original protected batches for gaps that survive semantic review;
5. keep `verified-covered` closed until mobile/touch QA and learning-history compatibility are verified.
