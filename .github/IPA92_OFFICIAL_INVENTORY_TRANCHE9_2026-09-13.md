# FE QUEST — IPA Ver.9.2 official inventory tranche 9 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類9「企業と法務」** against the verified production snapshot of 1003 active questions and 130 active protected lessons.

Covered classifications:

- 中分類22「企業活動」
  - 経営・組織論
  - OR・IE
  - 会計・財務
  - データ利活用・統計・可視化
  - リスク・人的資源・IT利活用
- 中分類23「法務」
  - 知的財産権
  - セキュリティ関連法規
  - 個人情報保護
  - 労働・取引関連法規
  - 企業間契約
  - その他の法律・倫理
  - 標準化関連

The structured evidence ledger is `.github/ipa92-official-inventory-tranche9.json`.

## Production snapshot

- public main at audit start: `fbfa6023f0a6097b7caf58cec4a6e97527d2e203`
- private main: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- active protected questions: 1003
- active protected lessons: 130

No protected question or lesson bodies are copied into this public audit.

## Method

The audit uses official Ver.9.2 content/example terms as evidence probes against the protected production corpus. Japanese phrases use case-insensitive phrase matching. Compact ASCII abbreviations use token-boundary matching.

Legal and standards terminology is handled conservatively because equivalent wording and abbreviations are common. A zero direct hit is **not** a final missing verdict; it remains a semantic-review candidate until broader wording and adjacent core-topic evidence are checked.

## Findings

The ledger records 97 fine-grained findings:

- `direct-covered`: 12
- `mixed-evidence`: 15
- `lesson-only`: 14
- `no-direct-evidence`: 56
- `verified-covered` promotions: 0

### Strong existing evidence

Representative stronger areas include:

- corporate activity: break-even analysis, depreciation, linear programming, and PERT
- intellectual property: patents, utility models, design rights, trademarks, and copyright
- security-related law: Unauthorized Computer Access Law
- software/licensing and standardization: OSS and ISO

These remain `direct-covered`, not `verified-covered`; practice density, mobile/touch QA, learning-history compatibility, and any required interaction/visual behavior remain separate gates.

### Mixed or lesson-only evidence

Depth review remains necessary for BCP, current ratio, DX, EOQ, matrix organization, Monte Carlo method, ROA/ROE, personal-information law, trade secrets, labor-standards law, IEC/IEEE/IETF, and Unicode.

Lesson-only evidence exists for several important topics, including balance sheet, cash-flow statement, profit-and-loss statement, CSR, QC seven tools, telework, Company Act, disguised contracting, GPL, ITU, JIS, NDA, Unfair Competition Prevention Act, and the **Act on Ensuring Proper Transactions Involving Specified Small and Medium-Sized Entrusted Business Operators（中小受託取引適正化法）**. The latter is particularly important as a Ver.9.2-era legal term and should be included in the prioritized semantic-review backlog rather than assumed covered from one lesson hit.

### Highest-value semantic-review candidates

No reliable direct exact-term evidence was found in this pass for a broad set of official Ver.9.2 items, including:

- corporate/risk/HR: BCM, BIA, corporate governance, CISO, IPO, Society 5.0, GX, HRTech, wellbeing
- OR/data: CPM, game theory, moving averages, Pareto/regression analysis, Web crawling/scraping, BI, data mining, association analysis, Big Data/Open Data, statistical bias, box plots and heat maps
- accounting: IFRS and FIFO inventory valuation
- privacy/security law: anonymized and pseudonymized information, GDPR, JIS Q 15001, Cybersecurity Basic Act, Electronic Signature Act, Information Distribution Platform Act, Specified Electronic Mail Act
- labor/contracts: 36 Agreement, Worker Dispatching Act, Civil Code, LGPL and work-made-for-hire copyright
- ethics/other laws: Digital Society Formation Basic Act, compliance, ELSI, fake news, filter bubbles, Telecommunications Business Act, Financial Instruments and Exchange Act, e-Document/e-Book preservation laws, Product Liability Act and Foreign Exchange Act
- standards: ISO/IEC 15408, CORBA, W3C, SLCP-JCF and QR code standards

These are **review candidates only**. They should be semantically checked against broader existing questions and lessons before any new protected content is created.

## Inventory milestone

With tranche 9, FE QUEST has now traversed all nine official large classifications and all 23 middle classifications in the Ver.9.2 syllabus using the current evidence-ledger method. This is an important inventory milestone, but it does **not** set `inventoryComplete` or `verified-covered` to true. Fine-grained semantic review, targeted remediation, mobile QA and learning-history compatibility remain open gates.

## Next step

1. merge this evidence-only tranche after inventory/publication CI passes;
2. consolidate tranche 1–9 findings into one ranked semantic-review backlog, prioritizing Ver.9.2 additions and high-exam-value thin areas;
3. perform collision checks against the existing 1003-question corpus and 130 lessons;
4. create only small original protected question/lesson batches for gaps that survive semantic review;
5. keep all final completion gates closed until verification and mobile/touch QA are complete.
