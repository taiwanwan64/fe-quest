# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは、`.github/IPA92_PROGRESS_LOG.md` の2026-09-12時点より新しい現在地を残すためのチェックポイントです。再開時は、まずGitHubの現在のmain / open PR / CIを確認し、その後このチェックポイントを参照してください。GitHubの現状がこの文書より新しい場合は、GitHubを正とします。

## 公開リポジトリ

- repository: `taiwanwan64/fe-quest`
- この更新直前のmain: `1e7f856d555134b4bd5e2dc0370b83bdf1ea030d`
- public PR #21 `IPA 9.2: add P1 modeling and memory interactive labs` はCI成功後mainへマージ済み。
- public PR #22 / #23でこのチェックポイントを段階更新済み。
- Pages deployment run #39 は成功。
- PWA cache は `fe-quest-v377-11`。
- 現在の公開問題runtimeは、既存904問 + IPA 9.2 question v1 13問 = 917問のまま。v2/v3/v4の公開runtime統合は、private側の各本番Import成功後まで行わない。

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
- この更新直前のmain: `501d1ef3193a739266c7b00ac431529db785da08`
- private PR #20: question batch v2（AI・通信）をCI成功後mainへマージ済み。
- private PR #21: question batch v3（モデリング・DB・アーキテクチャ・仮想記憶）をCI成功後mainへマージ済み。
- private PR #22: question batch v4（SDN/OAuth・信頼性・サービス継続）をquestion CI / protected lesson CI成功後mainへマージ済み。

### IPA 9.2 question batch v2

- content version: `ipa92-questions-v2`
- 14問、すべてFE QUESTオリジナルの科目A問題。
- AI 8問（SVM、PCA、CNN、RNN、基盤モデル、LLM、プロンプト関連）。
- 通信 6問（AM/FM/PM、PCM、ビット/フレーム同期、TDM/FDM）。
- v2専用validator、manual importer、PR CI、GitHub OIDC保護Edge Functionを追加済み。
- Supabase Edge Function `fequest-ipa92-question-import-v2` はdeploy済み。
- v2 Import成功時の期待active totalは931問。

### IPA 9.2 question batch v3

- content version: `ipa92-questions-v3`
- 12問、すべてFE QUESTオリジナルの科目A問題。
- `core_12_03` UML / DFD: 2問
- `core_09_03` E-R図 / データモデリング: 2問
- `core_09_08` 分散DB / 2相コミット: 3問
- `core_04_01` GPU / SIMD: 2問
- `core_06_01` TLB / ページフォールト / FIFO・LRU: 3問
- 正答位置はA/B/C/Dを各3問に固定し、validatorで偏りを検査する。
- Supabase Edge Function `fequest-ipa92-question-import-v3` はdeploy済み。
- finalizeは baseline=904、v1=13、v2=14を必須とし、v2未Importなら `v2_not_ready` でfail closedする。
- v3 Import成功時の期待active totalは943問。

### IPA 9.2 question batch v4

- content version: `ipa92-questions-v4`
- 12問、すべてFE QUESTオリジナルの科目A問題。
- `core_10_10` SDN / OpenFlow / NFV: 3問
- `core_11_08` OAuth / 認証・認可 / アクセストークン: 3問
- `core_05_04` フェールセーフ / フェールソフト / fault avoidance・tolerance: 3問
- `core_15_08` RTO / RPO / RLO: 3問
- 正答位置はA/B/C/Dを各3問に固定し、validatorで偏りを検査する。
- v4専用validator、manual importer、PR CI、GitHub OIDC保護Edge Functionを追加済み。
- Supabase Edge Function `fequest-ipa92-question-import-v4` はdeploy済み。
- finalizeは baseline=904、v1=13、v2=14、v3=12を必須とし、v3未Importなら `v3_not_ready` でfail closedする。
- v4 Import成功時の期待active totalは955問。

### 重要: v2 / v3 / v4の本番Importは未実行

現時点のSupabase active question countは次のまま。

- `v376-protected-final`: 904
- `ipa92-questions-v1`: 13
- 合計: 917

`ipa92-questions-v2`、`ipa92-questions-v3`、`ipa92-questions-v4` はまだ本番question bankへ入っていない。現在利用可能なGitHub連携には新規 `workflow_dispatch` を開始する操作がないため、安全境界を弱めて代替実行しない。

Import順序はImporter側でも **v2 → v3 → v4** に強制している。

## protected lessons

- P0/P1のprivate教材overlayはソース・CI側では追加済み。
- ただし現行のSupabase lesson import manifestはまだ `v376-lessons-1` / 130件。
- 新しいoverlayを含む正規 `Import protected lessons` workflowは未実行。
- こちらもprivate mainからの `workflow_dispatch` に限定された安全境界を維持する。

## 次に進める順序

1. manual `workflow_dispatch` が実行可能になったら、private mainから `Import IPA 9.2 question extensions v2` を実行し、14問追加・active total 931・manifest/hashを確認する。
2. v2成功後に v3 を実行し、12問追加・active total 943・manifest/hashを確認する。
3. v3成功後に v4 を実行し、12問追加・active total 955・manifest/hashを確認する。
4. `Import protected lessons` を正規経路で実行し、130件・新content version・hash・本番表示を確認する。
5. v2/v3/v4のprotected Import成功後にだけ、それぞれの問題の公開safe metadata/runtime mergeをpublic側へ追加する。
6. UML/DFD/E-R図、TLB/ページ置換、Venn、sort、graphをiPhone相当の狭い画面で目視・タッチQAし、条件を満たした項目だけ `verified-covered` へ上げる。
7. P1の残り（数値解析、線形計画法/EOQ、リファクタリング/レビュー、PWM、OOP設計等）の問題不足を、小さなoriginal-question batchで追加する。
8. 96小分類より下の細目/用語例インベントリを公式Ver.9.2を正として拡張し、最終coverage gateへ進む。

## 安全ルール

- GitHubの現在状態を常に正とする。
- 問題・教材・課金ロジックは知財としてprivate/protected境界を維持する。
- 著作物の独自問題・本文は転載せず、追加問題はオリジナルで作成する。
- 既存問題ID・正答・学習履歴・保存/復旧仕様を不用意に変更しない。
- `workflow_dispatch` 限定のImportを、pushや公開エンドポイントへ緩和しない。
- v2 → v3 → v4のImport順序を崩さない。
- 実装済みと完全対応済みを区別し、検証前にcoverageを `verified-covered` へ上げない。