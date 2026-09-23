# 科目B セキュリティ ミニ模試 runtime監査 — 2026-09-23

## GitHub基点

- main `686edc100c11323f9c4598fe6476cdb6be5c80c0`（PR #221後）
- 作業開始時のopen PR: 0
- 最新Pages deploy run `35803608580` success

## 発見

公開アプリでは `randomizeSecurityMockItem()` がredacted stubとして `undefined` を返す。`buildSecurityMock()` は選んだ8件をこの関数へmapするため、開始後の最初の描画で問題を表示できない。

さらに `SECURITY_SCENARIOS` はprotected移行時に本文とともに `log` を持たなくなった。従来の `s.log` 判定ではログ読解枠を選べず、format analyticsと旧教材品質診断でもログ読解を誤認する。総合実戦ですでに使用している公開metadataのシナリオID集合を共通して利用する。

## v439修正

- 基礎2・標準4・応用2、標準ログ1・応用ログ1の8つのprotected IDを選ぶ
- 第2問か第3問を選び、security bridge経由でbatch hydrate、結果はserver grading
- 事前パケットは問題文、選択肢、ケース表示データのみで正答位置・解説を含めない
- 未回答は正答位置が0でも誤答とし、全8件のID・正答位置・判定を検証してからXPと履歴を更新
- 提出中は回答を固定し、画面離脱で進行中の読み込みと採点結果を破棄
- 即時レビューを画面離脱時に解放し、永続履歴は既存の分析metadataのみ
- evidence表示をHTML escapeする
- profile schema 9、protected total 1180、`b_exam_algo` 50は変更しない
- PWA cache `fe-quest-v377-121`

`.github/scripts/check-b-security-mini-v439.mjs` では実際の公開scenario metadataを使う8問選択、ログ配分、第2/3問、protected batch、未回答、解放、読み込み中キャンセルを検証する。publicationとPagesの両CIへ組み込む。
