# Profile全体 protected data retention 横断監査（2026-09-22）

## 対象

profile / atomic envelope / backup / recovery snapshotへ到達する長期保存fieldを横断確認した。

重点対象:

- `reviewJourneys / reviewJourney`
- `mockMistakeStats`
- `masteryHistory`
- `techniqueStats`
- `dailyPlans`
- `chapterMastery`
- `qStats / sessions / activity / settings`
- 科目Bの途中保存・再開checkpoint

## 安全だった長期保存field

### reviewJourneys

保存されるのは問題ID、分野、テーマ、教材ID、復習stage、誤答回数、日付、source、due等の学習metadata。

問題文・選択肢本文・正答・解説は保存しない。

### mockMistakeStats

誤答回数、原因別count、直近原因、日付、同じ模試誤答を二重計上しないための短いattempt keyだけを保持する。

問題本文・選択肢・正答・解説は保存しない。

### masteryHistory / chapterMastery

習得・再学習の状態、保持率、回数、日付、章末成績のみ。

protected問題本文は保存しない。

### techniqueStats / sessions

`techniqueStats` は集計値のみ。

通常演習の `sessions[].log` も問題ID、分野、テーマ、正誤、所要時間、復習予定等のmetadataだけで、問題本文・正答・解説を保持しない。

解法トレーニングの `techniqueData` は、ユーザー自身が入力した途中式、一般的な条件語、候補index、秒数、確認boolean等であり、protected本文の自動複製ではない。

## 発見した不整合: 科目B途中保存checkpoint

`dailyPlans[*].blockProgressV373` は学習を途中で終了して後から再開するため、profile本体へ保存される。

v433 mainでは、ここにprotected問題の「回答位置」になり得る値が2経路で残っていた。

### 1. アルゴリズム トレース final tail

2回目の予測に正解すると、server grading後のtail packetへ `choiceIndex` が付く。

旧checkpointは、

`traceV376.phase='tail'`

と一緒にこの `choiceIndex` も保存していた。

tailが返るのは正解した場合だけなので、このindexはprotected問題の正答位置そのものになる。

### 2. セキュリティ ケース演習

旧 `securityV376` checkpointは常に直近の `choiceIndex` を保存していた。

- 1回目の誤答後、まだ再挑戦中: そのindexは「既知の誤答」であり、再開時に同じ選択肢を無効化するため必要
- 設問が回答済み: 最後のchoiceIndexが正答位置である場合があり、保存不要

回答済みcheckpointに正答位置を残す必要はない。

## v434 修正

### アルゴリズム tail

新規checkpointではtailの `choiceIndex` を保存しない。

再開時は既存のauthorized `resumeTraceTail` 経路を利用し、server側からすでに獲得済みのtailだけを再取得する。

legacy checkpoint互換として、古い値が存在する場合も `resume.choiceIndex ?? null` で扱える。

### セキュリティ

`choiceIndex` を保存するのは、

- `answered === false`
- `attempts === 1`

の両方を満たす「1回目を誤答し、まだ1回再挑戦できる状態」だけ。

回答済みcheckpointでは `choiceIndex = null` にする。

## 既存profile / backupの浄化

runtimeの新規保存だけ直しても、schema 8 profileや古いbackupに既存answer indexが残り得る。

そのためcurrent normalizationで `dailyPlans` を通す、

- `sanitizeBTraceResumeForPersistenceV434()`
- `sanitizeBSecurityResumeForPersistenceV434()`
- `normalizeDailyPlansForPersistenceV434()`

を追加した。

profile保存・atomic envelope・手動backup・IndexedDB recovery snapshotはcurrent normalized profileを使うため、schema 9へ読み込んだ時点で対象answer indexが除去される。

## profile schema 8 → 9

schema 8 checksumはv433時点のraw `dailyPlans` を含めて計算されている。

v434 sanitizerを先に適用すると、正常なschema 8 profile / backupでもchecksumが変わるため、

- `normalizeProfileDataV8ForChecksum()`
- `profileIntegrityChecksumV8()`

を追加。

schema 8は旧規則でchecksum検証し、その後schema 9 normalizationでcheckpointを浄化する。

過去schema 3〜7のchecksum互換も維持する。

## protected bank

変更なし。

- active protected question total: **1180**
- `b_exam_algo`: **50**
- 問題本文・選択肢・正答・解説の正本はprivate bankのまま

## PWA / CI

- target PWA cache: `fe-quest-v377-116`

publication CIで次を固定する。

- profile schema 9
- schema 8 checksum compatibility
- current profile normalizationがdailyPlans sanitizerを通す
- trace tailの正答choiceIndexを新規checkpointへ保存しない
- security answered checkpointのchoiceIndexを保存しない
- securityの未完了1回目誤答だけは既知の誤答indexを保持可能
- schema 8 checksum compatibility側にはv434 sanitizerを適用しない

Pages deployでも同じ主要境界を検査する。

## 結論

profile全体の長期保存を横断した結果、既存の復習・習得・通常演習・分析fieldはmetadata中心で問題なかった。

新たに見つかった実質的な漏えいは、`dailyPlans` の科目B途中再開checkpointに残るprotected answer positionだった。v434で、再開体験を維持したまま正答位置をprofile / backup / recoveryから除去する。
