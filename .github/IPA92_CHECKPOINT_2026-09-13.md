# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは再開用チェックポイントです。**再開時は必ず GitHub の main / open PR / CI と Supabase の本番状態を先に確認し、実状態を正とします。**

## Current production snapshot

2026-09-13 の最新確認時点:

- public repository: `taiwanwan64/fe-quest`
- public main: `7264680e8c139d4387d4a8cebd8e4d5875275c8a`
- private repository: `taiwanwan64/fe-quest-private-source`
- private main: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- active protected questions: **1003**
- active protected lessons: **130**
- protected question runtime contract: baseline 904 + IPA Ver.9.2 v1–v6 83 + v7 16 = **1003**
- PWA cache remains `fe-quest-v377-12`

Question batch v7 was imported through the existing protected `private main + workflow_dispatch + GitHub OIDC` path and verified in production:

- content version: `ipa92-questions-v7`
- active count: 16
- source commit: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- payload SHA-256: `f391fc2de17d851a1270ff8120e9076ab99dbada0e0fde991908a88aa26c74c5`

Public-safe v7 metadata/runtime activation was merged by PR #33. Protected stems/options/answers/explanations/hints remain private.

## Pages / CI state

The old deploy-guardrail failure from Pages #44 is resolved and is no longer an open issue.

Key successful deployments:

- PR #29: deploy guardrails synchronized to v1–v6 / 987 runtime; Pages #45 succeeded.
- PR #33: v7 public-safe activation / 1003 runtime; Pages #49 succeeded.
- PR #36: service-management/system-audit inventory; Pages #52 succeeded.
- PR #37: system-strategy/system-planning inventory; Pages #53 succeeded.
- PR #38: management-strategy inventory; Pages #54 succeeded.
- PR #39: corporate-activity/legal inventory; Pages #55 succeeded.

For PR #39, all three pull-request checks passed before merge:

- `Validate IPA 9.2 official inventory`
- `Validate sanitized FE QUEST publication`
- `Validate IPA 9.2 question v7 public activation`

The post-merge Pages run #55 (`34739006190`) completed successfully for main `7264680e...`.

## Official IPA Ver.9.2 inventory milestone

Authority:

- IPA 基本情報技術者試験シラバス Ver.9.2
- published 2026-01-08
- official structure: 9 large classifications / 23 middle classifications / 96 small classifications

The evidence-ledger audit has now traversed **all 9 large classifications and all 23 middle classifications**:

1. tranche 1 — 基礎理論
2. tranche 2 — アルゴリズムとプログラミング等
3. tranche 3 — 技術要素 / 中分類7–11
4. tranche 4 — 開発技術 / 中分類12–13
5. tranche 5 — プロジェクトマネジメント / 中分類14
6. tranche 6 — サービスマネジメント・システム監査 / 中分類15–16
7. tranche 7 — システム戦略・システム企画 / 中分類17–18
8. tranche 8 — 経営戦略 / 中分類19–21
9. tranche 9 — 企業活動・法務 / 中分類22–23

Each ledger deliberately distinguishes `direct-covered`, `mixed-evidence`, `lesson-only`, and `no-direct-evidence`. Exact-term zero hits are **not** final missing verdicts; semantic review is required before new content is created.

The final tranche 9 ledger contains 97 findings: direct 12 / mixed 15 / lesson-only 14 / no-direct 56. Important Ver.9.2 legal review candidates include privacy/legal updates and `中小受託取引適正化法`, which currently has lesson-only exact-term evidence.

## Completion gates remain closed

`.github/ipa92-coverage.json` intentionally remains `inventory_state: partial-baseline` and `inventory_complete: false`.

Large-classification traversal is complete, but **full coverage is not yet verified**. The following remain open:

- semantic review of zero/mixed/lesson-only findings
- collision checks against the 1003-question / 130-lesson production corpus
- targeted remediation for genuine gaps
- practice-density verification
- required interactive/visual verification
- iPhone-equivalent visual/touch/scroll QA
- learning-history / save-restore compatibility verification

Do not promote a topic to `verified-covered` merely because it is source-ready, imported, or present in an exact-term probe.

## Next work order

1. Consolidate tranche 1–9 findings into a ranked **semantic-review backlog**.
2. Review high-priority candidates against broader wording and neighboring core-topic content before declaring any genuine gap.
3. For confirmed gaps, create only small original private question/lesson batches after ID/content collision checks.
4. Import through the existing protected workflow only; then expose public-safe metadata after production verification.
5. Run mobile/touch QA and history compatibility checks before any completion gate is promoted.

## Safety rules

- GitHub/Supabase current state is always the source of truth.
- Keep question/material/paywall logic behind the private/protected boundary.
- Never publish protected stems, options, answers, explanations, hints or choice explanations.
- Do not copy copyrighted proprietary questions; new questions are original unless they are public official past questions handled under the project policy.
- Preserve existing IDs, answers, learner history, and save/restore contracts.
- Never weaken the `private main + workflow_dispatch + GitHub OIDC` import boundary.
- Keep `implemented`, `imported`, `deployed`, `source-covered`, and `verified-covered` as separate states.
