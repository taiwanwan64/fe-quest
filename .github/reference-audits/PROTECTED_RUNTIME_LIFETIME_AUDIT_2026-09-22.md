# Protected content runtime lifetime 横断監査（2026-09-22）

## 対象

profile / backup / recovery の永続化境界をv430〜v434で段階的に縮小した後、profile外に残る protected content の寿命を横断監査した。

対象:

- 科目A 通常演習
- 科目A フル / ハーフ模試と即時レビュー
- 初回診断
- 科目B アルゴリズム・トレース
- 科目B セキュリティ演習
- 科目B アルゴリズム ミニ模試
- 科目B 複合問題
- 科目B セキュリティ ミニ模試
- 科目B 総合実戦
- provider の hydrated question / answer cache
- `localStorage / sessionStorage / IndexedDB / history.state`
- DOM と JavaScript runtime の問題文・選択肢・正答・解説・render metadata

## 監査時点

- base main: `bc9db1af7f95de4438b37195e7f7a49c8eb3894c`
- profile schema: **9**
- protected question total: **1180**
- `b_exam_algo`: **50**
- protected question bank: 変更なし

## 既に適切だった境界

### provider cache

`assets/protected-content-provider-v376.js` は、

- hydrated question: `questionCache`
- grading answer: `answerCache`
- question session mapping

を持つが、`clearHydrated / forgetAnswer / clearProtectedCache` を備えている。

各Subject B bridgeも `clear()` でhydrated questionをproviderから解放できる。

### 初回診断

v433で採点完了直後に、

- `diagnosticItems=[]`
- `diagAnswers=[]`
- `diagIndex=0`
- provider protected cache clear

を行うため、結果画面にはaggregate scoreだけが残る。

### profile / backup / recovery

v434までのnormalizationにより、長期profile側は問題本文・選択肢・正答位置などを保存しない。IndexedDB recovery snapshotも同じsanitized profile境界を通る。

### sessionStorage / history.state

- sessionStorageはアクセス用session値に限定
- history.stateは画面ID / depthのみ
- protected question本文を保持する別経路は確認されなかった

## 発見1: 科目B総合実戦 resume が full protected item を localStorage に保存

### v434以前

`saveBFinalResume()` は `fequest_bfinal_resume_v1` に、

- `items:bFinalItems`
- `answers`
- `flags`
- index / time

を保存していた。

`bFinalItems` にはpre-submit protected contentとして、

- 問題文
- 4選択肢
- アルゴリズムのcontext / code / data
- セキュリティのincident / evidence / log
- protected question ID
- 表示順map

が含まれる。

正答・解説はpre-submit validatorで除外されていたが、**問題本文そのものがlocalStorageへ残る**ため、profile外retentionとして不適切だった。

## v435: B-final resume metadata-only v2

同じlocalStorage keyを使用するが、payload内部versionを **2** に変更する。

保存するもの:

- `questionIds`
- `optionMaps`（表示順を復元する0〜3のpermutation）
- ユーザー回答index
- flag
- 現在index
- expiresAt / startedAt / savedAt
- appVersion

保存しないもの:

- 問題文
- 選択肢本文
- context / code / data
- incident / evidence / log
- hint
- 正答
- 解説

reload時はquestion IDから protected bridge を通じて20問を再hydrateし、保存したdisplay permutationを復元してから回答・flag・残り時間を戻す。

旧version 1 payloadは新validatorを通らないため削除する。

## 発見2: 科目A通常演習の途中離脱

正常完了時は `clearSubjectASession()` と `quizItems=[]` を実行していた。

一方、途中で「演習を終了」して問題一覧へ戻る経路ではUIだけを閉じ、hydrated questions / `quizItems` がmemoryに残る経路があった。

### v435

`releaseSubjectAPracticeRuntimeV435()` を追加し、

- provider hydrated Subject-A sessionをclear
- `quizItems / sessionLog` を破棄
- transient answer / reason / retry / technique stateをreset
- 問題文・選択肢・解説DOMをclear

する。

正常完了、途中離脱、problems screenからの離脱で同じcleanupを使う。

## 発見3: 科目A模試の即時レビューmemoryが画面離脱後も残る

v432ではprofile historyはmetadata-only化したが、採点直後レビュー用の、

- `mockItems`
- `lastMockAttempt`
- `reviewItems`
- `currentSimilar`
- answer / correct / explanation DOM

を、模試結果・レビュー画面を離れた後まで保持できる経路が残っていた。

### v435

exam runtimeとresult/review memoryを分離してcleanupする。

- `releaseSubjectAMockExamRuntimeV435()`
- `releaseSubjectAMockResultMemoryV435()`
- `releaseSubjectAMockContextV435()`

即時結果画面・即時レビュー中だけfull detailを保持し、模試メニューへ戻る、教材 / 復習へ移る、mock screenを離れる時に破棄する。

## 発見4: 科目B mode switch / exit がbridge runtimeを必ずしも解放しない

明示的な一覧戻りではtrace/security bridgeをclearしていたが、mode switcherや一部exit経路は表示を切り替えるだけで、

- trace packet / current exercise
- security current scenario
- short-practice items
- B-final exam items
- bridge hydrated cache

がmemoryに残る場合があった。

### v435

`releaseSubjectBProtectedRuntimeV435()` を追加し、Subject Bのmode switch / trace screen離脱で、

- trace bridge + runtime
- security bridge + runtime
- algorithm mini-mock runtime/result memory
- compound bridge/runtime/result memory
- security mini-mock runtime/result memory
- B-final exam runtime/result memory + bridge

を解放する。

B-finalの**metadata-only resume payloadは削除しない**ため、画面離脱やreload後の再開機能は維持する。明示的な「総合実戦を終了」は従来どおりresumeを削除する。

## screen leave guard

通常のボタン経路だけでなく、下部ナビゲーションやブラウザ履歴による画面切替でもcleanupできるよう、base `showScreen()` にruntime hygiene guardを追加した。

初期化途中のTDZを避けるため、全A/B runtime module宣言後に `FEQUEST_RUNTIME_HYGIENE_V435_READY=true` として有効化する。

## profile schema

**9のまま。**

今回変更するのはprofile外localStorage resumeとruntime memory / DOMの寿命であり、profile shapeは変えない。schema 8 checksum compatibilityとv434 sanitizerは変更しない。

## PWA / CI

- target cache: `fe-quest-v377-117`
- publication CI:
  - B-final resume payload v2を検査
  - `items:bFinalItems` のlocalStorage保存を禁止
  - resume save関数内に問題本文 / options / render dataを書き込むfieldがないことを検査
  - reload時のbridge rehydrate + display permutation復元を検査
  - Subject A practice / mock / Subject B runtime cleanup helperを検査
- Pages deploy:
  - v435 policy / resume validator / hydrate helper / runtime cleanup helperを検査

## 結論

profile永続化だけでなく、**ブラウザmemory・DOM・provider cache・profile外localStorageを含めて、「protected contentは現在解いている間か、採点直後の即時レビュー中だけ」に限定する**。

唯一、途中再開に必要なB-final resumeは本文を保存せず、question IDと非本文metadataだけを保持し、再開時にprotected bankから再hydrateする。
