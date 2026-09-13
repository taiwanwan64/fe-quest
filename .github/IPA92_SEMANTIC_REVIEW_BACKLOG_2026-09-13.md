# FE QUEST — IPA Ver.9.2 semantic-review backlog — 2026-09-13

## Purpose

The tranche 1–9 evidence-ledger traversal has reached all 9 large classifications and all 23 middle classifications. This file ranks **semantic review**, not confirmed missing content.

A topic belongs here when exact-term evidence is weak (`mixed-evidence`, `lesson-only`, or `no-direct-evidence`) but the official Ver.9.2 syllabus makes the concept worth checking against broader wording, neighboring core topics, and existing lesson context.

**Do not create a new protected batch solely because a term appears here.** Each candidate must first survive semantic review and collision checks against the current **1047 questions / 130 lessons** production corpus.

## Priority contract

- **SR-P0** — review first: current-syllabus specificity plus broad/foundational relevance, cross-topic importance, or a notable Ver.9.2-era legal/technology update.
- **SR-P1** — review next: important but narrower concepts, or topics with some existing indirect evidence.
- **SR-P2** — later review: specialist examples/terminology where independent practice may not be necessary if the parent concept is already well covered.

These priorities are review order only; they are not claims about exam frequency.

## Completed first-pass semantic review / remediation

Broader neighboring concepts already covered in the corpus were not duplicated solely because an exact official term was absent.

### Added in v8

- SLI / SLO
- service request / known error
- SaaS / PaaS / IaaS
- public/private/hybrid cloud deployment models
- XAI / HITL / hallucination
- anonymized / pseudonymized information
- 中小受託取引適正化法

### Added in v9

- ITIL / JIS Q 20000
- CAB / PIR
- DevOps / DevSecOps / TDD / SRE / MLOps
- GDPR / JIS Q 15001 / 電子署名法

### Added in v10

- WCAG / responsive Web design / heuristic evaluation / usability testing
- three-schema architecture
- key-value / document-oriented NoSQL
- CSMA/CD / CSMA/CA / spanning tree
- RADIUS / QoS
- secure boot
- stub / condition coverage

Boundary-value analysis and equivalence partitioning were reviewed but not duplicated because production already contained direct semantic practice under the synonymous Japanese terms `境界値分析` and `同値分割`.

These artifacts are now direct-practice additions, but they are **not automatically `verified-covered`**. Practice-density, visual/interactive need, mobile QA, and learning-history gates remain separate.

## SR-P0 — reduced semantic-review remainder

| Cluster | Current evidence signal | Review target |
|---|---|---|
| Test design: driver and remaining white-box variants | stub and condition coverage now have direct practice; broader test content also exists | inspect driver/top-down-vs-bottom-up and other remaining variants semantically before adding anything |
| Cloud-native / cloud-by-default | service/deployment models are directly covered, but modernization terminology remains weak | decide whether parent cloud concepts are sufficient or a direct item is warranted |
| Platform/provider legal update | 電子署名法 and 中小受託取引適正化法 have direct practice; platform-provider legal terminology remains weak | review 情報流通プラットフォーム対処法 and neighboring provider-liability/disclosure material |

The former SR-P0 UI/accessibility, database-architecture, network-access/control, and secure-boot clusters were remediated in v10 and therefore leave this immediate semantic-review queue. That does **not** promote them to `verified-covered`.

## SR-P1 — second semantic-review pass

| Cluster | Current evidence signal | Review target |
|---|---|---|
| Requirements engineering: SysML, user stories, bidirectional traceability | weak/zero exact evidence | verify broader requirements and modeling coverage |
| Development process variants: low-code/no-code, pair/mob programming, KPT/YAGNI | zero evidence | determine independent FE-level practice need vs parent agile coverage |
| Project-management detail: PMO, CCB, WBS dictionary, responsibility matrix, COCOMO | zero/thin evidence | compare against existing WBS/EVM/PERT/Gantt/project-management material |
| Service/facility: AIOps, job scheduling, hot/cold aisle, MDF, Green IT | zero evidence | confirm whether parent operations/facility topics already provide sufficient conceptual coverage |
| IT governance/internal control: COSO, CSA, JIS Q 38500, general IT controls | zero evidence | inspect system-audit/internal-control core topics for equivalent wording |
| Enterprise architecture: SOA, WFA, Zachman framework | zero evidence | inspect EA/system-strategy lesson structure before remediation |
| Strategy frameworks: VRIO, value chain, growth matrix, 3C | weak/zero evidence | compare to existing SWOT/STP/PPM/KPI material |
| Modern marketing: journey map, persona, dynamic pricing, subscription, omnichannel, SEO/LPO | zero evidence | decide which official examples need direct practice vs lesson mention |
| Technology strategy: MOT, open innovation, innovation dilemma, lean startup, PoC/PoV | mostly zero evidence | inspect technology-strategy core topics and roadmap material |
| Digital business: digital twin, CPS, smart contract, eKYC, CBDC, NFT | zero evidence | check business-system/e-business semantic coverage |
| Industrial/consumer tech: edge AI, HEMS, M2M, smart factory/agriculture, MaaS, autonomous driving | zero evidence | verify parent IoT/business-industry coverage and prioritize representative examples |
| Corporate/data analysis: BCP/BCM/BIA, regression/moving average, BI/data mining, box plot/heat map | thin/zero evidence | inspect OR/statistics/business-analysis content for equivalent practice |
| Accounting: balance sheet / P&L / cash-flow statement / ROA / ROE | lesson-only or mixed | determine whether direct calculation/interpretation practice is sufficient |
| Labor/contracts: 36 Agreement, Worker Dispatching Act, disguised contracting, NDA/GPL/LGPL | mixed/lesson-only/zero | verify distinctions and current legal naming |
| Standards bodies: JIS/ITU/IEC/IETF/IEEE/W3C | mixed/lesson-only/zero | determine whether representative standards practice can cover several examples without overfitting |

## SR-P2 — later / representative-only review

Examples include GUI component names, selected multimedia codecs/formats, specialist standards identifiers, narrow facility terminology, public-system proper nouns, and individual legal examples where the parent concept is already strong. These should usually be handled by representative coverage rather than one question per term unless semantic review shows a real learning gap.

## Remediation rules

Before creating content for any backlog item:

1. inspect all current questions in the relevant `coreTopicId` plus adjacent topics;
2. inspect relevant protected lesson payloads semantically, not only by exact-term search;
3. check IDs/concepts/content versions for collisions;
4. decide whether the item needs a lesson update, a direct question, an interactive explanation, or no independent artifact;
5. if content is needed, create a **small original private batch** and validate it before protected import;
6. expose only public-safe metadata after the production import is verified;
7. keep `verified-covered` closed until practice/visual/mobile/history gates are satisfied.

## Recommended next review bundle

The next pass should stay narrow and review the remaining SR-P0 items before moving into SR-P1:

- platform/provider law: 情報流通プラットフォーム対処法 and closely related disclosure/removal/provider-liability concepts;
- cloud terminology: cloud-native and cloud-by-default, checking whether existing SaaS/PaaS/IaaS and deployment-model practice is already sufficient;
- test design: driver/top-down-vs-bottom-up and any remaining white-box variants that survive semantic review.

If these concepts are already adequately taught by broader wording, they should be recorded as semantic coverage rather than given redundant questions.
