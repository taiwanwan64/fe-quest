# FE QUEST — IPA Ver.9.2 semantic-review backlog — 2026-09-13

## Purpose

The tranche 1–9 evidence-ledger traversal has reached all 9 large classifications and all 23 middle classifications. This file ranks **semantic review**, not confirmed missing content.

A topic belongs here when exact-term evidence is weak (`mixed-evidence`, `lesson-only`, or `no-direct-evidence`) but the official Ver.9.2 syllabus makes the concept worth checking against broader wording, neighboring core topics, and existing lesson context.

**Do not create a new protected batch solely because a term appears here.** Each candidate must first survive semantic review and collision checks against the current **1031 questions / 130 lessons** production corpus.

## Priority contract

- **SR-P0** — review first: current-syllabus specificity plus broad/foundational relevance, cross-topic importance, or a notable Ver.9.2-era legal/technology update.
- **SR-P1** — review next: important but narrower concepts, or topics with some existing indirect evidence.
- **SR-P2** — later review: specialist examples/terminology where independent practice may not be necessary if the parent concept is already well covered.

These priorities are review order only; they are not claims about exam frequency.

## Completed first-pass semantic review / remediation

The first bundle was semantically reviewed before content was added. Broader neighboring concepts already covered in the corpus were not duplicated solely because an exact official term was absent.

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

These are now direct-practice artifacts, but they are **not automatically `verified-covered`**. Practice-density, mobile/visual, and learning-history gates remain separate.

## SR-P0 — remaining semantic-review pass

| Cluster | Current evidence signal | Review target |
|---|---|---|
| Test design: boundary/equivalence/coverage/stub-driver variants | exact terms are uneven, while broader test content exists | distinguish genuine gaps from paraphrased test-design coverage before adding questions |
| Cloud-native / cloud-by-default | service/deployment models are now directly covered, but these modernization terms remain weak | decide whether the parent cloud concepts are sufficient or a direct item is warranted |
| Platform/legal update | 電子署名法 now has direct practice; platform-provider legal terminology remains weak | review 情報流通プラットフォーム対処法 and neighboring provider-liability/legal material |
| UI accessibility standards | weak/zero fine-grained evidence | review WCAG, responsive design, usability evaluation against existing UI/accessibility lessons |
| Database architecture | zero/weak fine-grained evidence | inspect three-schema architecture and NoSQL-type distinctions against broad DB content |
| Network access/control | zero/weak fine-grained evidence | review CSMA/CD, CSMA/CA, spanning tree, RADIUS and QoS against current network mechanisms |
| Security platform boot/control | zero fine-grained evidence | inspect secure boot and neighboring hardware/OS/security architecture content |

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

The next bundle should focus on the remaining SR-P0 clusters without expanding too broadly:

- UI/accessibility: WCAG + responsive design + usability evaluation;
- database: three-schema architecture + representative NoSQL types;
- network: CSMA/CD + CSMA/CA + spanning tree + RADIUS/QoS;
- platform security: secure boot;
- platform/legal: 情報流通プラットフォーム対処法 and neighboring provider-liability concepts;
- test design: only the variants that remain genuinely thin after semantic review.

This keeps the next protected batch small while moving from broad syllabus traversal toward evidence-backed closure of the remaining high-priority gaps.
