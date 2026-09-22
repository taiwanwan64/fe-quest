# 科目B 総合実戦 セキュリティ誤答履歴識別監査 — 2026-09-22

## 目的

科目B総合実戦の結果画面で、セキュリティ4問の誤答理由・繰り返し誤答判定・復習導線が「実際に出題された設問」単位で管理されているかを確認する。

## 発見した不整合

セキュリティ問題は1シナリオにつき3設問あり、総合実戦では主に第2問または第3問を選ぶ。

一方、従来の誤答履歴キーは

`security:<scenario sourceId>:<format>`

だった。

`format` はシナリオ単位で「ログ読解」または「ケース判断」になるため、同じシナリオの第2問と第3問が同じkeyへ集約される。

この状態では、別設問の誤答でも

- 同じ問題を繰り返し間違えたように見える
- 誤答理由が別設問へ引き継がれる
- 結果画面の「繰り返し誤答」の精度が下がる

可能性がある。

## v428 修正

- final result detailへ `questionId:item._protectedQuestionId` を保存
- algorithmは従来どおり `sourceId` を誤答identityに使用
- securityだけ `protected question ID` を誤答identityに使用
- 過去の履歴detailに `questionId` がない場合は従来の `sourceId` へfallbackする

これにより新しい受験では `b_security_xxx_2` と `b_security_xxx_3` を別設問として扱える。

## 互換性

- profile schema migrationなし
- 既存のalgorithm mistake stats keyは変更なし
- 過去のsecurity historyはfallbackで表示可能
- protected question bank変更なし
- active protected question total: 1180
- `b_exam_algo`: 50

## CI / Pages

publication CIとPages deployへ、次を検証する契約を追加。

- `security-question-specific-mistake-identity`
- algorithm identity = sourceId
- security identity = protectedQuestionId
- result detailへ protected question IDを保持

## PWA

- cache contract: `fe-quest-v377-110`

## 結論

総合実戦の採点自体には影響しないが、結果画面の学習診断ではセキュリティの別設問が同一誤答として混ざる余地があった。v428で新規受験分を設問単位へ分離し、過去履歴の読取り互換性も維持する。
