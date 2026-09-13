# FE QUEST — IPA Ver.9.2 official inventory tranche 5 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類5「プロジェクトマネジメント」 / 中分類14** against the live FE QUEST production snapshot.

The official syllabus explicitly covers project-management foundations and the integration, stakeholder, scope, resource, time, cost, risk, quality, procurement and communication target groups. The structured evidence ledger is `.github/ipa92-official-inventory-tranche5.json`.

## Audit snapshot

- public main at audit start: `1584da57d063ce46b5907c2811401ee60e27894e`
- private main: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- production active questions: **1003**
- production active protected lessons: **130**

## Findings

The ledger records **40** fine-grained official example-term probes:

- `direct-covered`: **5**
- `mixed-evidence`: **3**
- `lesson-only`: **3**
- `no-direct-evidence`: **29**
- `verified-covered` promotions: **0**

### Strong direct evidence

The strongest direct production evidence in this pass is concentrated in:

- WBS
- PERT
- Gantt chart
- EVM
- risk register

These are meaningful existing strengths, but they are not sufficient to claim the whole project-management category is verified-covered.

### Thin or lesson-only evidence

Examples include project charter, baseline, scope creep, milestone, quality plan and purchase-order terminology. They have some question or lesson evidence but remain below the direct-covered threshold used by this inventory.

### High-value semantic review queue

Many official example terms returned zero exact hits, including PMBOK/JIS Q 21500/PMO, CCB and lessons learned, stakeholder register/analysis, WBS dictionary/work package, responsibility assignment matrix/OBS, CPM/crashing/fast tracking, COCOMO/cost baseline, qualitative and quantitative risk analysis, procurement strategy, and push/pull communication terminology.

Zero exact hits are **not** treated as final missing verdicts. Existing broader project-management questions may test equivalent concepts without using the exact syllabus term. The next content decision must therefore use synonym/core-topic semantic review before adding original protected questions.

## Next step

Continue the official inventory into **大分類6「サービスマネジメント」** while separately reviewing the highest-value tranche 4–5 thin areas. If genuine gaps remain after semantic review, create only a small targeted original batch and preserve the existing private `main + workflow_dispatch + GitHub OIDC` import boundary.

No tranche 5 item is promoted to `verified-covered` until practice density, lesson depth, mobile/interaction requirements where applicable and learning-history compatibility have all been checked.
