# FE QUEST v352 — Learning-priority Progress Dashboard Audit

Status: **PASS — DASHBOARD HIERARCHY AND BALANCE VALIDATED**  
Previous production: **v351**  
Target production: **v352**  
Profile schema: **v5**

## Observed problem

The v351 repair made every card readable, but the dashboard still reflected its former left-rail / right-settings-rail structure. Related seven-day charts were separated, high-value pace and allocation information competed with cloud/application maintenance cards, and the right side carried more technical content than the learning dashboard.

## Repair

- `試験日ペース` and `今日の配分` are the first dashboard pair.
- `今週の学習` and `7日間の復習予報` are adjacent, equal-width comparison cards.
- The lower desktop area uses two independent equal-width columns:
  - left: `試験準備度` → `学習設定`
  - right: `記憶の健康状態` → `学習ロードマップ`
- The lower column totals are deliberately balanced instead of forcing unrelated cards into equal-height rows.
- Verbose final-readiness gates are folded under `仕上げ判定の詳細`.
- `アカウント・クラウド同期` and `アプリ・データ` are moved below all learning cards into a closed `アカウント・アプリ・データ` details section.
- Recovery notices automatically open the collapsed data section before navigating to recovery tools.
- At 1100px and below, the dashboard returns to a single learning-priority order without horizontal overflow.

## Automated evidence

Static release contract: **29 / 29 PASS**

Local Chromium preflight:

| Case | Dashboard contract | Result |
|---|---|---|
| 1920 × 1080 | 545px equal columns; weekly charts share Y position; lower column bottoms differ by 20px | PASS |
| 1366 × 900 | 445px equal columns; weekly charts share Y position; lower column bottoms differ by 11px | PASS |
| 1024 × 900 | single-column learning-priority order; data tools remain folded | PASS |
| 390 × 844 | single-column mobile order; 296px cloud email field when opened; no overflow | PASS |

The pull-request workflow repeats all desktop/tablet cases in Chromium and the mobile case in Playwright WebKit. It also opens the technical-data fold and verifies the cloud/PWA cards, email width, no document/card overflow, no asset-recovery overlay, and no uncaught page error.

## Safety boundary

- v351 assets remain unchanged and available for rollback.
- Question content, answer keys, adaptive planning, pace calculation, profile schema, saved learning data, Recovery Center, JSON backup, and cloud synchronization behavior are unchanged.
- JavaScript changes are limited to the v352 version identifier and opening the new data fold before recovery navigation.
- The v342 cloud runtime remains optional, local-first, and mounted immediately before the app-data card.
