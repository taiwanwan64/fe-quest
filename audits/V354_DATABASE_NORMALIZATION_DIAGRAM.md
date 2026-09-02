# FE QUEST v354 — Database normalization lesson diagram

## Result

PASS — `データベース設計`の本文内に、正規化前の受注明細を「注文・商品・注文明細」の3表へ分ける図解を追加した。

## Learner-facing change

- 対象は `core_09_03`「データベース設計」のみ
- 正規化前は、注文情報と商品情報が重複している1つの受注明細表を表示
- 正規化後は、`注文`、`商品`、`注文明細`の3表を表示
- `注文ID`と`商品ID`が表を結ぶ鍵であることを明示
- PCでは正規化前と正規化後を左右比較し、820px以下では前→後の順に縦並び
- 図解は静的な補助説明で、学習完了のための操作を要求しない

## Safety boundary

- profile schema: v5のまま
- 問題数・問題文・正解・解説: 変更なし
- 既存カリキュラム本文: 変更なし
- 学習計画・適応ロジック・保存・復旧: 変更なし
- cloud runtime: v342のまま
- v353アセット: 上書きなし

## Verification

- versioned split release static contract: PASS
- JavaScript syntax: PASS
- desktop Chromium 1366px: 前後比較3列、4表、overflowなし
- mobile WebKit 390px: 前後比較1列、正規化後1列、4表、overflowなし
- 他レッスンへの誤表示: 0
- asset recovery UI: 非表示
- uncaught page error: 0

## Decision

データベース設計の文章例を、重複箇所と表分割後の役割を同じデータで追える図にする。第1〜第3正規形の定義を増やすのではなく、まず「なぜ表を分けるか」を視覚的に理解できる範囲へ限定する。
