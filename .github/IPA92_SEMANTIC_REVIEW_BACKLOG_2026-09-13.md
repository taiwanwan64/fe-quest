# FE QUEST — IPA Ver.9.2 semantic-review backlog — 2026-09-13

## Purpose

The tranche 1–9 evidence-ledger traversal has reached all 9 large classifications and all 23 middle classifications. This file is the next-stage queue: it ranks **semantic review**, not confirmed missing content.

A topic belongs here when exact-term evidence is weak (`mixed-evidence`, `lesson-only`, or `no-direct-evidence`) but the official Ver.9.2 syllabus makes the concept worth checking against broader wording, neighboring core topics, and existing lesson context.

**Do not create a new protected batch solely because a term appears here.** Each candidate must first survive semantic review and collision checks against the current 1003 questions and 130 lessons.

## Priority contract

- **SR-P0** — review first: current-syllabus specificity plus broad/foundational relevance, cross-topic importance, or a notable Ver.9.2-era legal/technology update.
- **SR-P1** — review next: important but narrower concepts, or topics with some existing indirect evidence.
- **SR-P2** — later review: specialist examples/terminology where independent practice may not be necessary if the parent concept is already well covered.

These priorities are review order only; they are not claims about exam frequency.

## SR-P0 — first semantic-review pass

| Cluster | Current evidence signal | Review target |
|---|---|---|
| Development practices: DevOps / DevSecOps / TDD / SRE | weak or zero exact-term evidence in tranche 4 | check `core_13_01` and adjacent development-model material for equivalent workflow/automation/continuous-delivery concepts |
| Test design: boundary/equivalence/coverage/stub-driver variants | exact terms are uneven, but broader test content exists | distinguish genuine gaps from paraphrased test-design coverage before adding questions |
| Service management framework: ITIL / JIS Q 20000 | zero exact-term evidence in tranche 6 | check whether service-management lessons already teach the framework concepts without the formal names |
| Service objectives: SLI / SLO | zero exact-term evidence; SLA is strong | determine whether SLI/SLO are separately taught or only SLA is covered |
| Service operation: service request / known error / CAB / PIR | zero or thin exact-term evidence | inspect incident/problem/change-management material for semantic coverage |
| Cloud service models: SaaS / PaaS / IaaS | zero exact-term evidence in tranche 7 | inspect solution-business/cloud questions for model-level distinctions |
| Cloud deployment/modern cloud: public/private/hybrid, cloud-native, cloud-by-default | zero exact-term evidence | verify whether current cloud material is broad enough for the official examples |
| AI utilization: XAI / HITL / hallucination | zero exact-term evidence in tranche 8 | inspect AI/LLM material added in v2 and baseline for these application/risk concepts |
| Privacy: anonymized/pseudonymized information / GDPR / JIS Q 15001 | zero exact-term evidence in tranche 9 | inspect privacy-law material for current terminology and distinctions |
| Ver.9.2 legal update: 中小受託取引適正化法 | lesson-only exact-term evidence | verify lesson depth and add direct practice only if needed |
| Platform/e-signature legal updates | zero exact-term evidence | review Information Distribution Platform Act and Electronic Signature Act coverage |
| UI accessibility standards: WCAG / responsive design / usability evaluation | weak or zero fine-grained evidence in tranche 3 | separate existing accessibility/usability coverage from missing standards/evaluation techniques |
| Database architecture: three-schema / NoSQL types | zero fine-grained evidence in tranche 3 | inspect broad DB-design/database-system content for semantic equivalents |
| Network access/control: CSMA/CD, CSMA/CA, spanning tree, RADIUS/QoS | zero fine-grained evidence in tranche 3 | check whether current network questions cover mechanisms without exact labels |
| Security platform boot/control: secure boot | zero fine-grained evidence in tranche 3 | inspect security architecture content before adding a targeted item |

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
| Standards bodies: JIS/ITU/IEC/IETF/IEEE/W3C | mixed/lesson-only/zero | determine whether one representative standards question can cover several examples without overfitting |

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

## Recommended first review bundle

The first bundle should stay small and cross-check five clusters before any new batch is drafted:

- service management: ITIL + SLI/SLO + service request/known error;
- cloud: SaaS/PaaS/IaaS + deployment models;
- AI utilization: XAI + HITL + hallucination;
- privacy/legal: anonymized/pseudonymized information + GDPR/JIS Q 15001 + 中小受託取引適正化法;
- development practices: DevOps/DevSecOps + TDD/SRE.

This bundle is broad enough to reveal whether the exact-term audit is undercounting semantic coverage, while remaining small enough to review without destabilizing the production bank.
