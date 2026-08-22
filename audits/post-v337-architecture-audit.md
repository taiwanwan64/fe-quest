# FE QUEST v338 — post-v337 architecture audit

実施日: 2026-08-22  
対象: v337 `main` `112459d275ecc97d2d3b511ee39e21cb33fbae32` → audit-only v338  
結果: **PASS — V338 ARCHITECTURE INVENTORY COMPLETE; LEARNER BEHAVIOR UNCHANGED**

## 結論

v338では学習者向け挙動・ユーザーデータスキーマを変更せず、v339以降の安全な整理に必要な実行経路を棚卸しした。

- 完成版 `index.html`: **3,671,870 bytes**
- runtime hard `assert()` 呼出: **54件**
- `index.html` include source: **45件**
- version番号を持つoverride/patch: **37件**（組込み 36 / 未参照 1）
- 科目A問題: **710問維持**
- candidate v338 と untouched v337 parent の主要適応学習contract: **同一**
- profile/settings key contract: **同一**
- Subject B semantic diagnostics: **OK**
- schema変更: **なし**

## hard assert棚卸し

| 分類 | 件数 |
| --- | --- |
| CI移行候補 | 47 |
| diagnostic/contract統合候補 | 0 |
| runtime安全候補 | 7 |

全件の行番号・包含関数・文脈は `_regression/post-v337-architecture-audit-v338.fixture.json` に保存した。分類はv339の着手順を決めるための静的分類であり、機械的な一括削除は行わない。

## 多重ラップ上位

| 関数 | 推定深度 | 上書き順 |
| --- | --- | --- |
| renderBFinalResult | 5 | subject-b-final-remediation-overrides-v217.txt → subject-b-final-xp-overrides-v219.txt → subject-b-wrong-answer-feedback-overrides-v230.txt → subject-b-review-reason-route-overrides-v243.txt → subject-b-security-review-reason-label-overrides-v245.txt |
| buildBFinal | 3 | subject-b-final-overrides-v208.txt → subject-b-final-order-overrides-v214.txt → subject-b-final-security-rotation-overrides-v239.txt |
| subjectBHubRecommendation | 3 | subject-b-readiness-overrides-v222.txt → subject-b-algorithm-domain-progression-overrides-v227.txt → subject-b-local-adaptive-recommendation-overrides-v257.txt |
| finishCompoundChallenge | 2 | subject-b-wrong-answer-feedback-overrides-v230.txt → subject-b-local-performance-overrides-v254.txt |
| finishSecurityMock | 2 | subject-b-wrong-answer-feedback-overrides-v230.txt → subject-b-local-performance-overrides-v254.txt |
| startBExercise | 2 | subject-b-transfer-retrace-overrides-v262.txt → subject-b-transfer-retrace-array-overrides-v264.txt |
| answerSecDecision | 1 | subject-b-wrong-answer-feedback-overrides-v230.txt |
| bFinalRemediationTarget | 1 | subject-b-remediation-difficulty-overrides-v249.txt |
| bFinalReviewReasonMeta | 1 | subject-b-security-review-reason-label-overrides-v245.txt |
| bMockCandidateFromExercise | 1 | subject-b-wrong-answer-feedback-overrides-v230.txt |
| buildBMock | 1 | subject-b-session-overrides-v205.txt |
| buildMockQuestions | 1 | subject-a-mock-selection-diversity-overrides-v306.txt |

推定深度は現行include順で同名関数へ再代入する回数。v339では上位から1責務ずつ、単一実装 + 明示hookへ寄せる。

## versioned override / 依存順

fixtureに現行include順と未参照ファイルを全件保存した。未参照versioned sourceは即削除せず、release reference用途を確認してから「削除可能 / reference用途 / 保留」に再分類する。

## 完成版サイズ

- total: 3,671,870 bytes
- `<style>` payload: 231,671 bytes
- `<script>` payload: 3,345,690 bytes
- その他HTML概算: 94,509 bytes

### include source責務別

| 構成 | bytes | 完成版比率 |
| --- | --- | --- |
| base-stable | 2991671 | 81.5% |
| learning-patches | 405723 | 11.0% |
| 科目B override | 123721 | 3.4% |
| diagnostic/release | 77945 | 2.1% |
| 科目A quality override | 45372 | 1.2% |
| UX/data behavior override | 24744 | 0.7% |
| other included source | 2475 | 0.1% |

これはv341分割判断用のUTF-8静的容量であり、圧縮後networkサイズではない。

## 起動時validation候補

| 候補 | 本体bytes | assert数 | 末尾80KB呼出 |
| --- | --- | --- | --- |
| runLessonUXAudit | 24142 | 0 | 2 |
| ensureVersionRecoveryCheckpoint | 5581 | 0 | 2 |
| runStorageSelfTest | 4534 | 0 | 2 |
| validateSubjectBSemantics | 4146 | 0 | 1 |
| checkForAppUpdate | 1140 | 0 | 11 |
| validateImportedProfile | 196 | 0 | 2 |

実ブラウザmsは断定せず、起動末尾80KBに現れるvalidate/run/check/ensure系呼出と静的本体サイズを整理した。v339で「起動必須 / CIへ移行 / 遅延diagnostic」を決める。

## v338回帰contract

fixtureに `buildTodayTasks()`、`ensureTodayPlanSnapshot()`、`examStudyPhase()` 14/7/3/1/0日、`taskAllocation()` 45/60/90分、`nextLessonChoice()`、`nextBChoice(20)`、`trackedQuestionPool()`、profile/settings key set、主要関数SHA-256を保存した。candidateとv337 parentは同一で、mechanical v338 referenceとも6ファイルbyte一致した。

## v339の着手順

1. hard assertの **CI移行候補** からruntime停止経路を外す。
2. diagnostic/contractと重複するassertを非破壊診断へ統合する。
3. 多重ラップ上位 `renderBFinalResult`、`buildBFinal`、`subjectBHubRecommendation` から第1対象を選び、呼出順を変えずに整理する。
4. 未参照versioned overrideを再分類する。
5. 各変更後にv338 behavior fixture、710問、130テーマ、Subject B semantics、保存・復旧・PWAを回帰確認する。

## 注意

hard assert分類とwrap深度は安全な着手順を決める静的監査であり、意味を確認せず一括削除するためのものではない。v339も大規模一括書き換えを行わない。
