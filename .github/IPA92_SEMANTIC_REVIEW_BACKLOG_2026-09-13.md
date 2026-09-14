# FE QUEST — IPA Ver.9.2 semantic-review backlog — 2026-09-13

## Purpose

The tranche 1–9 evidence-ledger traversal has reached all 9 large classifications and all 23 middle classifications. This file ranks **semantic review**, not confirmed missing content.

A topic belongs here when exact-term evidence is weak (`mixed-evidence`, `lesson-only`, or `no-direct-evidence`) but the official Ver.9.2 syllabus makes the concept worth checking against broader wording, neighboring core topics, and existing lesson context.

**Do not create a new protected batch solely because a term appears here.** Each candidate must first survive semantic review and collision checks against the current **1104 questions / 130 lessons** production corpus.

## Priority contract

- **SR-P0** — review first: current-syllabus specificity plus broad/foundational relevance, cross-topic importance, or a notable Ver.9.2-era legal/technology update.
- **SR-P1** — review next: important but narrower concepts, or topics with some existing indirect evidence.
- **SR-P2** — later review: specialist examples/terminology where independent practice may not be necessary if the parent concept is already well covered.

These priorities are review order only; they are not claims about exam frequency.

## Completed first-pass semantic review / remediation

Broader neighboring concepts already covered in the corpus were not duplicated solely because an exact official term was absent. Direct-practice additions below are **not automatically `verified-covered`**; practice-density, visual/interactive need, mobile QA, and learning-history gates remain separate.

- **v8:** SLI/SLO; service request/known error; SaaS/PaaS/IaaS and deployment models; XAI/HITL/hallucination; anonymized/pseudonymized information; 中小受託取引適正化法.
- **v9:** ITIL/JIS Q 20000; CAB/PIR; DevOps/DevSecOps/TDD/SRE/MLOps; GDPR/JIS Q 15001/電子署名法.
- **v10:** WCAG/responsive Web design/heuristic evaluation/usability testing; three-schema; key-value/document NoSQL; CSMA/CD/CSMA/CA/spanning tree; RADIUS/QoS; secure boot; stub/condition coverage. Boundary-value analysis and equivalence partitioning were reviewed but not duplicated because direct semantic practice already existed.
- **v11:** 情報流通プラットフォーム対処法/発信者情報; cloud-native/cloud-by-default; test driver and stub/driver distinction. The former SR-P0 queue completed its first pass here.
- **v12 requirements engineering:** SysML/UML; user stories/acceptance criteria; use-case diagrams; mockups; prototyping; mockup/prototype distinction. Bidirectional traceability was reviewed but not duplicated because requirements-to-design/test traceability already existed semantically.
- **v13 development-process variants:** low-code, no-code, pair programming, mob programming, KPT, YAGNI.
- **v14 project-management detail:** PMO, WBS dictionary, COCOMO, CCB. Responsibility matrix/RACI was reviewed but not duplicated because existing material already teaches the relevant role/responsibility-matrix semantics.
- **v15 service/facility:** AIOps, operations job scheduling, hot-aisle/cold-aisle layout, MDF, Green IT. Existing CPU scheduling was explicitly treated as a different concept from operations job scheduling.
- **v16 IT governance/internal control:** COSO, CSA, JIS Q 38500 / IT governance, and IT general controls versus application controls.
- **v17 enterprise architecture:** EA, WFA, SOA, and the Zachman framework.
- **v18 strategy frameworks:** VRIO, growth matrix, and 3C. Value-chain analysis already had direct semantic practice, so no duplicate question was added; its lesson context was reinforced instead.
- **v19 modern marketing:** persona + customer-journey map, dynamic pricing, subscription model, omnichannel, and SEO + LPO. Seven official terms were represented by five application/comparison questions rather than one definition question per term.
- **v20 technology strategy:** MOT, open innovation, innovator's dilemma, lean startup, and PoC/PoV. Existing technology-development/roadmap semantics were kept as the foundation, while five original questions add six missing decision distinctions.
- **v21 digital business:** digital twin/CPS, smart contract, eKYC, CBDC, NFT. Existing IoT/e-business foundations were retained; five original comparison/application questions cover six missing named patterns without one-definition-per-term inflation.

## SR-P0 — first pass complete

The former immediate SR-P0 clusters for UI/accessibility, database architecture, network/access control, secure boot, test-driver variants, cloud modernization terminology, and platform/provider legal terminology have all received semantic review. Confirmed gaps were remediated through v10–v11; already-covered concepts were not duplicated.

SR-P0 is therefore no longer the immediate content-expansion queue. Practice-density and the other final verification gates remain open independently.

## SR-P1 — remaining semantic-review pass

Requirements engineering, development-process variants, project-management detail, service/facility, IT governance/internal control, enterprise architecture, strategy frameworks, modern marketing, technology strategy, and digital business have completed their first semantic-review/remediation pass through v12–v21. The remaining SR-P1 queue is:

| Cluster | Current evidence signal | Review target |
|---|---|---|
| Industrial/consumer tech: edge AI, HEMS, M2M, smart factory/agriculture, MaaS, autonomous driving | zero evidence | verify parent IoT/business-industry coverage and prioritize representative examples |
| Corporate/data analysis: BCP/BCM/BIA, regression/moving average, BI/data mining, box plot/heat map | thin/zero evidence | inspect OR/statistics/business-analysis content for equivalent practice |
| Accounting: balance sheet / P&L / cash-flow statement / ROA / ROE | lesson-only or mixed | determine whether direct calculation/interpretation practice is sufficient |
| Labor/contracts: 36 Agreement, Worker Dispatching Act, disguised contracting, NDA/GPL/LGPL | mixed/lesson-only/zero | verify distinctions and current legal naming |
| Standards bodies: JIS/ITU/IEC/IETF/IEEE/W3C | mixed/lesson-only/zero | determine whether representative standards practice can cover several examples without overfitting |

## Practice-density track — independent from semantic breadth

A topic can be semantically present and still lack enough varied repetition for reliable learning. In parallel with the remaining SR-P1/SR-P2 review, inspect the live question bank by `coreTopicId`, distinct concept/decision rule, difficulty, and cognitive demand.

Do not inflate the bank with repetitive definition questions merely to raise counts. A density gap should be remediated only when learners need materially different applications, calculations, comparisons, or judgment patterns.

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

Next, review **industrial/consumer technology** narrowly against the current production corpus:

- edge AI
- HEMS
- M2M
- smart factory / smart agriculture
- MaaS
- autonomous driving

First inspect existing IoT, edge computing, AI inference, sensor/actuator, manufacturing/agriculture, mobility and business-system material. Exact-term absence alone is not enough to justify a question. Prefer representative distinctions — for example, inference near the data source, household energy optimization, machine-to-machine communication, IoT-driven industrial optimization, integrated mobility services, and sensing/decision/control in automated vehicles — rather than six interchangeable vocabulary questions.

In parallel, continue practice-density verification on classifications whose syllabus breadth is already strong.
