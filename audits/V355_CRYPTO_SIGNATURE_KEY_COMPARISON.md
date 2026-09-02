# FE QUEST v355 — Public-key encryption / digital-signature key comparison

## Result

PASS — 公開鍵暗号とデジタル署名で使う鍵を、同じ列位置の上下2段で比較する図解を追加した。

## Learner-facing change

- 対象は `core_11_02`「暗号技術の基本」と `core_11_03`「デジタル署名と認証局」
- 上段は「受信者の公開鍵で暗号化 → 暗号文 → 受信者の秘密鍵で復号」
- 下段は「文書のハッシュを署名者の秘密鍵で署名 → 文書＋署名 → 署名者の公開鍵で検証」
- 公開鍵と秘密鍵を共通の色・部品で表示し、鍵の向きの違いを比較
- PCでは上下段の処理列を揃え、820px以下では各段を縦方向へ並べる
- 図解は静的な補助説明で、学習完了のための操作を要求しない

## Accuracy boundary

- デジタル署名を「秘密鍵で本文を暗号化する仕組み」とは説明しない
- 署名対象は文書のハッシュであることを明示
- 署名の目的は本文の秘匿ではなく、本人性・改ざん確認であることを明示
- 公開鍵の主体確認には電子証明書が関係することを補足

## Safety boundary

- profile schema: v5のまま
- 問題数・問題文・正解・解説: 変更なし
- 既存カリキュラム本文: 変更なし
- 学習計画・適応ロジック・保存・復旧: 変更なし
- cloud runtime: v342のまま
- v354アセット: 上書きなし

## Verification

- versioned split release static contract: PASS
- JavaScript syntax: PASS
- desktop Chromium 1366px: 2段×5列、列位置一致、overflowなし
- mobile WebKit 390px: 各段1列、overflowなし
- 対象2レッスンで各1件、他レッスンへの誤表示0
- asset recovery UI: 非表示
- uncaught page error: 0

## Decision

暗号化と署名を別々に暗記させず、同じ送受信の形で上下比較する。公開鍵・秘密鍵という同じ用語でも「誰の鍵か」と「目的」が違うことを、列位置と色の対応から追えるようにする。
