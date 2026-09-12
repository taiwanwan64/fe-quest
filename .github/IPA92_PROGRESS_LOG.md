# FE QUEST — IPA Ver.9.2 完全対応フェーズ進捗ログ

このファイルは `.github/FEQUEST_IPA92_COMPLETE_COVERAGE_PHASE.md` の実行ログです。
別チャット・別Workセッションでは、GitHubの現在状態を確認した後、このログの最新エントリから再開してください。

## 2026-09-12 — フェーズ基盤を本番mainへ導入

### 完了
- PR #9 `Start IPA Ver.9.2 complete coverage phase` をCI成功後にmainへマージ。
- 永続ハンドオフ `.github/FEQUEST_IPA92_COMPLETE_COVERAGE_PHASE.md` を追加。
- 機械可読カバレッジ表 `.github/ipa92-coverage.json` を追加。
- カバレッジ表バリデータ `.github/scripts/check-ipa92-coverage.mjs` を追加。
- PR CIでカバレッジ表の構造、ID重複、状態値、優先度、completion gateを検査するようにした。

### main
- フェーズ基盤マージ直後: `620d29a9cf707f0f91922f5d78b74d2e2b8d2645`

## 2026-09-12 — P0「集合・ベン図」タッチ操作ラボを本番導入

### 完了
- PR #10 `Add touch-interactive Venn diagram lab for IPA 9.2` をCI成功後にmainへマージ。
- main: `51163bd19f05f6789b5fa362a269915877df0394`
- GitHub Pages deployment run #22: success。
- PWA cache: `fe-quest-v377-7`
- first-impression UX layer: `v377-first-impression-ux-7`

### 実装内容
- 既存の「図解・操作ラボ（任意）」へ「集合・ベン図」を追加。
- SVG図そのものをタップして、次の4領域を選択可能。
  - Aのみ
  - A∩B
  - Bのみ
  - AにもBにも入らない外側
- 表示切替:
  - A
  - B
  - A∩B
  - A∪B
  - ¬A
  - ¬B
  - ¬(A∩B)
  - ¬A∪¬B
  - ¬(A∪B)
  - ¬A∩¬B
- ド・モルガンの法則は、異なる式で同一領域になることを視覚確認できる。
- 「式を見て対応領域をタップする」練習モードを追加。
- 図を直接タップできない環境向けに領域ボタンも用意。
- Escapeで閉じる、フォーカス復帰、aria属性、pressed状態、reduced-motion、スマホ用タッチ領域を実装。
- 既存教材130テーマ、既存問題、問題ID、正答、Profile Schema、学習履歴は変更していない。

### 品質確認
- PR CI: success。
- `node --check` で以下を構文検証するCIを追加。
  - `.github/scripts/check-ipa92-coverage.mjs`
  - `assets/first-impression-ux-v377.js`
  - `sw.js`
- 公開用bundleにVennラボ識別子と対応CSSが存在することをCIで検証。
- protected/private content漏えい検査を継続。
- Pages本番デプロイ: success。

### 意図的に未完了扱い
`.github/ipa92-coverage.json` の `FE92-THEORY-SET-VENN` は、実装・CI・本番デプロイが済んでも、スマホ実機相当でのタッチ操作・見た目・誤タップ・スクロール干渉の確認が済むまでは `in-progress` のままにする。

また、PWAの「試験範囲: Ver.9.2対応」という断定表示は、完全監査終了前として不正確なため「Ver.9.2対応強化中」へ変更した。

## 2026-09-12 — IPA Ver.9.2 全23中分類・96小分類インベントリをmainへ導入

### 完了
- IPA公式シラバスを正として、23中分類・96小分類のインベントリを登録。
- CI検証を追加し、既存FE QUESTの内容を起点にするのではなく、公式シラバス側から漏れを探せる状態にした。
- main: `6e12b886993b25fb3bc5a9f9cbe8c067682e5496`

## 2026-09-12 — P0不足教材を非公開正本へ連続補完

教材本文を公開リポジトリへ置かず、非公開教材正本の既存130テーマへ `appendArticleHtml` オーバーレイとして追加した。既存テーマID、学習履歴、問題IDを変更していない。各変更はprivate PR → Protected Lessons materialization CI → main mergeの順で実施した。

### P0-1 述語論理
- 対象: `core_02_01`
- private PR #1でmainへマージ済み。
- 述語、全称・存在、量化の否定、演繹推論と帰納推論などを補強。
- 状態: **教材ソース実装済み / 本番Import・表示・問題確認待ち**

### P0-2 形式言語・正規表現・BNF
- 対象: `core_02_04`
- private PR #2でmainへマージ済み。
- 形式言語、言語の演算、正規表現、BNF、終端/非終端記号、構文図式、文脈自由文法、有限オートマトンとの関係を補強。
- 状態: **教材ソース実装済み / 本番Import・表示・問題確認待ち**

### P0-3 応用数学
- 対象: `core_02_06`、`core_03_01`
- private PR #3でmainへマージ済み。
- マルコフ過程、仮説検定、p値、第1/第2種の誤り、検出力、無向/有向グラフ等を補強。
- 状態: **教材ソース実装済み / 本番Import・表示・問題確認待ち**

### P0-4 通信理論
- 対象: `core_10_01`、`core_10_09`
- private PR #4をCI成功後mainへマージ。
- private main基準: `1448372eefb8f46895f8d09d65ce760fb4648df6`
- AM/FM/PM/PCM、FDM/TDM、パリティ、CRC、チェックサム、ハミング符号、ECC、ARQ/FEC、各種信号同期を補強。
- IPA Ver.9.2の当該FE範囲で明示されない項目を必須教材として過剰追加しない方針を採用。
- 状態: **教材ソース実装済み / 本番Import・表示・問題確認待ち**

### P0-5 AI技術詳細
- 対象: `core_02_05`
- private PR #5をCI成功後mainへマージ。
- private main基準: `e458612f9008301a0d680ce3535dc8d98567725e`
- SVM/PCA、学習評価、ニューラルネットワーク/ディープラーニング、CNN/RNN、生成モデル、基盤モデル/LLM、プロンプトエンジニアリング等を補強。
- 同PRで `ipa92_lesson_overrides*.json` の自動検出・ソート合成へ変更し、今後の分野別オーバーレイ追加漏れを防止。
- 状態: **教材ソース実装済み / 本番Import・表示・問題確認待ち**

### P0-6 アルゴリズム不足
- 対象: `core_03_02`、`core_03_03`
- private PR #6をCI成功後mainへマージ。
- private main基準: `ff05fd5ef43b3e732e248fa1a5dd2947e7fef345`
- 決定表、分割統治、マージ/挿入/シェル/ヒープソート、文字列照合、整列/併合/コントロールブレーク/編集処理を補強。
- 整列アルゴリズムは公開coverageで操作教材必須のため、private教材追加だけでは完了扱いにしない。
- 状態: **教材ソース実装済み / 本番Import・表示・問題・操作教材確認待ち**

### P0-7 プログラミング作法・Webプログラミング
- 対象: `core_12_06`、`core_03_05`
- private PR #7をCI成功後mainへマージ。
- private main基準: `1d70ab4f59ab78dbf51e9b19a4f7999ca95f5c61`
- コーディング標準（インデンテーション、ネスト深度、命名規則、使用制限、モジュール分割、レビュー、静的解析）を補強。
- Webプログラミング（クライアント/サーバ、サーバサイド、Ajax、リッチクライアント、Apache HTTP Server、フロントエンドフレームワーク）を補強。
- OOPの追加細目はP0を広げず、P1/横断監査で別途確認する。
- 状態: **教材ソース実装済み / 本番Import・表示・問題確認待ち**

### protected lessonの安全策
- 材料化後の教材総数は130件固定でCI検証。
- overlayの同一テーマID二重定義はCI失敗。
- `script` / `iframe` / `form` 等のactive HTML、イベント属性、`javascript:` URLを禁止。
- private教材本文は公開リポジトリへ置かない。
- 本番Importはprivate mainからの既存 `workflow_dispatch` に限定し、安全条件を弱めない。

### 重要: coverageの状態について
教材ソースが実装されたことと、細目が完全対応済みであることは別とする。`.github/ipa92-coverage.json` は、本番Import・表示確認・必要な演習・操作教材の確認が済むまで `verified-covered` へ上げない。P0-1〜P0-7の該当項目は、順次 `missing` / `thin` から `in-progress` へ同期する必要がある。

## 次にやること

優先順位は次の通り。

1. `.github/ipa92-coverage.json` のP0-1〜P0-7該当項目を、事実に合わせて `in-progress` へ安全に同期する。
2. マージ/挿入/シェル/ヒープソートのスマホ対応タッチ操作教材を公開側に追加する。
3. 正規の `Import protected lessons` workflow をprivate mainから実行し、130件Import成功と本番表示を確認する。
4. 述語論理、形式言語、応用数学、通信、AI、アルゴリズム、プログラミング/Webの対応問題を追加・検証する。
5. ベン図をiPhone相当の狭い画面で目視・タッチ確認し、条件を満たせば `FE92-THEORY-SET-VENN` を `verified-covered` へ更新する。
6. P1項目とOOP等の横断監査を進める。
7. 最終的にIPA全96小分類を「教材・問題・図解/操作・履歴互換」の各軸で照合する。

## 再開時の安全ルール

- 必ずGitHubの現在のmain・作業ブランチ・open PR・CIを最初に確認する。
- このログよりGitHubの現状が新しい場合はGitHubを正とする。
- 既存問題ID・正答・学習履歴を壊さない。
- 著作物の独自問題・本文を転載しない。
- 1つのまとまりごとにPR/CI/mergeの証跡を残す。
- `.github/ipa92-coverage.json` の状態を、実装の事実より先に完了へしない。

## 2026-09-12 — P0操作教材・P1教材ソースを追加しcoverageを再同期

この節は上の古い「次にやること」より新しい現在地であり、再開時はこちらを優先する。

### 公開側
- P0集合・ベン図に加え、マージ/挿入/シェル/ヒープソートのタッチ操作ラボ、グラフ理論・探索ラボを本番Pagesへ導入済み。
- public PR #17でP0の実装済み項目を `in-progress` へ同期済み。
- P1教材ソースの進捗に合わせ、数値解法、線形計画法、多重化、UML/DFD/E-R図、分散DB/2相コミット、GPU、TLB/ページ置換、SDN、OAuth、RTO/RPO、信頼性設計、EOQ、リファクタリング/レビュー、PWMを `in-progress` へ同期する。
- OOP/SOLID/DDD/MVC/デザインパターンは独立追跡項目 `FE92-DESIGN-OOP-SOLID-DDD` を新設する。
- OAuthはVer.9.2で直接確認した必須側、OpenID Connectは関連知識の補足として扱い、必須範囲を過剰拡張しない。

### private教材正本
以下はすべてprivate PR → Protected Lessons CI成功 → main merge済み。
- PR #10: DB・設計モデリング（E-R、DFD、UML、分散DB、2相コミット）
- PR #11: OS・アーキテクチャ（GPU、SIMD、仮想記憶、TLB、FIFO/LRU）
- PR #12: ネットワーク・認可（SDN/OpenFlow/NFV、OAuth）
- PR #13: 信頼性・サービス継続（フェールセーフ等、RTO/RPO/RLO）
- PR #14: 在庫管理・EOQ
- PR #15: 数値解法、線形計画法、PWM、リファクタリング/レビュー
- PR #16: OOP、SOLID、多相性、DDD、MVC、デザインパターン
- private main基準: `cc05766799cf56f969347072e8a10ae4a787158e`

### 意図的に未完了
- protected lessonの現行オーバーレイは、本番 `Import protected lessons` 未実行のため `verified-covered` へ上げない。
- P0/P1の対応問題は、現在の正本パイプラインを特定してから追加・検証する。古い問題材料化スクリプトをそのまま正本と仮定しない。
- `interactive: required` のUML/E-R、TLB/ページ置換等は公開操作教材とスマホ相当確認が必要。
- 23中分類・96小分類より下の細目/用語例インベントリは未完了。

### 現在の次作業
1. public coverage同期PRをCI成功後mainへマージする。
2. private repoで現行の問題正本・問題Import経路を特定し、P0/P1にオリジナル問題を追加する安全な経路を確立する。
3. `interactive: required` のP1操作教材を追加する。
4. 正規の手動 `workflow_dispatch` が利用可能になった時点でprotected lessonsを本番Importし、130件・表示・ハッシュを確認する。
5. 96小分類より下の細目/用語例を公式Ver.9.2から登録して、残存ギャップを再監査する。
