# 科目A 通常演習 / 初回診断 post-submit retention監査（2026-09-22）

## 対象

- 科目A 通常演習
  - `profile.qStats`
  - `profile.sessions[].log`
  - 解法トレーニングの `techniqueData`
- 初回実力診断
  - `profile.diagnosticScores`
  - 診断runtimeの `diagnosticItems / diagAnswers`
- profile / atomic envelope / backup / recovery snapshot
- protected question hydrate / grading / cache解放境界

## 結論

永続profileについては、科目A通常演習・初回診断ともに問題文・選択肢・正答・解説を保存していなかった。

ただし初回診断では、採点完了後もブラウザmemory内の `diagnosticItems` に12問の問題文・選択肢、`diagAnswers` に回答indexが残り続けるruntime保持を発見した。v433で結果表示後にこれらを即時解放する。

## 通常演習の永続データ

### `qStats`

問題IDをkeyとして、主に以下を保持する。

- attempts / correct / streak
- due / last / lastReason
- stability / lapses / reviews
- avgSeconds / timedAnswers
- lastQuality / lastReviewDate
- recovered / retryFailures
- memoryVersion

問題文・選択肢・回答index・正答index・解説本文は保存しない。

### `sessions[].log`

各設問について保持するのは次の学習metadata。

- id / variantId
- cat / concept
- ok / recovered / retryFailed
- seconds
- nextDue / stability
- technique
- techniqueData

問題文・選択肢・正答・解説は保存しない。

### `techniqueData`

- calculation: 学習者自身が入力した途中式（最大120文字）
- reading: アプリ既定の一般的な条件語（例: 「最も適切」「以上」等）のうち選んだ語
- contrast: 比較候補の選択肢indexだけ
- speed: 秒数
- repeat: 確認済みboolean

protected question本文を自動コピーして永続化する経路はない。

## 通常演習の採点後runtime

protected bridgeからの採点結果は一時的に、

- `q.a`
- `q.exp`
- `q.choiceExps`
- `q.__v376PostSubmit`

へ入れて結果UIを描画するが、`gradeCurrentQuestion()` の `finally` で削除する。

セッション終了時には、

- `FEQUEST_V376_PROTECTED_FLOW.clearSubjectASession()`
- `quizItems=[]`

を実行し、provider側のhydrated question cacheも解放する。

## 初回診断の永続データ

12問の採点後、分野ごとに正答数を集計し、profileへ保存するのは、

- `diagnosticCompleted=true`
- `diagnosticScores={分野: 0〜100のscore}`
- 初回のみscreening結果を反映した `skills`
- XP

だけ。

`diagAnswers`、設問本文、選択肢、各設問の正答位置・解説をprofileへ保存しない。

## 発見したruntime保持

v432 mainでは `finishDiagnostic()` が、

1. 12問をserver/providerで採点
2. aggregate scoreをprofileへ保存
3. 結果画面を描画
4. `provider().clearProtectedCache()`

までは行っていた。

一方、bridge内のローカル変数、

- `diagnosticItems`
- `diagAnswers`

は採点後も残っていたため、provider cacheを空にしても診断問題文・選択肢とユーザー回答indexがJS memory上に残っていた。

## v433 修正

`clearDiagnosticRuntimeV433()` を追加し、診断結果を描画した直後に、

- `diagnosticItems=[]`
- `diagAnswers=[]`
- `diagIndex=0`
- `provider().clearProtectedCache()`

を一括実行する。

結果画面は分野別aggregateだけで描画済みなので、表示・学習計画・診断scoreには影響しない。再診断時は通常どおりprotected bankから12問を再hydrateする。

## profile schema / protected bank

- profile schema: **8のまま**
- checksum migration: **不要**
- protected question bank: **変更なし**
- active protected question total: **1180**
- `b_exam_algo`: **50**

永続profile shapeを変更しないためschema bumpは行わない。

## PWA / CI

- PWA cache contract: `fe-quest-v377-115`
- publication CIで次を検査する。
  - `sessions[].log` に問題文・選択肢・正答位置・解説を直接保存しない
  - 診断はaggregate `diagnosticScores` のみprofileへ保存
  - 診断終了後に `diagnosticItems / diagAnswers` を空にする
  - provider protected cacheも同時に解放する
- Pages deployでも診断runtime clear helperの存在を検査する。

## 結論

科目A通常演習の永続profile境界は既にmetadata-onlyで安全だった。初回診断だけ、永続化ではなく採点後memory寿命が長すぎる取り残しがあったため、v433で結果描画直後にprotected runtimeを解放する。
