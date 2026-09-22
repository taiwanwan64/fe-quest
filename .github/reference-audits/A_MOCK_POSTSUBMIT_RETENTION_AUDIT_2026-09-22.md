# 科目A 模試 post-submit protected data retention 監査（2026-09-22）

## 対象

- 科目A フル模試 / ハーフ模試
- `profile.mockHistory`
- profile / atomic envelope / backup / recovery snapshot
- 模試結果直後レビュー、履歴レビュー、学習分析
- schema 7 → 8 移行時のchecksum互換

## 発見した不整合

v431時点では科目Bの総合実戦・短時間実戦は採点後の永続履歴をmetadata-onlyへ縮小していたが、科目A模試の `mockHistory.details` には各問について次が長期保存されていた。

- `shownOptions`: シャッフル後の選択肢本文
- `correctIndex`: 正答位置
- `answerIndex`: ユーザー回答位置
- `id`
- `flagged`
- `seconds`

`mockHistory` はprofile本体だけでなくbackup / recovery snapshotにも入るため、保護問題の選択肢本文と正答位置をpost-submit後も保持し続ける状態だった。

## v432 方針

即時結果レビューの学習体験は維持し、永続化するdetailを分析・履歴レビューに必要なmetadataへ限定する。

### persisted detail

保存する:

- `id`
- `ok`
- `flagged`
- `seconds`

保存しない:

- `shownOptions`
- `correctIndex`
- `answerIndex`
- 問題文
- 選択肢本文
- 解説

attempt単位では従来どおり、日付・full/half・問題数・正答数・未回答数・正答率・所要時間・出題blueprint・分野別集計を保持する。

## 即時レビュー / 履歴レビュー

採点直後の `lastMockAttempt` はメモリ内にfull detailを保持するため、結果画面からの即時レビューでは従来どおり、

- 自分の回答
- 正解
- 問題文
- 解説
- 見直しフラグ
- 問題ごとの所要時間

を確認できる。

履歴から再度レビューする場合、永続履歴には回答本文を保存しないため「回答内容は保存していません」と表示し、正解・問題文・解説は現在のprotected questionを使って確認する。

## analytics互換

従来は `answerIndex === correctIndex` から正誤を再計算していた。

v432では `ok` を保存し、以下を `ok` ベースへ変更する。

- 直近10回答 vs その前10回答の分野trend
- mock wrong count
- mock所要時間分析
- 模試診断
- 履歴レビューの誤答判定

旧schema 7 detailでは `ok` が存在しないため、移行時だけ旧 `answerIndex / correctIndex` から `ok` を導出してから旧answer情報を破棄する。

## profile schema 7 → 8

schema 7 checksumはv431時点のnormalizationで計算されているため、現在のsanitizerをそのまま適用してchecksum検証すると正常な既存データを破損扱いする。

そのため、

- `normalizeProfileDataV7ForChecksum()`
- `profileIntegrityChecksumV7()`

を追加し、schema 7のchecksumはv431規則で検証する。

検証成功後にschema 8 normalizerを通し、`mockHistory` から選択肢本文・正答位置・回答位置を除去する。

## protected bank

変更なし。

- active protected question total: **1180**
- `b_exam_algo`: **50**
- provider version: 変更なし

## PWA

- cache contract: `fe-quest-v377-114`

## CI / Pages契約

publication CIで次を検査する。

- profile schema = 8
- schema 7 checksum compatibility
- `mockHistory` がv432 sanitizerを通る
- full `lastMockAttempt` を永続historyへ直接保存しない
- persisted detailへ `shownOptions / correctIndex / answerIndex` を含めない
- analytics / review判定が `ok` metadataを使える
- v430 / v431 の科目B retention契約を引き続き維持する

Pages deployでもschema 8 / v432 policy / schema 7 checksum互換 / Subject A mock sanitizerを検査する。

## 結論

科目A模試も科目B実戦と同じpost-submit境界へそろえる。採点直後だけfull review detailを使い、profile・backup・recoveryへは学習分析に必要なmetadataだけを保存する。
