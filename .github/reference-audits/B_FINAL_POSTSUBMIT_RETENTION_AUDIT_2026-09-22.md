# 科目B 総合実戦 post-submit protected data retention監査 — 2026-09-22

## 目的

科目B総合実戦20問の採点後に、問題文・ユーザー回答・正解・解説などのprotected contentが、結果画面での即時レビューを越えてprofile / localStorage / backup / recovery snapshotへ必要以上に永続化されていないかを監査する。

## 監査対象

- `assets/app-v377.js`
  - `finishBFinalLegacyV376()`
  - `bFinalHistory`
  - profile normalize / checksum / migration
  - backup / recovery snapshot
  - result reviewから離れる際のmemory cleanup
- 現行 profile schema: v5
- 現行 PWA cache: `fe-quest-v377-111`

## 発見した不整合

従来の `finishBFinalLegacyV376()` は、即時結果レビュー用のfull detailをそのまま `profile.bFinalHistory` へ保存していた。

detailには次が含まれていた。

- `questionId`
- `sourceId`
- `title`
- `q`（問題文）
- `selected`（ユーザー回答）
- `correct`（正解）
- `explain`（解説）
- `studyMode`
- `kind / format / domain / ok`

`profile.bFinalHistory` は通常profileへ保存されるため、これらはlocalStorageだけでなく、

- 一世代前の正常データ
- IndexedDB recovery snapshot
- 手動backup export
- import前 / 手動復元前のrollback

にも含まれ得る。

一方、永続履歴を参照する現行機能を列挙すると、実際に必要なのは主に次の情報だった。

- 受験日時
- 正答数 / 未回答数 / 正答率
- 所要時間
- algorithm / security別正答数
- format別analytics用の `kind / format / domain / ok`

過去履歴の問題文・選択回答・正答・解説は、通常の履歴一覧・readiness・学習時間見積り・format analyticsには不要。

## v430 方針

### 1. persisted historyをanalysis metadataへ縮小

`bFinalHistoryAttemptForPersistenceV430()` と `bFinalHistoryDetailForPersistenceV430()` を追加。

永続化するattempt:

- `date`
- `total`
- `correct`
- `blank`
- `points`
- `rate`
- `seconds`
- `timeUp`
- `algoCorrect`
- `secCorrect`
- `details`

永続化するdetail:

- `kind`
- `format`
- `domain`
- `ok`

次は永続化しない。

- 問題ID
- 問題タイトル
- 問題文
- ユーザー選択肢
- 正解文字列
- 解説
- 復習先ID

即時結果レビュー用のfull attemptは `lastBFinalAttempt` と結果画面DOMのみに保持する。

### 2. profile schema 5 → 6

履歴の保存形を変更するため、profile schemaを **5 → 6** へ上げる。

既存ユーザーの学習履歴を壊さないため、

- `normalizeProfileDataV5ForChecksum()`
- `profileIntegrityChecksumV5()`

を追加し、schema 5のraw profile / atomic envelope / backupは**旧schema 5の正規化規則でchecksum検証**してからschema 6へ移行する。

schema 5のchecksum検証では従来どおりfull `bFinalHistory` を含める。検証成功後のschema 6 normalizationでprotected detailを削減する。

これにより、既存profileを新しいnormalizerで先に縮小してchecksum mismatchを起こすことを避ける。

### 3. backup互換

backup importのchecksum検証も `profileChecksumForSchema(candidate, schema)` に統一。

- schema 3 → v3 checksum
- schema 4 → v4 checksum
- schema 5 → v5 checksum
- schema 6 → current checksum

既存backupを読み込む際も、checksumを旧形式で検証後、schema 6へ安全に正規化する。

### 4. runtime memory

採点成功後、結果画面の描画が終わった時点で、重複していたexam runtimeを破棄する。

- `bFinalItems`
- `bFinalAnswers`
- `bFinalFlags`
- index / startedAt / seconds

即時結果レビュー用のfull `lastBFinalAttempt` は結果画面表示中のみ保持する。

次の場合はfull review memoryとreview DOMを破棄する。

- 結果画面から「次の科目Bへ」進む
- 誤答から復習モードへ移る
- 新しい総合実戦が正常に開始する

## 維持する学習機能

永続historyのmetadataだけで次を維持できることをコード参照で確認した。

- 総合実戦回数
- ベスト正答率
- 直近正答率
- readiness
- 1回目のalgorithm / security比較
- 科目B format別analytics
- 学習時間見積り
- mistake statsによる弱点domain / repeat mistake
- 問題別の誤答理由

誤答理由・miss回数は `bFinalMistakeStats`、出題回数・正答回数は `bFinalStats` が正本であり、過去historyへ問題本文を残す必要はない。

## protected bank

変更なし。

- active protected question total: **1180**
- `b_exam_algo`: **50**
- provider version: 変更なし

## CI / Pages契約

publication CIで次を確認する。

- profile schema = 6
- v5 checksum compatibilityの存在
- backup checksumがschema dispatcherを使うこと
- `bFinalHistory` がv430 sanitizerを通ること
- full attemptを直接historyへ保存しないこと
- persisted detail helperに protected content fieldを含めないこと
- 採点後にexam runtimeを解放すること

Pages deployでもschema 6 / v430 policy / v5 checksum compatibilityを検証する。

## PWA

- cache contract: `fe-quest-v377-112`

## 結論

総合実戦のprotected化ではpre-submit漏えいは防げていたが、採点後のfull review detailが学習profileへ長期保存されていた。

v430では、即時レビューの使い勝手は維持したまま、永続profile・backup・recovery snapshotには分析に必要なmetadataだけを残す。profile schema 6とschema 5専用checksum互換を組み合わせることで、既存学習データを壊さずに移行する。
