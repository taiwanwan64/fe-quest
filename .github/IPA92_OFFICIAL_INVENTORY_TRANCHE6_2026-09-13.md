# FE QUEST — IPA Ver.9.2 official inventory tranche 6 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類6「サービスマネジメント」** against the verified production snapshot of 1003 active questions and 130 active protected lessons.

Covered classifications:

- 中分類15「サービスマネジメント」
  - サービスマネジメント
  - サービスマネジメントシステムの計画及び運用
  - パフォーマンス評価及び改善
  - サービスの運用
  - ファシリティマネジメント
- 中分類16「システム監査」
  - システム監査
  - 内部統制

The structured evidence ledger is `.github/ipa92-official-inventory-tranche6.json`.

## Production snapshot

- public main at audit start: `df5c13ee89fae35644c1dc21ec9aba046d4d3eef`
- private main: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- active protected questions: 1003
- active protected lessons: 130
- IPA 9.2 v7 is already active in production and its public-safe metadata is deployed

No protected stem, options, answer, explanation, hint, or choice-explanation content is copied into this public audit.

## Method

The audit uses official Ver.9.2 contents/example terms as probes against the current protected production corpus. Japanese terms are matched case-insensitively as phrases. Compact ASCII abbreviations such as `ITIL`, `SLA`, `RTO`, `CTI`, `CAB`, `COSO`, and `CIO` use token-boundary matching so ordinary substrings are not counted as evidence.

A zero direct hit is **not** treated as proof that the concept is absent. It remains a semantic-review candidate until broader wording, related core topics, and lesson context are checked.

## Findings

The ledger records 61 fine-grained findings:

- `direct-covered`: 15
- `mixed-evidence`: 7
- `lesson-only`: 2
- `no-direct-evidence`: 37
- `verified-covered` promotions: 0

### Strong existing evidence

Representative strong areas include:

- service management fundamentals and SLA
- service level management and configuration management
- incident management and problem management
- service availability: MTBF / MTTR
- service continuity: RTO / RPO / RLO
- UPS
- system audit fundamentals and audit evidence
- segregation of duties

These remain `direct-covered`, not `verified-covered`; practice density, required interaction/visual behavior, mobile QA, and history compatibility are separate gates.

### Mixed or lesson-only evidence

Depth review is still required for:

- escalation
- SPOC
- RFC
- capacity management terminology
- service catalog
- continual improvement
- audit working papers
- information security management (`lesson-only` in this exact-term pass)
- audit follow-up (`lesson-only`)

### Highest-value semantic-review candidates

No reliable direct exact-term evidence was found in this pass for several official Ver.9.2 items, including:

- service management framework/standards: ITIL, JIS Q 20000, SLO, SLI
- service planning/operation: ITAM, SAM, TCO, CAB, PIR, demand management, supplier management, business relationship management, release and deployment management
- incident/problem operations: service request management, known error
- operations/facility: AIOps, CTI, job scheduling, MDF, cold aisle, hot aisle, Green IT
- system audit: risk approach, system audit plan, System Audit Standards, System Management Standards
- internal control / IT governance: COSO, CSA, IT governance, JIS Q 38500, general IT controls, CIO, CISO, corporate governance, internal-control reporting system

These are **review candidates only**. The next safe action is semantic review against broader existing question/lesson wording before deciding whether any small private targeted batch is warranted.

## Next step

1. merge this evidence-only tranche after inventory/publication CI passes;
2. continue the official inventory into 大分類7「システム戦略」 / 中分類17〜18;
3. separately semantic-review the highest-value tranche 4–6 thin areas and create only small original protected batches where genuine gaps are confirmed;
4. keep all `verified-covered` completion gates closed until mobile/touch QA and learning-history compatibility are verified.
