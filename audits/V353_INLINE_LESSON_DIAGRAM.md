# FE QUEST v353 — Inline lesson diagram

## Result

PASS — `負の2進数`の本文内に、2の補数を作る3ステップの図解を追加した。

## Learner-facing change

- 対象は `core_01_05`「負の2進数」のみ
- 「仕組み」の説明直後に `+5 → 全bit反転 → 1を加える → -5` を表示
- `+5`と`-5`は同じHTML構造と同じ非折返しレイアウトを使用
- PCでは3ステップを横並び、720px以下では縦並び
- 図解は静的な補助説明で、学習完了のための操作を要求しない

## Safety boundary

- profile schema: v5のまま
- 問題数・問題文・正解・解説: 変更なし
- 既存カリキュラム本文: 変更なし
- 学習計画・適応ロジック・保存・復旧: 変更なし
- cloud runtime: v342のまま
- v352アセット: 上書きなし

## Verification

- versioned split release static contract: PASS
- JavaScript syntax: PASS
- desktop Chromium 1366px: 図解1件、5列、符号とbit列が同一行、overflowなし
- mobile WebKit 390px: 図解1件、1列、符号とbit列が同一行、overflowなし
- asset recovery UI: 非表示
- uncaught page error: 0

## Decision

この図解を、本文内の図解パターンを評価する最初の小さなリリースとして公開する。ほかのレッスンへ一括展開せず、スマートフォンでの読みやすさと学習者の反応を確認してから次の候補を選ぶ。
