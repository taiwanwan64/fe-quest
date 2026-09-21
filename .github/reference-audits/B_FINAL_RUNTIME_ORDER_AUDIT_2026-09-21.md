# 科目B 総合実戦20問 runtime順序監査 — 2026-09-21

## 目的

科目B総合実戦の protected 化後も、20問の構成・出題順・再開処理・採点時の保護境界が従来の設計意図どおり維持されているかを確認する。

## 監査対象

- `assets/app-v377.js`
- `assets/protected-b-final-bridge-v376.js`
- `assets/protected-content-provider-v376-v35.js`
- public catalog / protected bank の `b_exam_algo`
- 総合実戦の 16問＋4問選出ロジック

## 確認できた不整合

旧来の総合実戦では、アルゴリズム16問と情報セキュリティ4問を選んだ後、安定分割によって

1. アルゴリズム16問
2. 情報セキュリティ4問

の順に並べる設計になっていた。

protected 移行後の live `bFinalSelectDescriptorsV376()` は、アルゴリズム16問＋セキュリティ4問をまとめて `shuffled(...)` していたため、両区分が20問の中で混在していた。

これは問題数・採点自体は壊さないが、既存の「アルゴリズム16問 → セキュリティ4問」という総合実戦の順序契約と不一致だった。

## 修正

`bFinalSelectDescriptorsV376()` を次の方針へ変更した。

- アルゴリズム16問を選ぶ
- 情報セキュリティ4問を選ぶ
- アルゴリズム16問の内部順だけをランダム化
- セキュリティ4問の内部順だけをランダム化
- 最後に `[アルゴリズム16問, セキュリティ4問]` の順で連結

これにより、分野の並びが毎回固定されることは避けつつ、区分の境界は維持する。

## runtime契約

`B_FINAL_RUNTIME_ORDER_V425_SPEC` を追加。

- policy: `algorithm-16-then-security-4`
- algorithmCount: 16
- securityCount: 4
- totalCount: 20
- preservesQuestionSelection: true
- randomizesWithinBlocks: true
- changesOnlyFinalRuntimeOrder: true

選択された問題集合、難易度バランス、domain coverage、採点方式、100分タイマーは変更しない。

## 50問プールとの整合

直前の v424 監査で以下を確認済み。

- `b_exam_algo`: 50
- 標準24 / 応用26
- 10 domain すべて4〜6問
- 総合実戦では16問を標準8 / 応用8で構成
- 10 domain を毎回最低1問含む
- sustained-trace を毎回4問以上確保
- 新規7問も通常の選択候補に入る

v425 はこの問題選択ロジックを変更せず、20問内の区分順だけを修正する。

## 再開・採点

総合実戦の再開データは、問題本文・表示順・ユーザー回答・残り時間をローカルへ保存する。

再読込後に提出する場合、protected bridge の session が失われていても `finishBFinal()` が20個の protected question ID を使って `startSession(ids)` を再実行し、その後サーバ側採点を行うため、再開後も採点可能。

pre-submit の item には正答 index / explanation を含めず、正答と解説は `gradeSession()` 後にだけ反映する契約を維持する。

## CI

publication CI に次を追加。

- v425 policy の存在
- アルゴリズムとセキュリティを区分内で別々に `shuffled()` すること
- 16問＋4問をその順で連結すること
- 先頭16問が algo、末尾4問が security である runtime assertion の存在
- 20問全体を再び一括 shuffle しないこと

Pages deploy でも v425 policy と区分内ランダム化契約を確認する。

## 公開・保護データ

- protected question bank: 変更なし
- active protected question total: 1180
- `b_exam_algo`: 50
- provider version: 変更なし
- PWA cache: `fe-quest-v377-107`

## 結論

総合実戦の問題集合・難易度・採点には問題はなかったが、protected 移行後に20問全体が混在する順序ドリフトが生じていた。

v425 で「アルゴリズム16問 → セキュリティ4問」を復元しつつ、各区分内のランダム性は維持した。
