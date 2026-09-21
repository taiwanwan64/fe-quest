# 科目B 総合実戦 再開データ整合性監査 — 2026-09-21

## 目的

科目B総合実戦20問を途中でリロード・再起動した場合の再開データが、protected 化後の 16問＋4問構成と採点契約を壊さず、安全に復元できるかを監査する。

## 監査対象

- `assets/app-v377.js`
  - `saveBFinalResume()`
  - `readBFinalResume()`
  - `restoreBFinalResume()`
  - `finishBFinal()`
- `assets/protected-b-final-bridge-v376.js`
- v424: b_exam_algo 50問同期契約
- v425: アルゴリズム16問 → セキュリティ4問のruntime順序契約

## 監査で確認した既存動作

総合実戦の途中状態は `fequest_bfinal_resume_v1` に保存される。

保存対象:
- 20問の表示用item
- ユーザー回答
- 「後で見る」フラグ
- 現在位置
- 残り時間
- 開始時刻 / 保存時刻

再開後に提出する際、protected bridge のサーバ側sessionが失われていても、20個の protected question ID を使って `startSession(ids)` を再実行してから採点するため、リロード後もserver-side gradingへ復帰できる。

## 発見した不足

従来の `restoreBFinalResume()` は、

- items が20件
- answers が20件
- 残り時間が正

であることだけを主に見て復元していた。

そのため、localStorage が破損・部分更新・古い形式との混在などで不整合になった場合でも、次のような値を十分に弾けなかった。

- 16問＋4問のkind順が崩れている
- protected question ID が重複している
- 選択肢とserver index mapの形が壊れている
- answer indexが0〜3以外
- flag / current indexが範囲外
- pre-submit itemへ正答・解説系fieldが混入している
- appVersion / resume schemaが一致しない

通常利用では発生しにくいが、再開データは採点直前の入力になるため、復元時に明示的な境界検証を置く方が安全。

## v426 修正

`B_FINAL_RESUME_V426_SPEC` を追加し、既存の resume schema 1 を維持したまま復元前validationを追加した。

### item単位

`bFinalResumeItemValidV426(item,index)`

- protected question ID: 安全なID形式
- sourceId: 非空文字列
- 問題文: 文字列
- options: 4件
- `_serverMap`: 0,1,2,3 の重複なし4件
- Q1〜Q16: `algo`
- Q17〜Q20: `security`
- pre-submit itemに `a / answerIndex / correctText / explain / explanation / choiceExplanations` が存在しないこと

### payload全体

`bFinalResumePayloadValidV426(s)`

- resume schema = 1
- appVersion = 現行APP_VERSION
- items / answers = 20件
- protected question ID = 20件すべて一意
- answers = null または 0〜3
- flags = 0〜19、重複なし
- current index = 0〜19
- expiresAt / startedAt / savedAt = 数値化可能
- item単位validationを全件通過

不正payloadは `clearBFinalResume()` で破棄し、総合実戦画面を復元しない。

## 保持する仕様

- 既存resume key: 変更なし
- schema version: 1のまま
- 100分タイマー: 変更なし
- 20問構成: 16 + 4 のまま
- 問題選択: 変更なし
- 採点: server-side grading のまま
- protected question bank: 変更なし
- active protected question total: 1180
- `b_exam_algo`: 50

## CI / Pages契約

publication CIへ、次の存在を検証する契約を追加する。

- v426 policy
- 16 / 4 のitem順validation
- 20 protected IDsの一意性
- pre-submit answer-field guard
- `restoreBFinalResume()` がvalidatorを通してから復元すること

Pages deployでもv426 policyとvalidator本体の存在を確認する。

## PWA

- cache contract: `fe-quest-v377-108`

## 結論

再開機能の基本フロー自体は成立していたが、保存データの「件数」から一歩進んだ構造検証が不足していた。

v426では保存形式を変更せず、復元時だけ防御的validationを追加したため、既存の途中受験データとの互換性を保ちながら、破損・不整合状態を総合実戦runtimeへ持ち込むリスクを下げる。
