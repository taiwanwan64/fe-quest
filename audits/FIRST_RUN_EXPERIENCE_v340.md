# FE QUEST v340 — First-run experience validation

Result: **PASS — FIRST-RUN SETTINGS PRODUCE AN ACTIONABLE ADAPTIVE PLAN WITHOUT DISTURBING EXISTING LEARNERS**

- fresh / zero-history / examDate未設定: 初回設定を表示
- 試験日設定済み: 初回設定を表示しない
- 学習履歴あり: 初回設定を表示しない
- 設定項目: 受験予定日 + 1日30/45/60/90分
- 設定後: 既存 `ensureTodayPlanSnapshot(true)` で今日の計画を再生成
- 生成計画の合計分数: `effectiveStudyMinutes()` と一致
- 既存 `buildTodayTasks()` / QUESTION_BANK / Subject B content: v339と不変
- 科目A: 710問維持
- profile schema: 変更なし
- Subject B semantics: OK
- `refreshProfileUI` / `renderHome` への新しい恒久wrapper: なし
- iPhone向け: 720px以下で1列フォーム、48〜52pxの操作高を確保

初回カードはホームの通常フロー先頭へ挿入し、固定ヘッダーや下部ナビの位置を奪わない。設定後は既存の適応学習ロジックそのものを使い、試験日・学習時間・進捗に基づく今日の計画と理由をその場で表示する。
