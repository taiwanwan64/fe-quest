# FE QUEST — IPA Ver.9.2 official inventory tranche 7 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類7「システム戦略」** against the verified production snapshot of 1003 active questions and 130 active protected lessons.

Covered classifications:

- 中分類17「システム戦略」
  - 情報システム戦略
  - 業務プロセス
  - ソリューションビジネス
  - システム活用促進・評価
- 中分類18「システム企画」
  - システム化計画
  - 要件定義
  - 調達計画・実施

The structured evidence ledger is `.github/ipa92-official-inventory-tranche7.json`.

## Production snapshot

- public main at audit start: `85688c2022efcf9b426d4d5d5054a34941b1b8ae`
- private main: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- active protected questions: 1003
- active protected lessons: 130

No protected stem, options, answer, explanation, hint, or choice-explanation content is copied into this public audit.

## Method

The audit uses official Ver.9.2 contents/example terms as evidence probes against the protected production corpus. Japanese phrases are matched case-insensitively. Compact ASCII abbreviations such as `ERP`, `CRM`, `RFI`, `RFP`, `RFQ`, `EA`, `SOA`, `PMO`, and `BYOD` use token-boundary matching to reduce substring false positives.

A zero direct hit is **not** a final missing verdict. It remains a semantic-review candidate until broader wording, adjacent core topics, and lesson context are checked.

## Findings

The ledger records 78 fine-grained findings:

- `direct-covered`: 14
- `mixed-evidence`: 5
- `lesson-only`: 2
- `no-direct-evidence`: 57
- `verified-covered` promotions: 0

### Strong existing evidence

Representative strong areas include:

- information-system strategy fundamentals
- ERP, SCM, CRM, and SFA
- KGI and KPI
- BPR
- DFD and E-R modeling
- procurement artifacts RFI, RFP, and RFQ
- non-functional requirements

These remain `direct-covered`, not `verified-covered`; practice density, required interaction/visual behavior, mobile QA, and learning-history compatibility remain separate gates.

### Mixed or lesson-only evidence

Depth review is still required for:

- UML
- BPO
- To-be analysis
- log analysis
- contract-for-work terminology
- EA (`lesson-only` in this exact-term pass)
- CSR (`lesson-only`)

### Highest-value semantic-review candidates

No reliable direct exact-term evidence was found in this pass for several official Ver.9.2 items, including:

- enterprise architecture: SOA, WFA, Zachman framework
- governance/quality: COBIT, PMO, SLCP-JCF, quality control, variance analysis
- business process improvement: BPMS, RPA, offshore development, workflow systems
- solution/cloud business: SaaS, PaaS, IaaS, public/private/hybrid/sovereign cloud, cloud-native, cloud-by-default, hosting/housing, on-premises
- strategy/utilization: CIO, CDO, IT investment management, KMS, enterprise search, BYOD, digital literacy, digital divide, gamification, system lifecycle and data erasure
- system planning: BABOK, SoR/SoE/SoI, Fit to Standard, IT portfolio, investment-effect and introduction-risk analysis
- requirements/procurement: DOA, facilitation, user-needs research, structured analysis, requirements specification, make-or-buy criteria, green procurement, competitive bidding, and quasi-mandate contract terminology

These are **review candidates only**. They should be semantically reviewed against broader existing material before any new protected question batch is created.

## Next step

1. merge this evidence-only tranche after inventory/publication CI passes;
2. continue the official inventory into 大分類8「経営戦略」 / 中分類19〜21;
3. separately semantic-review the highest-value tranche 4–7 thin areas and create only small original protected batches where genuine gaps are confirmed;
4. keep all `verified-covered` completion gates closed until mobile/touch QA and learning-history compatibility are verified.
