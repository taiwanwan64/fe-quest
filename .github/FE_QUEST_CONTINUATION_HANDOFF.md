# FE QUEST — 次チャット引き継ぎ

> **重要:** このファイルは作業再開の入口です。ここに書かれた状態を盲信せず、次チャットでは必ず GitHub の live 状態（main / 作業ブランチ / open PR / CI / Pages deploy）を最初に再確認し、GitHub の現状を正としてください。

## 次チャットでユーザーが送る文

> FE QUEST開発の続きです。最新版をGitHubから実際に読み取り、main・現在の作業ブランチ・PR・CIの状態を確認して、前回の続きから進めてください。過去の記憶だけで判断せず、GitHubの現状を正としてください。

この一文を受けたら、以下の順で復旧してください。

## 1. 最初に確認するもの

1. `main` の最新 SHA
2. open PR 一覧
3. open PR があれば head branch と最新 SHA
4. GitHub Actions の直近 CI / Pages deploy の状態
5. `.github/REFERENCE_MATERIAL_AUDIT_POLICY.md`
6. `.github/reference-audits/` の最新章監査
7. 必要な場合は保護教材の lesson bank の現行 payload / content_version

過去会話の記憶より、上記 live 情報を優先すること。

## 2. 2026-09-20 時点のスナップショット

このファイル作成直前の確認値。**次回は必ず再確認すること。**

- main: `1b4eb6d77290e0d41cb7b7b657c32859a0d1399b`
- open PR: 0
- active work PR: なし
- 最新本番 deploy: GitHub Actions run `35503792519`、success
- PWA cache contract: `fe-quest-v377-80`
- 第1章詳細図解 PR: #118、merged
- 第2章詳細図解 PR: #117、merged
- 第3章詳細図解 PR: #120、merged
- 第4章詳細図解 PR: #122、merged
- 第5章詳細図解 PR: #128、merged
- 第6章詳細図解 PR: #130、merged
- 第7章詳細図解 PR: #132、merged
- 第8章詳細図解 PR: #134、merged
- 第9章詳細図解 PR: #136、merged
- 第10章詳細図解 PR: #138、merged
- 第11章詳細図解 PR: #140、merged
- 第12章詳細図解 PR: #142、merged
- 第13章詳細図解 PR: #144、merged
- 第14章詳細図解 PR: #146、merged
- 第15章詳細図解 PR: #148、merged
- 第16章詳細図解 PR: #150、merged
- 第17章詳細図解 PR: #152、merged
- 第18章詳細図解 PR: #154、merged
- テスター用アクセスコード一時解除 PR: #124、merged

## 3. 現在のテストアクセス状態

2026-09-20、ユーザー指示により **テスター用アクセスコード入力をいったん解除** した。

- 問題・教材とも、通常利用時にアクセスコード入力ダイアログを出さずに利用できる。
- `assets/protected-content-provider-v376.js`、`assets/protected-content-provider-v376-v35.js`、`assets/protected-lesson-provider-v376.js` は `OPEN_PREVIEW_ACCESS=true`。
- 初回診断前の「招待コードを入力してください」という案内は非表示化済み。
- 入力ダイアログの実装自体は削除せず、将来アクセス制限を戻しやすいよう残してある。
- Supabase Edge Function:
  - `fequest-question-gate-v376` version 3
  - `fequest-lesson-gate-v376` version 2
  - コード未入力のオープンプレビュー要求をサーバ側の専用アクセス枠へ割り当てる。
- Supabase `fequest_beta_access_private` に `open-preview-v1` を有効化。
  - max questions/day: 500
  - max lessons/day: 500
  - max questions/session: 60
  - max sessions: 100000
- 問題本文・教材本文の正本は引き続き private bank にあり、公開GitHubへ移していない。
- PR #124 の publication / v35 CI は success、Pages deploy run `35484864653` も success。

### アクセスコード制を戻す場合

1. 上記3 provider の `OPEN_PREVIEW_ACCESS` を `false` に戻す。
2. question / lesson gate の `OPEN_PREVIEW` を `false` に戻して再deployする。
3. `fequest_beta_access_private` の `open-preview-v1` を disable する。
4. PWA cache contract と CI の期待値を同時に更新する。
5. PR → CI success → merge → Pages deploy success を確認する。

## 4. bit / byte 日本語表記統一

`.github/reference-audits/BIT_BYTE_JAPANESE_TERMINOLOGY_AUDIT_2026-09-20.md`

- lesson bank 10件のユーザー向け `bit` / `byte` を「ビット」/「バイト」へ統一
- protected lesson content version: `v376-lessons-bit-byte-jp-v385-20260920`
- payload SHA-256: `92d0f4ea676bac6f50b06e5dc8f9335b5460144c676940eb8cfa7f77ef7a2c66`
- lesson import manifest source commit: `b5322ce41f5777a7e121cd19ddd808d2d0274a46`
- `assets/first-impression-ux-v377.js` v9 で動的表示にも日本語化フォールバックを追加
- `BIT先生` はブランド名として変換対象外
- PR #126 の publication / v35 CI success、Pages deploy run `35485465052` success

## 5. 直前まで完了した教材品質改善

### 第1章

`.github/reference-audits/CH01_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_01_01`〜`core_01_07` を初学者向けに再監査・補強済み
- データ単位、接頭語、基数、桁の重み、基数変換、負の2進数、2進四則演算、浮動小数点、シフトを具体例・表・図で補強
- protected lesson content version: `v376-lessons-ch1-visual-depth-v382-20260920`
- 本文の英字 `bit` / `byte` は原則ビット / バイトへ統一
- `2^(n-1)` 型ではなく上付き指数を優先
- 新規図解の主要本文は18px、補助ラベルは16px以上を基準

### 第2章

`.github/reference-audits/CH02_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_02_01`〜`core_02_09` を詳細図解レベルへ補強済み
- 集合・ベン図、ド・モルガン、真理値表、MIL記号、半/全加算器、構文木、スタック、状態遷移、AI、統計、数値解析、情報理論、制御を図・表・具体例で補強
- `core_02_03`〜`core_02_09` content version: `v376-lessons-ch2-visual-depth-v381-20260920`
- 論理回路の加算器は左=Carry(C/Cout)、右=Sum(S)で統一
- 横長表はスマホで崩さず、分割または横スクロールで扱う

### 第3章

`.github/reference-audits/CH03_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_03_01`〜`core_03_05` を参考資料のページ画像まで確認して詳細図解レベルへ補強済み
- 2次元配列、木構造・二分探索木、流れ図、クイックソート、プログラムの4性質、Java系用語、HTML/XML/CSS/Ajaxを補強
- protected lesson content version: `v376-lessons-ch3-visual-depth-v383-20260920`
- lesson import manifest source commit: `25b5e037b387069ff1d4e6c3d2b1d05b836623e1`
- payload SHA-256: `a7d374183f31ad084d1d02b90f3c2abc69435da42772a5c03340a20adf156ffa`
- 第3章専用CSS: `assets/ch3-depth-v383.css`
- PR #120 のCI（publication / v35）success、Pages deploy run `35480599277` success

### 第4章

`.github/reference-audits/CH04_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_04_01`〜`core_04_05` を参考資料のページ画像まで確認して詳細図解レベルへ補強済み
- クロック・MIPS・コア、命令処理とレジスタ、直接/間接アドレス指定、割込み、記憶階層、実効アクセス時間、USB/接続方式、画素/dpi/3Dプリンタを補強
- protected lesson content version: `v376-lessons-ch4-visual-depth-v384-20260920`
- lesson import manifest source commit: `ab2f7738640764bd6047a4b14c276515d791496c`
- payload SHA-256: `8c79e3abb38e3104ded33c84c40d560002f000ff4afa8cfd589c9c56b9495e1c`
- 第4章専用CSS: `assets/ch4-depth-v384.css`
- PR #122 のCI（publication / v35）success、Pages deploy run `35483023544` success

### 第5章

`.github/reference-audits/CH05_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_05_01`〜`core_05_04` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- バッチ/リアルタイム、Webシステム、シンプレックス/デュプレックス/デュアル、ホット/コールドスタンバイ、RAID 0〜6を補強
- レスポンスタイムとターンアラウンドタイムの範囲を参考資料の試験向け整理へ統一
- ベンチマーク、キャパシティプランニング、スケールアウト/スケールアップ、RASIS、MTBF/MTTR、多重化を図解
- protected lesson content version: `v376-lessons-ch5-visual-depth-v386-20260920`
- lesson import manifest source commit: `64fdd47eb91a6dbdebdcfd8e5ebce977b51c9ebc`
- payload SHA-256: `68b98b033230246babec0401023c44588aeffa074272dafceca54280a6428b41`
- 第5章専用CSS: `assets/ch5-depth-v386.css`
- PR #128 のCI（publication / v35）success、Pages deploy run `35486361519` success

### 第6章

`.github/reference-audits/CH06_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_06_01`〜`core_06_05` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- OSの4機能、ジョブ管理、スプーリング、バッファ、タスク3状態、ディスパッチ、スケジューリング方式を補強
- ファイルツリー、ルート/カレント、絶対/相対パス、レプリケーション/バックアップ/アーカイブを図解
- コンパイラ5段階、インタプリタ、静的/動的テスト、Eclipse、OSS/商用/パブリックドメイン、コピーレフトを補強
- `core_06_06`（ミドルウェア）は参考資料外の既存追加範囲として保持
- protected lesson content version: `v376-lessons-ch6-visual-depth-v387-20260920`
- lesson import manifest source commit: `26e2dec3b0d21be4fc5f8ca07955f5b7e09edeaf`
- payload SHA-256: `3f3c836555def967df763bdea399aa3b8c69a4bbbc1083d957fb99a2904a1efa`
- 第6章専用CSS: `assets/ch6-depth-v387.css`
- PR #130 のCI（publication / v35）success、Pages deploy run `35486914132` success

### 第7章

`.github/reference-audits/CH07_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_07_01`〜`core_07_02` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 半導体、RAM/ROM分類、SDRAM、マスクROM/PROM/EPROM/EEPROM、フラッシュのページ/ブロックを補強
- メモリセル、DRAM=コンデンサ、SRAM=フリップフロップ、チャタリング、7セグメントLEDを図解
- アノードコモン/カソードコモンの点灯条件を補強
- 既存のA/D・D/A、標本化、量子化、正論理/負論理、ダイオード/トランジスタ、FPGAは保持
- protected lesson content version: `v376-lessons-ch7-visual-depth-v388-20260920`
- lesson import manifest source commit: `ed05c41018f861073e19f89a522413ea919294bf`
- payload SHA-256: `f7df6fa3def93d8f7010338eb947142bef374ac5d0706351b1f8120ff9ddb769`
- 第7章専用CSS: `assets/ch7-depth-v388.css`
- PR #132 のCI（publication / v35）success、Pages deploy run `35487332243` success

### 第8章

`.github/reference-audits/CH08_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_08_01`〜`core_08_03` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- ラジオボタン/チェックボックス/プルダウン/コンボボックスを見分け軸付きで補強
- ユーザビリティの効果・効率・満足、評価4手法、入力チェック、Undo/マクロ/ショートカットを補強
- ユニバーサルデザイン/バリアフリー/Webアクセシビリティを比較
- ビットマップ/アウトラインフォント、ラスタライズ、PCM、クリッピング、アンチエイリアシング、テクスチャマッピング、H.264を図解
- `core_08_04`（AR/VR/CG/ストリーミング）は参考資料外の既存追加範囲として保持
- protected lesson content version: `v376-lessons-ch8-visual-depth-v389-20260920`
- lesson import manifest source commit: `6cdede4f96c3eea556f572b527e0006983541711`
- payload SHA-256: `5352386404ab2b888d0e0a5576b79875572e281258b84ddb9c8b4e81a33ad4e4`
- 第8章専用CSS: `assets/ch8-depth-v389.css`
- PR #134 のCI（publication / v35）success、Pages deploy run `35487730464` success

### 第9章

`.github/reference-audits/CH09_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_09_01`〜`core_09_07` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- データモデリング、データモデル、主キー/複合主キー/外部キー、E-R図の多重度、正規化段階を補強
- DBMSの3機能、インデックス構造、ストアドプロシージャを図解
- ORDER BY / ASC / DESC / AS / VIEW / CREATE VIEWをSQL教材へ補強
- 更新前/更新後ログ、ROLLBACK / ROLLFORWARD、専有ロック（排他ロック）、ロック両立性・粒度を補強
- `core_09_08`（DWH/OLTP/OLAP/NoSQL/分散DB等）は参考資料外の既存追加範囲として保持
- protected lesson content version: `v376-lessons-ch9-visual-depth-v390-20260920`
- lesson import manifest source commit: `4abdb84d0a854ac5de03f44e847fcbd3bb285f36`
- payload SHA-256: `29b4527e98e5bf849b7909597b3304472815f02f8d64786bdc4be32386421e07`
- 第9章専用CSS: `assets/ch9-depth-v390.css`
- PR #136 のCI（publication / v35）success、Pages deploy run `35488223618` success

### 第10章

`.github/reference-audits/CH10_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_10_01`〜`core_10_09` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 回線、交換方式、LAN/WAN、無線LAN、IP/ポート/MAC、サブネット、IPv4/IPv6、NAT/NAPT/DHCPを補強
- DNS/URL、OSIとTCP/IP、ネットワーク機器、接続形態、NTP、To/Cc/Bcc、MIME/S-MIME、パリティ/CRCを図解
- `core_10_10`（SNMP/SDN/NFV/RADIUS/QoS等）は参考資料外の既存追加範囲として保持
- protected lesson content version: `v376-lessons-ch10-visual-depth-v391-20260920`
- lesson import manifest source commit: `01e58c645d7c8000c3f848e1360b3474a20cd66c`
- payload SHA-256: `36a58d14f6ac295329d8197875f77017e3b5106949a0977e5dc9a6b31f786e29`
- 第10章専用CSS: `assets/ch10-depth-v391.css`
- PR #138 のCI（publication / v35）success、Pages deploy run `35488713545` success

### 第11章

`.github/reference-audits/CH11_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_11_01`〜`core_11_08` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 人的/技術的/物理的脅威、不正のトライアングル、パスワード攻撃、マルウェア/Web攻撃を補強
- AES/DES/RSA/楕円曲線暗号、SHA-256、PKI、デジタル証明書の流れを補強
- リスク4プロセス、BCM/BCP、JIS Q 27001、ISMS適合性評価制度を図解
- アクセス権の8進数表現、FW/IDS・IPS/WAF、DMZ、HTTPS/WPA3、マルウェア検出、BYOD/MDMを補強
- ペネトレーションテスト/ファジング、CAPTCHA、完全消去、バイオメトリクス、2要素認証を補強
- protected lesson content version: `v376-lessons-ch11-visual-depth-v392-20260920`
- lesson import manifest source commit: `83fea9f261365c843c603629265dce860bfede55`
- payload SHA-256: `618c91ac481d39a3d25abcfe317ddb354d56c35a6b39803c6a1b4b3513fde317`
- 第11章専用CSS: `assets/ch11-depth-v392.css`
- PR #140 のCI（publication / v35）success、Pages deploy run `35489662096` success


### 第12章

`.github/reference-audits/CH12_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_12_01`〜`core_12_05` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- SLCP / ISO/IEC 12207 / ISO/IEC 15288 / 共通フレーム、企画〜保守の5プロセスを補強
- システム設計4工程、DFDの4記号、プロセス中心/データ中心、モジュール結合度6段階を図解
- クラス/インスタンス、カプセル化/継承/多相性、UML主要図と汎化記号を補強
- Vモデル、ホワイトボックス5網羅レベル、ブラック/ホワイトボックス、スタブ/ドライバを補強
- `core_12_06`〜`core_12_08` と既存IPA 9.2追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch12-visual-depth-v393-20260920`
- lesson import manifest source commit: `fbc3c864758ab52c4fbd924dc3fe7617a9b7bc8c`
- payload SHA-256: `c7ac86bdc7a0fde0c1aa4a4b49eaa4866b9c368c910b69f253d53c8cb93c5852`
- 第12章専用CSS: `assets/ch12-depth-v393.css`
- PR #142 のCI（publication / v35）success、Pages deploy run `35490650417` success


### 第13章

`.github/reference-audits/CH13_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- 参考資料13-01「ソフトウェアの開発モデル」と章末問題をページ画像まで確認
- `core_13_01` にウォーターフォール/アジャイル比較、スクラム3役割、2種類のバックログ、4イベントを補強
- ローコード/ノーコード、リバース/フォワード/リエンジニアリング、マッシュアップ3種類、XPのペアプログラミング/リファクタリングを図解
- `core_13_04` に構成品目、文書とプログラムの版対応、管理情報例を補強
- `core_13_02` / `core_13_03` と既存IPA 9.2追加範囲は削除せず保持
- protected lesson content version: `v376-lessons-ch13-visual-depth-v394-20260920`
- lesson import manifest source commit: `96a1e0e93ae7464b6aa1d21fd613c78062f6d0bf`
- payload SHA-256: `6f4c8f41d09d6e598622d5758c46ee42815bb2315504ce027024033574e7ef65`
- 第13章専用CSS: `assets/ch13-depth-v394.css`
- PR #144 のCI（publication / v35）success、Pages deploy run `35491070797` success


### 第14章

`.github/reference-audits/CH14_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_14_01`〜`core_14_06` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- プロジェクトの有期性・独自性、PMBOK 10知識エリア、WBS / ワークパッケージを補強
- 開発工数・開発期間・工数配分比率を具体例つきで図解
- トレンドチャート、アローダイアグラム記号、プレシデンスダイアグラムのFS/FF/SS/SFを補強
- クリティカルパス、クラッシング / ファストトラッキングを比較
- 各種見積り手法、ファンクションポイント5分類と算出手順を補強
- リスク回避 / 移転 / 低減 / 保有を4カードで比較
- `core_14_07`〜`core_14_10` と既存IPA追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch14-visual-depth-v395-20260920`
- lesson import manifest source commit: `f38aba36d0eea1ebc892b1a412f76d5ad8c953a2`
- payload SHA-256: `08781090735568f2bdd37776405728403ec8b2bb8b017e158572b58f529a1cfe`
- 第14章専用CSS: `assets/ch14-depth-v395.css`
- PR #146 のCI（publication / v35）success、Pages deploy run `35498384773` success


### 第15章

`.github/reference-audits/CH15_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_15_01`〜`core_15_06` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- JIS Q 20000のPDCAと、一斉 / 段階的 / 並行のシステム移行方式を補強
- SLM / SLA、SLAの利用者側・提供者側メリット、サービスデスク4形態を補強
- インシデント / 問題 / 既知の誤りを比較し、サービスデスクでは迅速な復旧を優先することを明確化
- プロジェクト / サービス / ファシリティの対象差、サージ防護 / UPSを補強
- システム管理基準 / システム監査基準、信頼性 / 安全性 / 効率性、情報セキュリティ監査を補強
- 依頼人 / 監査人 / 被監査部門の監査フロー、監査証拠、監査人の独立性と「自ら改善しない」を図解
- コーポレートガバナンス / 内部統制 / ITガバナンス / IT統制、職務分掌、経営者の最終責任を補強
- `core_15_07` / `core_15_08` と既存IPA追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch15-visual-depth-v396-20260920`
- lesson import manifest source commit: `a23c811ba5b81ee6a40294961e5371cc76aba93c`
- payload SHA-256: `6b80e8a7eeeadce349fdb58b30f7432011c625c3358f9c24c603a9f7134dfdbe`
- 第15章専用CSS: `assets/ch15-depth-v396.css`
- PR #148 のCI（publication / v35）success、Pages deploy run `35502349083` success


### 第16章

`.github/reference-audits/CH16_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_16_01`〜`core_16_04` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 経営理念→ビジョン→企業戦略→事業戦略→機能別戦略、部分最適 / 全体最適、EA 4分類を補強
- RPA / BPO / ワークフローシステムを比較し、BPR / BPMの抜本的 / 継続的を再確認
- オンプレミス / ハウジング / ホスティング / クラウドを敷地・所有者で比較し、SOAを図解
- BI / データウェアハウス、ビッグデータ3V、データレイク、データマイニング、マーケットバスケット分析を補強
- デジタルリテラシー / デジタルディバイドを補強
- 既存のAs-Is / To-Be、SaaS / PaaS / IaaS、クラウドネイティブ等は削除せず保持
- protected lesson content version: `v376-lessons-ch16-visual-depth-v397-20260920`
- lesson import manifest source commit: `2ee2ba899bcf499f7918a8af795c803a2c9542cf`
- payload SHA-256: `9649360b0cf8c1dd6e84a3c3135be543d4b29cf951b20fd3f699fdd1b1560b31`
- 第16章専用CSS: `assets/ch16-depth-v397.css`
- PR #150 のCI（publication / v35）success、Pages deploy run `35502859323` success


### 第17章

`.github/reference-audits/CH17_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_17_01`〜`core_17_02` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 経営者 / 情報システム部 / ユーザー / ベンダーの関係と、企画 / 要件定義 / 調達で確認するニーズの違いを補強
- システム化構想 / システム化計画、ROI、ITポートフォリオ、プライバシーバイデザインを補強
- 利害関係者ニーズ、業務要件3分類、非機能要件の代表分類と開発基準・標準を補強
- RFI→RFP→提案書→選定→契約の流れ、RFIの2目的、提案依頼書 / 提案書の作成主体を補強
- CSR調達 / グリーン調達 / カーボンフットプリント、ISO 14001を補強
- protected lesson content version: `v376-lessons-ch17-visual-depth-v398-20260920`
- lesson import manifest source commit: `2d4206afbf55b6691ae0686d6713338c25dc770a`
- payload SHA-256: `1e9c6cee5398c550bc1822b5741174fabd6ebb8049b1925d7c8244185d490fec`
- 第17章専用CSS: `assets/ch17-depth-v398.css`
- PR #152 のCI（publication / v35）success、Pages deploy run `35503361609` success


### 第18章

`.github/reference-audits/CH18_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_18_01`〜`core_18_06` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 経営戦略3分類、SWOT、ベンチマーキングを補強
- PPM、規模の経済 / 範囲の経済、プロダクトライフサイクル、コアコンピタンスを補強
- 競争地位、ブルーオーシャン、イノベーター理論、バリューチェーンを補強
- BSC 4視点、CSF→KPIの因果関係を図解
- 4P / 4C、コストプラス価格決定法を補強
- ERP / CRM / SFA / SCM、顧客ロイヤリティ、ナレッジマネジメント、暗黙知 / 形式知を補強
- `core_18_07` / `core_18_08` と既存IPA追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch18-visual-depth-v399-20260920`
- lesson import manifest source commit: `1b4eb6d77290e0d41cb7b7b657c32859a0d1399b`
- payload SHA-256: `842e63063628f3a953c48a68553251e2aaf9db4cb05bb79a04d9f7a845889cca`
- 第18章専用CSS: `assets/ch18-depth-v399.css`
- PR #154 のCI（publication / v35）success、Pages deploy run `35503792519` success

## 6. 今後も守る教材監査方針

正本は `.github/REFERENCE_MATERIAL_AUDIT_POLICY.md`。特に以下を継続する。

- 章単位・節順で進める
- IPAシラバスを試験範囲の正本とし、参考書は説明不足・重要文脈・つまずきポイントの監査資料として使う
- 参考書の赤字・オレンジ字・太字・囲み・図注記など視覚的強調も見る
- 初出用語は、その語を初めて使う位置でやさしく説明する
- 略語は正式名称だけで終えず、意味・具体例・似た概念との違いまで必要に応じて示す
- 抽象説明だけで終えず、具体例・途中計算・変換前後を付ける
- 図で理解した方が早い内容はHTML/CSS/SVGのFE QUEST独自図解を入れる
- 参考書の文章・図版は転載しない
- 主要本文18px以上、補助ラベル16px以上をスマホ基準にする
- 数式の指数・対数の底は上付き/下付き表記を優先する
- 不要な読み仮名は付けず、最尤法・尤度のような難読語の初出に絞る
- カード・図・表の上下余白とモバイル崩れも同時監査する
- 章の作業後は `.github/reference-audits/` に監査記録を残す

## 7. 次のデフォルト作業

ユーザーから別の具体的な修正指示がなければ、**参考書の第19章「ビジネスインダストリ」へ進み、第1章〜第18章と同じ粒度で章単位監査を始める。**

手順:

1. 参考書の第19章をページ画像も含めて確認
2. 強調箇所・図表・初出用語・具体例を抽出
3. IPA範囲との対応を確認
4. FE QUEST の対応 lesson ID / payload を live で読む
5. covered / thin / missing を判断
6. thin / missing のみ補強
7. スマホ図解・表・文字サイズまで確認
8. protected lesson bank を更新
9. 公開GitHub側のCSS / audit doc / CI contract / PWA cache を必要に応じて更新
10. PR → CI success → merge → Pages deploy success を確認
11. lesson import manifest を source commit と紐付けて記録

## 8. リポジトリと保護教材の役割

- GitHub 公開リポジトリ: アプリコード、CSS、CI、監査方針、概念レベルの監査記録
- protected lesson bank: 教材本文の正本
- 教材本文そのものを公開GitHubへコピーしない
- lesson bank を更新した場合、merge 後の source commit と content_version を import manifest に記録する

## 9. 作業上の既定権限

過去にユーザーから、通常の FE QUEST 改修について **PR作成・マージ・本番公開まで進めてよい** と明示的な許可がある。
ただし、次は勝手に行わない。

- 有料サービスの契約・課金
- 本番学習データを壊す可能性が高い変更
- 重大な設計変更
- 既存問題や学習履歴の不用意な削除

## 10. 再開時の注意

- 「GitHubを直接編集できない」と過去の誤認を繰り返さず、まず利用可能なGitHub連携を実際に確認する。
- open PR があれば、新しいブランチを勝手に作る前にそのPRの内容とCIを確認する。
- main がこのスナップショットより進んでいたら、**必ず新しいmainを正とする**。
- ユーザーの新しい指示がこのファイルの「次のデフォルト作業」と競合した場合は、ユーザーの新しい指示を優先する。
