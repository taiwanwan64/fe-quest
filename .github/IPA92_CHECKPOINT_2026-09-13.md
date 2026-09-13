# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは、`.github/IPA92_PROGRESS_LOG.md` の2026-09-12時点より新しい現在地を残すためのチェックポイントです。再開時は、まずGitHubの現在のmain / open PR / CIを確認し、その後このチェックポイントを参照してください。GitHubの現状がこの文書より新しい場合は、GitHubを正とします。

## 公開リポジトリ

- repository: `taiwanwan64/fe-quest`
- この更新直前のmain: `405965a309ea954c0454fb7db3d67d7854941233`
- public PR #21でP1 modeling / memory interactive labsを追加済み。
- public PR #22〜#24でこのチェックポイントを段階更新済み。
- Pages deployment run #40 は成功。
- PWA cache は `fe-quest-v377-11`。
- 現在の公開問題runtimeは、既存904問 + IPA 9.2 question v1 13問 = 917問のまま。v2〜v5の公開runtime統合は、private側の各本番Import成功後まで行わない。

### 追加済みのP1操作教材

1. `FE92-DESIGN-UML-DFD-ER`
   - `assets/ipa92-modeling-lab-v377.js`
   - UMLクラス図 / DFD / E-R図を切り替え可能。
   - 図要素のタップ確認と関係識別ミニ演習を実装済み。

2. `FE92-MEMORY-TLB-REPLACEMENT`
   - `assets/ipa92-memory-lab-v377.js`
   - 3ページフレーム、2エントリTLB、FIFO / LRU比較を実装済み。
   - TLBミスとページフォールトを別概念として操作確認できる。

上記を含むVenn / sort / graphの操作教材は、実装・CI・Pagesデプロイ済みでも、iPhone相当の狭い画面で目視・タッチ・スクロール干渉QAが未完了のものは `verified-covered` に上げない。

## privateリポジトリ

- repository: `taiwanwan64/fe-quest-private-source`
- この更新直前のmain: `fa40034712f6eb91dc7474377e4baac2c51b1ec4`
- private PR #20: question batch v2（AI・通信）をCI成功後mainへマージ済み。
- private PR #21: question batch v3（モデリング・DB・GPU・仮想記憶）をCI成功後mainへマージ済み。
- private PR #22: question batch v4（SDN/OAuth・信頼性・サービス継続）をCI成功後mainへマージ済み。
- private PR #23: question batch v5（数値解析・OR/IE・レビュー・PWM・OOP設計）をquestion CI / protected lesson CI成功後mainへマージ済み。

### IPA 9.2 question batch v2

- content version: `ipa92-questions-v2`
- 14問、すべてFE QUESTオリジナルの科目A問題。
- AI 8問、通信 6問。
- Supabase Edge Function `fequest-ipa92-question-import-v2` はdeploy済み。
- Import成功時の期待active totalは931問。

### IPA 9.2 question batch v3

- content version: `ipa92-questions-v3`
- 12問。
- UML / DFD 2問、E-R / データモデリング 2問、分散DB / 2相コミット 3問、GPU / SIMD 2問、TLB / ページ置換 3問。
- Supabase Edge Function `fequest-ipa92-question-import-v3` はdeploy済み。
- v2=14を前提条件とし、未Importなら `v2_not_ready` でfail closedする。
- Import成功時の期待active totalは943問。

### IPA 9.2 question batch v4

- content version: `ipa92-questions-v4`
- 12問。
- SDN / OpenFlow / NFV 3問、OAuth / 認証・認可 3問、信頼性設計 3問、RTO / RPO / RLO 3問。
- Supabase Edge Function `fequest-ipa92-question-import-v4` はdeploy済み。
- v3=12を前提条件とし、未Importなら `v3_not_ready` でfail closedする。
- Import成功時の期待active totalは955問。

### IPA 9.2 question batch v5

- content version: `ipa92-questions-v5`
- 16問、すべてFE QUESTオリジナルの科目A問題。
- `core_02_07` 数値解析・誤差・数式処理: 4問
- `core_20_03` 線形計画法・在庫・EOQ: 4問
- `core_12_08` リファクタリング・レビュー: 3問
- `core_02_09` PWM: 2問
- `core_12_04` OOP / SOLID / DDD / MVC: 3問
- 正答位置はA/B/C/Dを各4問に固定し、validatorで偏りを検査する。
- v5専用validator、manual importer、PR CI、GitHub OIDC保護Edge Functionを追加済み。
- Supabase Edge Function `fequest-ipa92-question-import-v5` はdeploy済み。
- finalizeは baseline=904、v1=13、v2=14、v3=12、v4=12を必須条件とし、v4未Importなら `v4_not_ready` でfail closedする。
- v5 Import成功時の期待active totalは971問。

### 重要: v2〜v5の本番Importは未実行

現時点のSupabase active question countは次のまま。

- `v376-protected-final`: 904
- `ipa92-questions-v1`: 13
- 合計: 917

`ipa92-questions-v2`〜`ipa92-questions-v5` はまだ本番question bankへ入っていない。現在利用可能なGitHub連携には新規 `workflow_dispatch` を開始する操作がないため、安全境界を弱めて代替実行しない。

Import順序はImporter側でも **v2 → v3 → v4 → v5** に強制している。

## protected lessons

- P0/P1のprivate教材overlayはソース・CI側では追加済み。
- 現行のSupabase lesson import manifestはまだ `v376-lessons-1` / 130件。
- 新しいoverlayを含む正規 `Import protected lessons` workflowは未実行。
- private mainからの `workflow_dispatch` に限定された安全境界を維持する。

## 次に進める順序

1. manual `workflow_dispatch` が実行可能になったら、v2 → v3 → v4 → v5 の順でQuestion Importを実行し、それぞれ931 → 943 → 955 → 971問とmanifest/hashを確認する。
2. `Import protected lessons` を正規経路で実行し、130件・新content version・hash・本番表示を確認する。
3. protected Import成功後にだけ、各question batchの公開safe metadata/runtime mergeをpublic側へ追加する。
4. UML/DFD/E-R図、TLB/ページ置換、Venn、sort、graphをiPhone相当の狭い画面で目視・タッチQAし、条件を満たした項目だけ `verified-covered` へ上げる。
5. P1/P2の残りの問題不足と96小分類より下の細目/用語例インベントリを監査し、独立した小さなoriginal-question batchとして追加する。
6. 公式IPA Ver.9.2を正として最終coverage gateへ進む。

## 安全ルール

- GitHubの現在状態を常に正とする。
- 問題・教材・課金ロジックは知財としてprivate/protected境界を維持する。
- 著作物の独自問題・本文は転載せず、追加問題はオリジナルで作成する。
- 既存問題ID・正答・学習履歴・保存/復旧仕様を不用意に変更しない。
- `workflow_dispatch` 限定のImportを、pushや公開エンドポイントへ緩和しない。
- v2 → v3 → v4 → v5のImport順序を崩さない。
- 実装済みと完全対応済みを区別し、検証前にcoverageを `verified-covered` へ上げない。