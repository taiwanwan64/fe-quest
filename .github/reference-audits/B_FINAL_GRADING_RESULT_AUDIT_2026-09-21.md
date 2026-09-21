# 科目B 総合実戦 採点・結果パイプライン監査 — 2026-09-21

## 目的

科目B総合実戦20問について、表示順に並べ替えた4択回答が server-side grading へ正しく対応し、未回答・通信再試行・結果表示・履歴更新で不整合や二重計上が起きないかを監査する。

## 監査対象

- `assets/app-v377.js`
  - `bFinalProtectedItemV376()`
  - `finishBFinal()`
  - `finishBFinalLegacyV376()`
  - 結果表示 / 誤答復習
- `assets/protected-b-final-bridge-v376.js`
  - `startSession()`
  - `gradeSession()`
- Supabase Edge Function `fequest-question-gate-v376` version 3

## 既存の採点フロー

1. protected bank の4択を受け取る
2. 画面表示用に4択だけshuffleし、`_serverMap` に「表示位置 → server側choice index」を保持
3. 提出時に画面上の選択位置を `_serverMap` でserver indexへ戻す
4. bridge が20問を順番に `answer` endpointへ送る
5. serverが `answerIndex` と explanation を返す
6. app側がserver answer indexを画面表示位置へ戻す
7. 全20問のserver結果取得後にだけ履歴・XP・mistake statsを更新する

pre-submitでは正答index / explanationを持たない。

## 未回答

bridgeでは未回答をserver request上は choiceIndex 0 として送信するが、返却値は

- `blank: true`
- `correct: false`

へ強制される。

app側の最終集計も `bFinalAnswers[i] === null` を未回答として扱い、正解判定は `null === answerIndex` にならないため、正答が0番の問題でも未回答が正解扱いされない。

## 通信再試行

question gate の `answer` action は、同じsessionで同じquestion IDを再送しても回答済みIDを重複追加せず、現在の正答・解説を返す。

app側は20問すべてのgradingが完了するまで `finishBFinalLegacyV376()` を呼ばないため、途中の通信失敗だけでは

- XP
- bFinalHistory
- bFinalStats
- mistake stats

を更新しない。

`bFinalGradeBusyV376` により同時提出も抑止される。

## 発見した不整合

提出前にbridgeのstateを再利用できるか判断する箇所が、従来は次の条件だった。

- modeがfinal
- questionIdsが20件
- app側20 IDがbridge側20 IDにすべて含まれる

これは「同じ集合」であることは確認できるが、**同じ順序**であることは保証しない。

一方、`gradeSession(choiceIndexes)` はbridge内部の `entries[i]` と `choiceIndexes[i]` を同じindexで対応させる。

そのため、異常系で同じ20 IDを別順序で保持したfinal sessionが残った場合、app側の回答配列とbridge側問題順がずれる余地があった。

通常の新規開始・正常な再開では発生しにくいが、採点境界では集合一致ではなく順序一致を要求する方が正しい。

## v427 修正

`B_FINAL_GRADING_V427_SPEC` を追加。

### session順序

`bFinalQuestionOrderMatchesV427(actual, expected)`

- 件数一致
- 各indexのquestion IDが完全一致

を要求する。

一致しない場合は、app側の20 IDを正しい順序で `startSession(ids)` し直してから採点する。

### grading結果順序

`bFinalGradeResultsMatchV427(results, expectedIds)`

により、server grading後も

- 20件
- `results[i].questionId === expectedIds[i]`

を全件確認してから、`answerIndex` を画面表示位置へ戻す。

これにより、結果配列の順序が崩れた場合も誤った問題へ正答・解説を適用しない。

## 維持する仕様

- 20問: アルゴリズム16 + セキュリティ4
- Q1〜Q16: algo / Q17〜Q20: security
- 100分
- 4択の画面内shuffle
- server-side grading
- 未回答は誤答扱い
- XP / history更新は全20問grading完了後
- protected question bank変更なし
- active protected question total: 1180
- `b_exam_algo`: 50

## CI / Pages契約

publication CIで次を確認する。

- v427 grading policy
- exact session order validation
- exact result order validation
- blank answerがcorrect=falseになるbridge契約
- server-side grading維持

Pages deployでもv427 policy / result-order validatorの存在を確認する。

## PWA

- cache contract: `fe-quest-v377-109`

## 結論

通常フローの採点・未回答・履歴更新・通信再試行は整合していた。

修正が必要だったのは、bridge sessionを再利用する際の「同じ20問」の判定が集合一致に留まっていた点である。v427では採点のindex対応を守るため、sessionとgrading resultの両方に完全順序一致を要求する。
