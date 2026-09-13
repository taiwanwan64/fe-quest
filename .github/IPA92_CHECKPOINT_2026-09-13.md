# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは、`.github/IPA92_PROGRESS_LOG.md` の2026-09-12時点より新しい現在地を残すためのチェックポイントです。再開時は、まずGitHubの現在のmain / open PR / CIを確認し、その後このチェックポイントを参照してください。GitHubの現状がこの文書より新しい場合は、GitHubを正とします。

## 公開リポジトリ

- repository: `taiwanwan64/fe-quest`
- この更新直前のmain: `1b170a0fdf11f7455832c8c1f56aaebc50d67b5a`
- public PR #21 `IPA 9.2: add P1 modeling and memory interactive labs` はCI成功後mainへマージ済み。
- public PR #22でこのチェックポイントの初版をmainへマージ済み。
- Pages deployment run #38 は成功。
- PWA cache は `fe-quest-v377-11`。
- 現在の公開問題runtimeは、既存904問 + IPA 9.2 question v1 13問 = 917問のまま。v2/v3の公開runtime統合は、private側の各本番Import成功後まで行わない。

### 追加済みのP1操作教材

1. `FE92-DESIGN-UML-DFD-ER`
   - `assets/ipa92-modeling-lab-v377.js`
   - UMLクラス図 / DFD / E-R図を切り替え可能。
   - 図の要素をタップして役割を確認し、関係の識別ミニ演習を行う。
   - 公開CIに構文検査と決定論的self-checkを追加済み。

2. `FE92-MEMORY-TLB-REPLACEMENT`
   - `assets/ipa92-memory-lab-v377.js`
   - 3ページフレーム、2エントリTLB、参照列を1件ずつ進める。
   - FIFO / LRUを切り替えてページ置換を比較する。
   - TLBミスとページフォールトが別概念であることを操作で確認できる。
   - self-checkでは同一参照列に対してFIFO=6 page faults、LRU=7 page faultsを固定検証する。

### 公開側でまだ完了扱いにしないもの

- 上記2操作教材は実装・CI・Pagesデプロイまで完了したが、iPhone相当の狭い画面での目視・タッチ・スクロール干渉確認が未実施のため、coverageは `in-progress` のままとする。
- Venn / sort / graphについても、completion gateを満たすまでは実装済みという理由だけで `verified-covered` へ上げない。

## privateリポジトリ

- repository: `taiwanwan64/fe-quest-private-source`
- この更新直前のmain: `971e1834981095b7881996f894936e0b9b051286`
- private PR #20 `IPA 9.2: add AI and communications question batch v2` はCI成功後mainへマージ済み。
- private PR #21 `IPA 9.2: add modeling, database and memory question batch v3` は、初回CIでEdge Functionの型定義不整合を検出・修正した後、question CIとprotected lesson CIの両方が成功してmainへマージ済み。

### IPA 9.2 question batch v2

- content version: `ipa92-questions-v2`
- 追加予定数: 14問、すべてFE QUESTオリジナルの科目A問題。
- 内訳:
  - AI: 8問（SVM、PCA、CNN、RNN、基盤モデル、LLM、プロンプト関連）
  - 通信: 6問（AM/FM/PM、PCM、ビット/フレーム同期、TDM/FDM）
- v2専用validator、manual importer、PR CI、GitHub OIDC保護Edge Functionを追加済み。
- Supabase Edge Function `fequest-ipa92-question-import-v2` はdeploy済み。
- importerは private `main` + `workflow_dispatch` + GitHub OIDC のみ許可し、既存904問とv1 13問が維持されていることをImport前後で検証する。
- v2 Import成功時の期待active totalは931問。

### IPA 9.2 question batch v3

- content version: `ipa92-questions-v3`
- 追加予定数: 12問、すべてFE QUESTオリジナルの科目A問題。
- 内訳:
  - `core_12_03` UML / DFD: 2問
  - `core_09_03` E-R図 / データモデリング: 2問
  - `core_09_08` 分散DB / 2相コミット: 3問
  - `core_04_01` GPU / SIMD: 2問
  - `core_06_01` TLB / ページフォールト / FIFO・LRU: 3問
- 正答位置はA/B/C/Dを各3問に固定し、validatorで偏りを検査する。
- v3専用validator、manual importer、PR CI、GitHub OIDC保護Edge Functionを追加済み。
- Supabase Edge Function `fequest-ipa92-question-import-v3` はdeploy済み。
- v3 finalizeは baseline=904、v1=13に加えて **v2=14を必須条件** とする。v2未Importの状態では `v2_not_ready` でfail closedする。
- v3 Import成功時の期待active totalは943問。

### 重要: v2 / v3の本番Importは未実行

現時点のSupabase active question countは次のまま。

- `v376-protected-final`: 904
- `ipa92-questions-v1`: 13
- 合計: 917

`ipa92-questions-v2` と `ipa92-questions-v3` はまだ本番question bankへ入っていない。現在利用可能なGitHub連携には新規 `workflow_dispatch` を開始する操作がないため、安全境界を弱めて代替実行しない。

v3はv2が14問正常にImportされた後にだけ実行できるよう、Importer側でも順序を強制している。

## protected lessons

- P0/P1のprivate教材overlayはソース・CI側では追加済み。
- ただし現行のSupabase lesson import manifestはまだ `v376-lessons-1` / 130件。
- 新しいoverlayを含む正規 `Import protected lessons` workflowは未実行。
- こちらもprivate mainからの `workflow_dispatch` に限定された安全境界を維持する。

## 次に進める順序

1. manual `workflow_dispatch` が実行可能になったら、private mainから `Import IPA 9.2 question extensions v2` を実行し、14問追加・baseline 904・v1 13・active total 931・manifest/hashを確認する。
2. v2成功確認後に `Import IPA 9.2 question extensions v3` を実行し、12問追加・v2 14・active total 943・manifest/hashを確認する。
3. `Import protected lessons` を正規経路で実行し、130件・新content version・hash・本番表示を確認する。
4. v2/v3のprotected Import成功後にだけ、それぞれの問題の公開safe metadata/runtime mergeをpublic側へ追加する。
5. UML/DFD/E-R図、TLB/ページ置換、Venn、sort、graphをiPhone相当の狭い画面で目視・タッチQAし、条件を満たした項目だけ `verified-covered` へ上げる。
6. P1の残りの問題不足を監査し、独立した小さなoriginal-question batchとして追加する。
7. 96小分類より下の細目/用語例インベントリを公式Ver.9.2を正として拡張し、最終coverage gateへ進む。

## 安全ルール

- GitHubの現在状態を常に正とする。
- 問題・教材・課金ロジックは知財としてprivate/protected境界を維持する。
- 著作物の独自問題・本文は転載せず、追加問題はオリジナルで作成する。
- 既存問題ID・正答・学習履歴・保存/復旧仕様を不用意に変更しない。
- `workflow_dispatch` 限定のImportを、pushや公開エンドポイントへ緩和しない。
- v2 → v3のImport順序を崩さない。
- 実装済みと完全対応済みを区別し、検証前にcoverageを `verified-covered` へ上げない。