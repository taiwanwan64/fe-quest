# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは、`.github/IPA92_PROGRESS_LOG.md` の2026-09-12時点より新しい現在地を残すためのチェックポイントです。再開時は、まずGitHubの現在のmain / open PR / CIを確認し、その後このチェックポイントを参照してください。GitHubの現状がこの文書より新しい場合は、GitHubを正とします。

## 公開リポジトリ

- repository: `taiwanwan64/fe-quest`
- この更新直前のmain: `207066b61f84c9f89233e2921d07228c6f115876`
- public PR #21でP1 modeling / memory interactive labsを追加済み。
- public PR #22〜#25でこのチェックポイントを段階更新済み。
- Pages deployment run #41 は成功。
- PWA cache は `fe-quest-v377-11`。
- 現在の公開問題runtimeは、既存904問 + IPA 9.2 question v1 13問 = 917問のまま。v2〜v6の公開runtime統合は、private側の各本番Import成功後まで行わない。

### 追加済みの操作教材

- `FE92-DESIGN-UML-DFD-ER`: `assets/ipa92-modeling-lab-v377.js`
- `FE92-MEMORY-TLB-REPLACEMENT`: `assets/ipa92-memory-lab-v377.js`
- Venn / sort / graphを含め、iPhone相当の狭い画面で目視・タッチ・スクロール干渉QAが未完了の操作教材は、実装・CI・Pagesデプロイ済みでも `verified-covered` に上げない。

## privateリポジトリ

- repository: `taiwanwan64/fe-quest-private-source`
- この更新直前のmain: `89d50789e5ca0776f53e977ae649f7f4e20c9aaa`
- private PR #20: question batch v2（AI・通信）をCI成功後mainへマージ済み。
- private PR #21: question batch v3（モデリング・DB・GPU・仮想記憶）をCI成功後mainへマージ済み。
- private PR #22: question batch v4（SDN/OAuth・信頼性・サービス継続）をCI成功後mainへマージ済み。
- private PR #23: question batch v5（数値解析・OR/IE・レビュー・PWM・OOP設計）をCI成功後mainへマージ済み。
- private PR #24: question batch v6（代表的アルゴリズム・決定表・コーディング標準・Web）をquestion CI / protected lesson CI成功後mainへマージ済み。

### question batches

- v2 `ipa92-questions-v2`: 14問。AI 8問、通信 6問。Edge Function deploy済み。Import成功時931問。
- v3 `ipa92-questions-v3`: 12問。UML/DFD、E-R、分散DB/2PC、GPU/SIMD、TLB/ページ置換。v2=14必須。Import成功時943問。
- v4 `ipa92-questions-v4`: 12問。SDN/OpenFlow/NFV、OAuth/認証・認可、信頼性設計、RTO/RPO/RLO。v3=12必須。Import成功時955問。
- v5 `ipa92-questions-v5`: 16問。数値解析・誤差・数式処理4、線形計画法・在庫・EOQ4、リファクタリング・レビュー3、PWM2、OOP/SOLID/DDD/MVC3。v4=12必須。Import成功時971問。
- v6 `ipa92-questions-v6`: 16問。`core_03_03` 代表的アルゴリズム10、`core_03_02` 決定表2、`core_12_06` コーディング標準/静的解析2、`core_03_05` Web/Ajax2。正答位置はA/B/C/D各4問。v5=16必須で、未Importなら `v5_not_ready` でfail closedする。Import成功時987問。

Supabase Edge Function `fequest-ipa92-question-import-v2`〜`v6` はすべてdeploy済み。各Importerはprivate `main` + `workflow_dispatch` + GitHub OIDCのみを許可し、既存baselineと先行batchの件数を前後で検証する。

### 重要: v2〜v6の本番Importは未実行

現時点のSupabase active question countは次のまま。

- `v376-protected-final`: 904
- `ipa92-questions-v1`: 13
- 合計: 917

`ipa92-questions-v2`〜`ipa92-questions-v6` はまだ本番question bankへ入っていない。現在利用可能なGitHub連携には新規 `workflow_dispatch` を開始する操作がないため、安全境界を弱めて代替実行しない。

Import順序はImporter側でも **v2 → v3 → v4 → v5 → v6** に強制している。

## protected lessons

- P0/P1のprivate教材overlayはソース・CI側では追加済み。
- 現行のSupabase lesson import manifestはまだ `v376-lessons-1` / 130件。
- 新しいoverlayを含む正規 `Import protected lessons` workflowは未実行。
- private mainからの `workflow_dispatch` に限定された安全境界を維持する。

## 次に進める順序

1. manual `workflow_dispatch` が実行可能になったら、v2 → v3 → v4 → v5 → v6 の順でQuestion Importを実行し、931 → 943 → 955 → 971 → 987問とmanifest/hashを確認する。
2. `Import protected lessons` を正規経路で実行し、130件・新content version・hash・本番表示を確認する。
3. protected Import成功後にだけ、各question batchの公開safe metadata/runtime mergeをpublic側へ追加する。
4. UML/DFD/E-R図、TLB/ページ置換、Venn、sort、graphをiPhone相当の狭い画面で目視・タッチQAし、条件を満たした項目だけ `verified-covered` へ上げる。
5. 現在のcoverage manifestとv1〜v6を照合し、重複追加を避けつつ残るP0/P1のlesson/practice不足を監査する。
6. 96小分類より下の細目/用語例インベントリを公式IPA Ver.9.2を正として拡張し、最終coverage gateへ進む。

## 安全ルール

- GitHubの現在状態を常に正とする。
- 問題・教材・課金ロジックは知財としてprivate/protected境界を維持する。
- 著作物の独自問題・本文は転載せず、追加問題はオリジナルで作成する。
- 既存問題ID・正答・学習履歴・保存/復旧仕様を不用意に変更しない。
- `workflow_dispatch` 限定のImportを、pushや公開エンドポイントへ緩和しない。
- v2 → v3 → v4 → v5 → v6のImport順序を崩さない。
- 実装済みと完全対応済みを区別し、検証前にcoverageを `verified-covered` へ上げない。