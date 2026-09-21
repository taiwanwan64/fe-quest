# 科目B 実戦問題50問 品質・出題バランス監査 — 2026-09-21

## 目的

科目Bの `b_exam_algo` が43問から50問へ拡張された後の live 状態を、公開メタデータ・protected question bank・総合実戦20問モードの3層で照合する。

今回の監査では問題本文を公開GitHubへ移さない。問題文・選択肢・正答・解説の正本は引き続き protected question bank に置く。

## live 基準

- active protected question total: **1180**
- `b_exam_algo`: **50**
- public base catalog の `b_exam_algo`: **43**
- public gap catalog の `b_exam_algo`: **7**
- public 43+7 と private 50 のID集合: **完全一致**
- duplicate ID: **0**

## 50問の分布

### domain

| domain | 問題数 |
|---|---:|
| 制御 | 5 |
| 一次元配列 | 6 |
| 二次元配列 | 5 |
| 再帰・関数 | 5 |
| 木構造 | 6 |
| オブジェクト指向 | 4 |
| リスト | 4 |
| スタック・キュー | 5 |
| ビット列 | 6 |
| 探索・整列 | 4 |

10分野すべて4〜6問に収まり、総合実戦で各分野を最低1問含めるための母集団として不足はない。

### level

- 標準: **24**
- 応用: **26**

総合実戦の標準8問＋応用8問を構成できる。

### format

- 処理結果: **21**
- 途中状態: **12**
- 空欄補充: **8**
- 実行回数: **7**
- 変更予測: **2**

処理結果が最多だが、途中状態・空欄補充・実行回数も十分にあり、総合実戦の形式分散ロジックが機能できる。変更予測は少数だが、独立した出題形式として必須数を固定する設計ではないため、今回の監査では追加を行わない。

### 正答位置

- index 0: **15**
- index 1: **12**
- index 2: **12**
- index 3: **11**

極端な偏りはない。

## 構造・漏えい監査

50問について以下を確認した。

- 選択肢は全問4個
- 同一問題内の選択肢重複: 0
- explanation 空欄: 0
- render title 空欄: 0
- render context 空欄: 0
- render code 空欄: 0
- catalog と render の domain / format / level 不一致: 0
- `id` と `parentId` の契約不一致: 0
- render type 不一致: 0
- pre-submit render に answer / answerIndex / explanation 等の解答情報: 0
- ユーザー向け問題文・解説への「参考書」「参考資料」「本書」「虎の巻」「情報処理教科書」「出るとこだけ」等の混入: 0

短い explanation が7問あるが、実際の内容を確認すると、対象処理の途中値または順序と正答根拠を直接示しており、文字数だけを理由に水増しする必要はないと判断した。

## 新規7問の個別再検算

次の7問を protected bank から live 取得し、stem / options / answer / explanation / render を個別に再検算した。

- `b_exam_bexam_sq_05`: 循環キュー
- `b_exam_bexam_tree_06`: ゲーム木 / ミニマックス
- `b_exam_bexam_bit_06`: 固定ビット幅パッキング
- `b_exam_bexam_algo_04`: クイックソート partition
- `b_exam_bexam_arr_06`: 数式から擬似言語への読み替え
- `b_exam_bexam_mat_05`: 辺リストから隣接行列
- `b_exam_bexam_ctrl_05`: 累積基数変換

7問とも正答・解説・render の整合に問題なし。誤答選択肢も、途中状態の取り違え、演算順序、インデックス、変換規則など学習上あり得る誤りを使っており、明らかに無関係な選択肢は確認されなかった。

protected bank の本文修正は不要と判断したため、active total **1180** と content version は変更しない。

## 発見した統合不整合

provider と public catalog では `b_exam_algo=50` になっていた一方、`assets/app-v377.js` の総合実戦セレクタが参照する `B_EXAM_ALGO_ITEMS` は **43件のまま**だった。

この状態では新規7問は個別の実戦問題として取得可能でも、科目B総合実戦のアルゴリズム16問候補には入らない。

### 修正

- `B_EXAM_ALGO_ITEMS` を public catalog と同じ50件へ同期
- 新規7問の metadata のみを追加し、問題本文・正答は公開しない
- 循環キューとクイックソート partition を sustained-trace 候補へ追加
- runtime で50問と新規7 IDを確認する `B_FINAL_ALGO_POOL_V424_COUNT` 契約を追加
- publication CI で base catalog 43 + gap catalog 7 と app metadata 50 の ID / parentId / level / domain / format を完全照合
- Pages deploy 時も v424 の50問契約が含まれることを検証

## 総合実戦 16 + 4 検証

総合実戦のアルゴリズム選択ロジックを50問へ同期した状態で5,000回構成をシミュレーションした。

- 不正な構成: **0 / 5,000**
- 各回のアルゴリズム問題数: **16**
- 10 domain すべてを毎回含む: **5,000 / 5,000**
- 標準8 + 応用8: **5,000 / 5,000**
- 重複ID: **0**
- sustained-trace floor: 毎回 **4問以上**
- 新規7問: **すべて通常選択されることを確認**

最終 bridge は従来どおり **アルゴリズム16問 + 情報セキュリティ4問 = 20問** を再検証するため、20問構成の契約は維持される。

## 公開契約

- protected question bank: **変更なし**
- active protected question total: **1180のまま**
- `b_exam_algo`: **50のまま**
- provider version: **変更なし**
- PWA cache: `fe-quest-v377-106`

## 結論

50問の内容・分布そのものには、今回すぐに問題追加やprotected本文修正を必要とする欠陥は見つからなかった。

修正が必要だったのは、50問へ拡張した後も総合実戦側の公開メタデータが43問のまま残っていた統合箇所である。これを50問へ同期し、今後同種の取り残しをCIで検出する。
