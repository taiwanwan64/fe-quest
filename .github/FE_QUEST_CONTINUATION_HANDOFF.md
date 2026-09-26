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

## 最新確認・作業（2026-09-26）

- 第2章の形式言語も監査: 正規表現・閉包は既存教材で対応、BNFの再帰展開だけ出題前の手順が薄いため補強。非公開ソース PR #77、保護教材CI success。`core_02_04` は `v376-lessons-ch2-bnf-trace-v449-20260926`。監査記録は `reference-audits/IPA92_FORMAL_LANGUAGE_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次はマルコフ過程・仮説検定を節順に照合。
- 継続作業: 第2章の述語論理で出題前の説明不足を発見。非公開ソース PR #76 はマージ、保護教材CI success。`core_02_01` のみ `v376-lessons-ch2-predicate-bridge-v448-20260926` へ更新済み。監査記録は `reference-audits/IPA92_PREDICATE_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress のまま。次は形式言語・正規表現を節順で監査する。
- 作業開始時の live main: `73be1902886587178ba915bf67648da2f2ec2533`（PR #237）。open PR / open Issue はともに0。
- PR #237 head `092f2669f850fd9fc060b1e2a72416cb753d58fd` の publication run `35955275533` / v35 run `35955275583` は success。main の Pages run `35955324267` も success。
- PR #235でラボを統一前の2種類へ復元済み。#231〜#234の統一方針を再適用しない。#236/#237のレッスン一覧復帰時の中央表示も反映済み。
- 残存ブランチには過去のsquash等によりmainへ祖先として入っていないものもある。open PRなしを確認し、残存branchだけで未着手と判断しない。
- 今回の作業ブランチ: `audit-venn-practice-state-20260926`。集合・ベン図ラボの練習状態の不整合を修正し、CI回帰検査を追加。詳細は `reference-audits/IPA92_VENN_PRACTICE_STATE_AUDIT_2026-09-26.md`。
- 対応表は43項目（37 in-progress / 6 verified-covered）のまま。今回だけで集合の教材・直接演習・履歴の全ゲートを完了扱いにしない。
- 目標PWA cache: `fe-quest-v377-133`。profile schema / protected banksは変更なし。
- 以下の9月23日スナップショットは過去記録。再開時は今回のPRのCI・merge・Pagesをlive確認すること。

## 2. 2026-09-23 時点のスナップショット

このファイル作成直前の確認値。**次回は必ず再確認すること。**

- main: `b29430845a77326865cf940b708bf28b5cf2c6cb`（PR #228 merge後）
- open PR: 0
- active work PR: なし
- 最新本番 deploy: GitHub Actions run `35812171084`、success（PR #228 merge後）
- main PWA cache contract: `fe-quest-v377-124`
- profile schema: **9**（schema 8 checksum互換あり、PR #217では変更なし）
- active protected question total: **1180**
- `b_exam_algo`: **50**
- 科目B実戦50問同期 PR: #202、merged
- 科目B総合実戦16→4順序復元 PR: #203、merged
- 科目B総合実戦再開データ整合性強化 PR: #204、merged
- 科目B総合実戦採点順序整合性強化 PR: #206、merged
- 科目Bセキュリティ誤答履歴の設問単位分離 PR: #208、merged
- 新規二次元配列問題の復習先難易度修正 PR: #209、merged
- 科目B総合実戦post-submit保持最小化 PR: #211、merged
- 科目B短時間実戦post-submit保持最小化 PR: #213、merged
- 科目A模試post-submit保持最小化 PR: #214、merged
- 科目A通常演習・初回診断post-submit監査 PR: #215、merged
- Profile全体protected checkpoint retention監査 PR: #216、merged
- Protected runtime lifetime / B-final resume監査 PR: #217、merged
- 公開static protected-content残存監査 PR: #218、merged
- Pages current-provider surface整理 PR: #219、merged
- 科目Bアルゴリズム ミニ模試 protected runtime復旧 PR: #220、merged（publication / v35 CI success）
- 科目Bセキュリティ ミニ模試 protected runtime復旧 PR: #222、merged（publication / v35 CI success）
- 科目A関連問題復習・残存関数の現行経路監査 PR: #224、merged（publication / v35 CI success）
- 科目A受験準備度の認知レベル評価復旧 PR: #226、merged（publication / v35 CI success）
- ベン図ラボの文字・5ラボの開発向け表示修正 PR: #228、merged（publication / v35 CI success）
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
- 第19章詳細図解 PR: #156、merged
- 第20章詳細図解 PR: #158、merged
- 第21章詳細図解 PR: #160、merged
- 第22章科目B合格戦略 PR: #162、merged
- 科目B専用参考書 第1章「文法」 PR: #164、merged
- 科目B専用参考書 第2章「一次元配列」 PR: #166、merged
- 科目B専用参考書 第3章「二次元配列」 PR: #168、merged
- 科目B専用参考書 第4章「ありえない選択肢」 PR: #170、merged
- 科目B専用参考書 第5章「再帰」 PR: #172、merged
- 科目B専用参考書 第6章「木構造」 PR: #174、merged
- 科目B専用参考書 第7章「オブジェクト指向」 PR: #176、merged
- 科目B専用参考書 第8章「リスト」 PR: #178、merged
- 科目B専用参考書 第9章「スタック・キュー」 PR: #180、merged
- 科目B専用参考書 第10章「ビット列」 PR: #182、merged
- 科目B専用参考書 第11章「問題演習」 PR: #184、merged
- 科目B 情報セキュリティ基礎補強 / source-neutral化 PR: #186、merged
- 科目B 情報セキュリティ問題演習補強 PR: #188、merged
- 科目B 予想＋過去問題集 序章「傾向と対策」補強 PR: #191、merged
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


### 第19章

`.github/reference-audits/CH19_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_19_01`〜`core_19_04` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- スマートグリッド / スマートメーター / HEMS / ID-POSを補強
- 受注生産 / 見込生産 / かんばん方式（JIT） / ライン生産 / セル生産 / MRP / コンカレントエンジニアリングを補強
- BtoC / BtoB / CtoC / GtoB / OtoO、電子オークション / 逆オークション、エスクローを補強
- RFID / ICタグ、ロングテール、EDI、CGM、シェアリングエコノミーを補強
- 組込みソフトウェア、IoTデバイス / IoTサーバ、閉域網、BLE / LPWA、クラウド / エッジを補強
- 既存のFinTech、スマートファクトリー、スマートコントラクト、NFT、デジタルツイン、CPS等の追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch19-visual-depth-v400-20260920`
- lesson import manifest source commit: `2f7a61b905f37e4697b44073c249219b3400c0c8`
- payload SHA-256: `a7ba6936c3fe9d1c6307a85468228db58bfa91a9f7b88759aeebb02caf54f038`
- 第19章専用CSS: `assets/ch19-depth-v400.css`
- PR #156 のCI（publication / v35）success、Pages deploy run `35504569272` success


### 第20章

`.github/reference-audits/CH20_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_20_01`〜`core_20_06` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 経営理念 / ビジョン / 経営戦略を補強
- 5組織形態、CEO / CIO / CFO / CTO / CCO、OJT / Off-JT、ワークシェアリング、DE&Iを補強
- ABC分析、散布図 / 回帰分析、重み付け総合評価法、期待値を補強
- 損益分岐点の売上線 / 費用線、目標利益を含む必要売上高を補強
- B/S、利益の段階、C/F 3区分、黒字倒産を補強
- 流動 / 固定資産、棚卸、FIFO、売上原価、定額 / 定率法、固定資産売却損を補強
- `core_20_07` と既存IPA追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch20-visual-depth-v401-20260920`
- lesson import manifest source commit: `075e9323dd88a71d0a93bb3d829c7ded4d9e665e`
- payload SHA-256: `ec59920770d5790ca848741339f0568c64628b42072c2dea611a250ef8b5d1eb`
- 第20章専用CSS: `assets/ch20-depth-v401.css`
- PR #158 のCI（publication / v35）success、Pages deploy run `35505516967` success


### 第21章

`.github/reference-audits/CH21_FULL_DEPTH_VISUAL_AUDIT_2026-09-20.md`

- `core_21_01`〜`core_21_04` を参考資料の本文画像・章末問題まで確認して詳細図解レベルへ補強済み
- 知的財産権3分類、ソース / オブジェクトプログラム、プログラム言語 / アルゴリズム / プロトコルの著作権上の区別を補強
- 産業財産権4分類、営業秘密の秘密管理性 / 有用性 / 非公知性を補強
- サイバーセキュリティ基本法の対象、刑法2類型、不正アクセス禁止法の4行為を補強
- 個人情報の具体例、オプトイン / オプトアウトを補強
- 雇用 / 労働者派遣 / 請負の比較、派遣の指揮命令関係、請負の完成責任 / 契約不適合責任を補強
- 参考資料の試験向け整理として契約形態別のプログラム著作権帰属先を補強
- `core_21_05` / `core_21_06` と既存IPA追加教材は削除せず保持
- protected lesson content version: `v376-lessons-ch21-visual-depth-v402-20260920`
- lesson import manifest source commit: `0c45f3beac1f83477c46a5fca57047826824edf7`
- payload SHA-256: `0e9588d1f2f687722db39407006f2982d07159b0029ade0931c80b3f94d290c5`
- 第21章専用CSS: `assets/ch21-depth-v402.css`
- PR #160 のCI（publication / v35）success、Pages deploy run `35507296596` success


### 第22章

`.github/reference-audits/CH22_SUBJECT_B_STRATEGY_AUDIT_2026-09-20.md`

- 参考資料の22-01〜22-03をページ画像まで確認し、科目Bの本番構成・学習戦略を既存導線へ補強済み
- 科目Bコアコースへ100分 / 20問 / アルゴリズム16問＋情報セキュリティ4問 / 1000点満点・基準点600点の整理を追加
- 本試験の選択肢数とFE QUEST内4択練習が同一ではないことを明示
- アルゴリズム画面へ、特定言語の文法暗記より擬似言語の処理理解を優先する学び方を追加
- セキュリティ画面へ、テクノロジ分野全体との連携と「状況→証拠・ログ→問い」の長文読解方針を追加
- 公式公開問題を早めに見て形式・レベル感を確認する方針を追加
- protected lesson bank / question bank は変更なし。Chapter 22用のlesson import manifest追加も不要
- 第22章専用CSS: `assets/ch22-strategy-v403.css`
- source commit: `62ac4251452d9e5946cdc0abcdaa20ac2b53d366`
- PR #162 のCI（publication / v35）success、Pages deploy run `35508766208` success
- PWA cache contract: `fe-quest-v377-84`


### 科目B専用参考書 第1部 第1章「文法」

`.github/reference-audits/BBOOK_CH01_GRAMMAR_AUDIT_2026-09-20.md`

- 第1章を章扉から練習問題・解説までページ画像で確認済み
- protected `b_exercise` 20演習（40問）をlive照合
- 5つの変数型＋未定義、代入、算術 / 関係 / 論理演算子を補強
- if / elseif / else、while / do、forの読み方を補強
- 関数 / 手続 / 引数 / 戻り値、局所変数 / 大域変数を補強
- 紙のトレース表の書き方、値が変わらない制御行の省略、頻出変数名を補強
- protected lesson / question bank は変更なし
- 専用CSS: `assets/bbook-ch01-grammar-v404.css`
- source commit: `051061c4401c9ba7885f5d507b74466dc4f69675`
- PR #164 のCI（publication / v35）success、Pages deploy run `35509802329` success
- PWA cache contract: `fe-quest-v377-85`


### 科目B専用参考書 第1部 第2章「一次元配列」

`.github/reference-audits/BBOOK_CH02_ARRAY_AUDIT_2026-09-20.md`

- 第2章を本文から練習問題2-1〜2-4・解説までページ画像で確認済み
- IPA公開問題・サンプル問題で科目B配列の要素番号1始まりを照合
- 要素数 / 要素 / 要素番号、宣言・初期化、可変長配列、隣接要素、範囲外、配列トレース手順を補強
- protected question bankの一次元配列25問を1始まりへ統一
  - `b_exercise`: 14
  - `b_exam_algo`: 5
  - `b_compound`: 6
- active question totalは1173のまま
- protected question content version: `v376-bbook-ch02-array-v405-20260920`
- question import manifest source commit: `abb15f791212b99e6b1c51822d569b938f135dc7`
- payload SHA-256: `23bc8543a66fe360e706d7af94a04e4895a7ebdce2f47df7e4d1db8568e6b498`
- 専用CSS: `assets/bbook-ch02-array-v405.css`
- PR #166 のCI（publication / v35）success、Pages deploy run `35510969478` success
- PWA cache contract: `fe-quest-v377-86`
- 二次元配列の0始まり表記は第3章監査へ送る


### 科目B専用参考書 第1部 第3章「二次元配列」

`.github/reference-audits/BBOOK_CH03_MATRIX_AUDIT_2026-09-20.md`

- 第3章を章扉から確認問題・練習問題3-1〜3-3・解説までページ画像で確認済み
- 二次元配列の行 / 列、二重ループ、上下左右の隣接、配列の配列（ジャグ配列）を補強
- 終了条件→継続条件、関係演算子の否定、科目Bでのド・モルガンの使い方を補強
- protected question bankの二次元配列14問を要素番号1始まりへ統一
- 学習者向け二次元配列アクセスを `m[r, c]` 形式へ統一し、`m[r][c]` 型表記を解消
- `matrixFocus` は画面描画用の内部座標なので0始まりを維持
- active question totalは1173のまま
- protected question content version: `v376-bbook-ch03-matrix-v406-20260920`
- question import manifest source commit: `d763db420f9237f92c39fe44560e6f2ffbba54f2`
- payload SHA-256: `98917513bee5fcbcb8a98171a575829a321def702418251c3f0714ca0f769b83`
- 専用CSS: `assets/bbook-ch03-matrix-v406.css`
- PR #168 のCI（publication / v35）success、Pages deploy run `35515375061` success
- PWA cache contract: `fe-quest-v377-87`

### 科目B専用参考書 第1部 第4章「ありえない選択肢」

`.github/reference-audits/BBOOK_CH04_IMPOSSIBLE_CHOICES_AUDIT_2026-09-21.md`

- 第4章を章扉から確認問題・練習問題4-1〜4-8・解説までページ画像で確認済み
- 「全部を追う前に候補を絞る」解法を科目Bトレース画面へ追加
- ループ条件変数が繰返しごとに終了へ向かって更新されるかを確認する手順を補強
- 同じ変数への途中利用なしの連続上書き、代入前利用、代入後未使用を候補除外の観点として補強
- 関数引数・問題文の表や初期条件で既に値が与えられている場合も含めて判断する注意を追加
- 候補除外だけで一意に決まらない場合は、残った候補を通常トレースする位置付けを明示
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch04-impossible-v407.css`
- PR #170 のCI:
  - Validate sanitized FE QUEST publication: run `35544157932` — success
  - Validate IPA 9.2 question v35 public activation: run `35544157921` — success
- production Pages deploy: run `35544179827` — success
- PWA cache contract: `fe-quest-v377-88`

### 科目B専用参考書 第1部 第5章「再帰」

`.github/reference-audits/BBOOK_CH05_RECURSION_AUDIT_2026-09-21.md`

- 第5章を章扉から練習問題5-1〜5-3・解説までページ画像で確認済み
- 科目Bトレース画面へ「再帰トレース：呼出しと戻りを分けて追う」を追加
- 同じ関数でも呼出しごとに別の引数値・実行状態を持つことを補強
- 停止条件まで内側へ進み、終了後は呼出し元の次の行へ戻る流れを補強
- 再帰呼出し前 / 後の処理で実行方向が分かれることを補強
- 戻り値は最も内側から一段ずつ外側へ返すことを補強
- `a ← r(x - 1)` を呼出し→戻り値待ち→代入の順に読む手順を補強
- 複数再帰呼出しは上の呼出しを完了してから次の行へ進むことを補強
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch05-recursion-v408.css`
- PR #172 のCI:
  - Validate sanitized FE QUEST publication: run `35544737947` — success
  - Validate IPA 9.2 question v35 public activation: run `35544737940` — success
- production Pages deploy: run `35544754098` — success
- PWA cache contract: `fe-quest-v377-89`

### 科目B専用参考書 第1部 第6章「木構造」

`.github/reference-audits/BBOOK_CH06_TREE_AUDIT_2026-09-21.md`

- 第6章を章扉から練習問題6-1・解説までページ画像で確認済み
- 科目Bトレース画面へ「木構造：図と一次元配列を行き来する」を追加
- 根・節（ノード）・枝・葉・親子の基本用語を科目B直前に整理
- 二分木 → 完全二分木 → ヒープの関係を整理
- 完全二分木は形、ヒープは形＋親子の値の条件であることを明示
- 要素番号1始まりで root=`tree[1]`、左=`tree[2 × i]`、右=`tree[2 × i + 1]` の対応を図解
- 木→一次元配列 / 一次元配列→木の相互変換手順を補強
- 最大ヒープ / 最小ヒープでは親子のみを比較し、同じ段の値同士は条件ではないことを補強
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch06-tree-v409.css`
- PR #174 の最終CI:
  - Validate sanitized FE QUEST publication: run `35549191345` — success
  - Validate IPA 9.2 question v35 public activation: run `35549191401` — success
- production Pages deploy: run `35549212475` — success
- PWA cache contract: `fe-quest-v377-90`

### 科目B専用参考書 第1部 第7章「オブジェクト指向」

`.github/reference-audits/BBOOK_CH07_OOP_AUDIT_2026-09-21.md`

- 第7章を章扉から練習問題7-1〜7-3・解説までページ画像で確認済み
- 科目Bトレース画面へ「オブジェクト指向トレース：インスタンス・参照・メソッドを分ける」を追加
- クラス / インスタンス / メンバ変数 / コンストラクタ / メソッドの役割を科目B向けに整理
- インスタンス生成時はコンストラクタまで実行して初期状態を確定する手順を補強
- 参照を矢印で書き、共有参照と別インスタンスを区別する手順を補強
- メソッド呼出し対象はドット左側の参照先から確定することを補強
- オーバーロードは引数の個数・型などから呼出し先を選ぶことを補強
- インスタンス配列は「配列要素 → インスタンス → メンバ」の順に追うことを補強
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch07-oop-v410.css`
- PR #176 のCI:
  - Validate sanitized FE QUEST publication: run `35554513627` — success
  - Validate IPA 9.2 question v35 public activation: run `35554513630` — success
- production Pages deploy: run `35554534338` — success
- PWA cache contract: `fe-quest-v377-91`

### 科目B専用参考書 第1部 第8章「リスト」

`.github/reference-audits/BBOOK_CH08_LIST_AUDIT_2026-09-21.md`

- 第8章を章扉から確認問題・練習問題8-1〜8-4・解説までページ画像で確認済み
- 科目Bトレース画面へ「連結リスト：値ではなく参照の矢印を付け替える」を追加
- node = 値 + next、headから終端までたどる基本を整理
- 挿入では後続への参照を保存してから前側のnextを付け替える順序を補強
- 中間削除は前要素のnextで対象を飛び越すことを補強
- 先頭追加/削除は前要素がないためhead自体を更新することを補強
- 末尾・位置指定処理ではprev / ptrを2本で追う手順を補強
- 空・1要素・先頭・末尾・未発見の境界条件を整理
- リストから外れることとインスタンスそのものを消すことを区別
- 双方向リストのnext / prev、head / tailを補足
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch08-list-v411.css`
- PR #178 のCI:
  - Validate sanitized FE QUEST publication: run `35555373014` — success
  - Validate IPA 9.2 question v35 public activation: run `35555372980` — success
- production Pages deploy: run `35555394156` — success
- PWA cache contract: `fe-quest-v377-92`

### 科目B専用参考書 第1部 第9章「スタック・キュー」

`.github/reference-audits/BBOOK_CH09_STACK_QUEUE_AUDIT_2026-09-21.md`

- 第9章を章扉から確認問題・練習問題9-1・解説までページ画像で確認済み
- 科目Bトレース画面へ「スタック・キュー：出し入れする端を固定して追う」を追加
- スタックのLIFO / FILOを同じ動作の二つの表現として整理
- push / pop / peekの違いを、返り値と構造変化の有無で整理
- キューのFIFO、enqueue / dequeue / peek、FRONT / REARを整理
- pop / dequeueでは返り値と操作後の構造を同時に記録する手順を補強
- 操作列を1行ずつ状態更新して追う方法を補強
- 優先度付きキューでは優先度の大小と同優先度時の規則を問題文から先に確認することを補強
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch09-stackqueue-v412.css`
- PR #180 のCI:
  - Validate sanitized FE QUEST publication: run `35556268414` — success
  - Validate IPA 9.2 question v35 public activation: run `35556268407` — success
- production Pages deploy: run `35556294519` — success
- PWA cache contract: `fe-quest-v377-93`

### 科目B専用参考書 第1部 第10章「ビット列」

`.github/reference-audits/BBOOK_CH10_BIT_STRING_AUDIT_2026-09-21.md`

- 第10章を章扉から確認問題・練習問題10-1〜10-2・解説までページ画像で確認済み
- 科目Bトレース画面へ「ビット列：桁をそろえて、演算ごとに1行ずつ書き換える」を追加
- 基数変換の最短確認、8ビット固定長、最上位/最下位ビットを整理
- 加減算では桁を縦にそろえ、繰上がり/繰下がりを記録する手順を補強
- 2の累乗で割るとき、下位nビットを剰余・残りを商として読む手順を補強
- AND / OR / XORマスクの「マスクの1が何をするか」を整理
- `A AND (A - 1)` で最も右側の1を落とす定番操作を補強
- 全1マスクとのXORで固定長の全ビットを反転する見方を補強
- 論理左/右シフトの0埋めと、固定長での桁あふれを補強
- protected question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook-ch10-bitstring-v413.css`
- PR #182 のCI:
  - Validate sanitized FE QUEST publication: run `35556982926` — success
  - Validate IPA 9.2 question v35 public activation: run `35556982939` — success
- production Pages deploy: run `35557013108` — success
- PWA cache contract: `fe-quest-v377-94`

### 科目B専用参考書 第1部 第11章「問題演習」

`.github/reference-audits/BBOOK_CH11_PROBLEM_PRACTICE_AUDIT_2026-09-21.md`

- 参考資料の実際の章名は第11章「問題演習」。前回引き継ぎの「関数演算」は誤記だったため訂正
- PDF 271〜294ページ（紙面269〜292ページ）の問題11-1〜11-6・解説をページ画像で確認済み
- PDF 295ページから情報セキュリティ編へ移行し、PDF 297ページから基礎整理、PDF 341ページから問題演習編へ進む
- 科目Bトレース画面へ「総合問題：題材をいったん捨てて、処理の型に分ける」を追加
- 二重ループは外側 / 内側の役割を分け、比較・交換時だけ状態を書き換える手順を整理
- `mod 10` と10の整数商を使った10進数の桁分解を補強
- ハッシュ表では第1候補 → 衝突判定 → 第2候補の順に追う手順を補強
- 文字列メソッドは問題文の仕様表を先に読み、中間文字列を毎行保存する手順を補強
- 複数メソッド呼出しを含む式は、各戻り値を先に表へ出す手順を補強
- 単方向リスト末尾追加は空 / 非空を先に分岐してからnextをたどる手順を補強
- 選択肢へ状態を合わせず、トレース結果を作って最後に照合する横断ルールを補強
- protected question bankは変更なし、active question totalは1173のまま
- ハッシュ表・文字列メソッドの直接問題は薄いが、原著問題を転載せずまず横断ガイドで補強
- 専用CSS: `assets/bbook-ch11-problem-practice-v414.css`
- PR #184 のCI:
  - Validate sanitized FE QUEST publication: run `35557774396` — success
  - Validate IPA 9.2 question v35 public activation: run `35557774409` — success
- production Pages deploy: run `35557799251` — success
- PWA cache contract: `fe-quest-v377-95`

### 科目B 情報セキュリティ基礎補強 / source-neutral化

`.github/reference-audits/B_SECURITY_FOUNDATIONS_AUDIT_2026-09-21.md`

- PDF 297〜340ページ（紙面295〜338ページ）の情報セキュリティ基礎範囲をページ画像で確認
- PDF 341ページから情報セキュリティ問題演習編
- セキュリティ選択画面へ「セキュリティ長文：事実 → 守る対象 → 根拠 → 対応の順で読む」を追加
- 初動の「報告 → 隔離 → 証拠保全 → 影響調査 → 除去・復旧 → 再発防止」を整理
- CSIRT / デジタルフォレンジックス / 構成管理のつながりを補強
- CIA、資産 / 脅威 / 脆弱性、2要素認証 / 2段階認証、最小権限 / 職務分離を補強
- 共有端末・入退室・盗難紛失・ログ時刻同期・バックアップ・内部不正・ネットワーク防御を補強
- protected question bankは変更なし、active question totalは1173
- b_securityは15ケース・45問を維持
- 公開HTMLに残っていた「参考資料」「参考書」など出典を感じさせるユーザー向け表現7箇所を自然な教材文へ置換
- publication / Pages CIで `参考資料` / `参考書` / `虎の巻` / `情報処理教科書` の公開HTML再混入を禁止
- protected lesson bankのユーザー向け「参考資料」表現26教材もsource-neutral化
  - content version: `v376-lessons-source-neutral-v415-20260921`
  - total count: 26
  - payload SHA-256: `bc17396e7143d63ad95e8936c4f6b592d9f768b4feb477903f0b9a00c8f29a60`
  - source commit: `99c6acf53adf6d9b59dcc5996a53c4aa59481edb`
  - lesson import manifest登録済み
- protected lesson bank再検索:
  - `参考資料`: 0
  - `参考書`: 0
  - `本書`: 0
  - `虎の巻`: 0
  - 書名 / シリーズ名: 0
- PR #186 CI:
  - Validate sanitized FE QUEST publication: run `35561235448` — success
  - Validate IPA 9.2 question v35 public activation: run `35561235517` — success
- production Pages deploy: run `35561299366` — success
- PWA cache contract: `fe-quest-v377-96`

### 科目B 情報セキュリティ問題演習

`.github/reference-audits/B_SECURITY_PRACTICE_AUDIT_2026-09-21.md`

- PDF 341〜355ページ（紙面339〜353ページ）の情報セキュリティ問題演習5題をページ画像で確認
- PDF 356ページは受験者コメント、357ページ以降は索引・奥付等であり、この教材の学習内容監査は完了
- セキュリティ選択画面へ「セキュリティ問題演習：変わった条件と責任範囲だけを追う」を追加
- 「導入・変更によって増えたリスク」は変更前 / 変更後の差分から判断する手順を補強
- 攻撃が成立するかを「攻撃者ができること → 設定・経路 → 守る対象 → 被害」の因果で確認する手順を補強
- OS / ブラウザ / 業務アプリの認証情報を別レイヤとして追う手順を補強
- 権限表は役職名ではなく、入力 / 承認など実際の業務手順から埋める手順を補強
- PaaS等の責任分界は会社名ではなく「どのコンポーネントを管理しているか」で判断する手順を補強
- 選択肢を「主語 → 行為 → 経路 → 被害」へ分解して根拠を確認する手順を補強
- protected question bankは変更なし、active question totalは1173
- b_securityは15ケース / 45問を維持
- BYOD / VPN / 共有端末の保存認証情報 / 職務分離 / PaaS / 初期設定悪用は直接ケースが薄いため、まず横断ガイドで補強
- ユーザー向けHTMLに外部教材由来と分かる表現を追加していない
- source-neutral CIは `参考資料` / `参考書` / `本書` / `虎の巻` / `情報処理教科書` / `出るとこだけ` を検査
- 専用CSS: `assets/b-security-practice-v416.css`
- PR #188 の最終head CI:
  - head: `628a1d7b20b2826080e8f3246c0d0b51409cfd35`
  - Validate sanitized FE QUEST publication: run `35562503174` — success
  - Validate IPA 9.2 question v35 public activation: run `35562503175` — success
- merge commit: `f799d03ec8e34c14e2359a2959875d83b0782960`
- production Pages deploy: run `35562489860` — success
- PWA cache contract: `fe-quest-v377-97`


### 科目B 予想＋過去問題集 序章「傾向と対策」

`.github/reference-audits/BBOOK2_INTRO_STRATEGY_AUDIT_2026-09-21.md`

- PDF 19〜34ページをページ画像の強調・図表まで確認
- 現行の科目B導線、トレース、セキュリティ、ミニ模試、20問総合実戦と照合
- プログラムトレース画面へ「トレースを身につける練習法」を追加
- 実行した行 / 条件の真偽 / 変わった値だけを記録する最小トレース手順を補強
- 初期値を変えてもう一度追う再トレース、定番アルゴリズムの丸暗記回避を補強
- 科目B総合実戦へ「100分を使い切るための解き方」を追加
- 1周目 → 「後で見る」 → 最終確認の時間配分を補強
- live protected bank の b_exam_algo は43問で、UIの「40問プール」固定表示が古くなっていたため件数非依存の表現へ修正
- protected lesson / question bankは変更なし、active question totalは1173のまま
- 専用CSS: `assets/bbook2-intro-strategy-v417.css`
- PR #191 CI:
  - Validate sanitized FE QUEST publication: run `35566386429` — success
  - Validate IPA 9.2 question v35 public activation: run `35566386467` — success
- merge commit: `042f75d7624a413b45f4979c9289ac14e75c59eb`
- production Pages deploy: run `35566414975` — success
- PWA cache contract: `fe-quest-v377-98`


### 科目B 予想＋過去問題集 第1章「予想問題1」

`.github/reference-audits/BBOOK2_PREDICTION1_AUDIT_2026-09-21.md`

- PDF 35〜105ページを問題20問＋解説まで監査
- 既存問題プールで主要領域はcovered
- 長いプログラムを「状態が変わる単位」で追う実戦トレースを補強
- protected question bankは変更なし、active total 1173
- PR #193 merged / production deploy success
- PWA cache contract: `fe-quest-v377-99`

### 科目B 予想＋過去問題集 第2章「予想問題2」

`.github/reference-audits/BBOOK2_PREDICTION2_AUDIT_2026-09-21.md`

- PDF 106〜187ページを問題20問＋解説まで監査
- 複数空欄を「役割 → 依存関係」の順で解く横断手順を補強
- protected question bankは変更なし、active total 1173
- PR #194 merged / production deploy success
- PWA cache contract: `fe-quest-v377-100`

### 科目B 予想＋過去問題集 第3章「予想問題3」

`.github/reference-audits/BBOOK2_PREDICTION3_AUDIT_2026-09-21.md`

- PDF 188〜280ページを問題20問＋解説まで監査
- 循環キュー（リングバッファ）と後置記法（逆ポーランド記法）の解法を補強
- protected question bankは変更なし、active total 1173
- PR #195 merged / production deploy run `35569666752` success
- main after merge: `f3e9f6dbd6b1f12b95dda4f30e7d93b1d594a34c`
- PWA cache contract: `fe-quest-v377-101`

### 科目B 予想＋過去問題集 第4章「令和4年サンプル問題」

`.github/reference-audits/BBOOK2_SAMPLE2022_AUDIT_2026-09-21.md`

- PDF 282〜365ページを問題20問＋解説まで監査
- 既存教材で大半はcovered
- ゲーム木／ミニマックス法と、固定ビットをもつ符号化・ビットパッキング手順を補強
- protected lesson / question bankは変更なし、active total 1173
- PR #196 の publication / v35 CI success
- merge commit: `6987e2e00d00d2368c68afc5c881ba93cdd42cd0`
- production Pages deploy: run `35572323655` success
- PWA cache contract: `fe-quest-v377-102`


### 科目B 予想＋過去問題集 第5章「令和5年公開問題」

`.github/reference-audits/BBOOK2_PUBLIC2023_AUDIT_2026-09-21.md`

- PDF 366〜389ページを公開問題6問＋解説まで監査
- クイックソートのpivot / 左右ポインタの追い方を補強
- 数式の記号を擬似言語へ読み替え、式の塊と変数・ループを対応させる手順を補強
- ハッシュ表・素数判定・手続呼出し・セキュリティは既存教材でcovered
- protected lesson / question bankは変更なし、active total 1173
- PR #197 の publication / v35 CI success
- merge commit: `3a3d7ad83838deab4705844675929fdb6ec538f5`
- production Pages deploy: run `35572850014` success
- PWA cache contract: `fe-quest-v377-103`


### 科目B 予想＋過去問題集 第6章「令和6年公開問題」

`.github/reference-audits/BBOOK2_PUBLIC2024_AUDIT_2026-09-21.md`

- PDF 390〜428ページを公開問題6問＋解説まで監査
- 2進文字列を左から読む累積基数変換（result × base + digit）を補強
- 無向グラフの辺リスト→隣接行列変換を補強
- 複合条件・整列済み配列のマージ・関連度計算・テレワークセキュリティは既存教材でcovered
- protected lesson / question bankはこの章監査単体では変更なし、active total 1173
- PR #198 の publication / v35 CI success
- merge commit: `162cbb70b0051e2ab5acf9bc465ab7492ca3572e`
- production Pages deploy: run `35573319415` success
- PWA cache contract: `fe-quest-v377-104`

### 科目B 予想＋過去問題集 全体

- 序章、予想問題1〜3、令和4年サンプル問題、令和5年公開問題、令和6年公開問題まで章順に監査完了。
- PDF 429ページ以降はTips / 著者紹介 / 奥付で、問題章の追加はない。
- 原著の問題文・図・選択肢は公開GitHubやユーザー向け教材へ転載していない。
- 章ごとの補強は主に「解法ガイド」。その後の全章統合照合で直接演習が薄い技能だけを追加した。

### 科目B 全章監査 thin / missing 統合演習

`.github/reference-audits/BBOOK2_GAP_EXERCISE_INTEGRATION_2026-09-21.md`
`.github/reference-audits/BBOOK2_B_GAP_V1_IMPORT_2026-09-21.md`

- 後置記法は `b_compound_postfix_stack_1〜3`、`b_exam_bexam_sq_01`、`b_exam_bexam_sq_04` に既存の直接演習があるため重複追加しなかった
- 循環キュー、ゲーム木／ミニマックス、固定ビット幅パッキング、クイックソートpartition、数式→擬似言語、隣接行列、累積基数変換の7問をFE QUEST独自問題として `b_exam_algo` へ追加
- b_exam_algo: 43 → 50
- active protected question total: 1173 → 1180
- content_version: `v376-protected-b-gap-v1-20260921`
- public metadata catalog: `assets/question-catalog-b-gap-v1.json`
- latest provider: `v376-provider-33-ipa92-v1-v35-bgap1`
- PWA cache contract: `fe-quest-v377-105`
- PR #199 publication / v35 CI success、merge commit `129efc43eb237149a64d6cc4eda637d25e95b487`
- PR #199直後のPages deploy `35580437814` は deploy workflow に旧provider versionの検査が1行残っていたため failure
- PR #200で公開契約だけを修正、merge commit `c67f0b246768e6f4e2ddbaee09d4f9cf9cbd9c89`
- production Pages deploy `35580611945` success
- private bank の問題本文・選択肢・正答・解説は公開GitHubへ移していない


### 科目B 実戦50問 品質・出題バランス監査

`.github/reference-audits/B_EXAM_50_QUALITY_BALANCE_AUDIT_2026-09-21.md`

- private bank / public catalog / runtime metadata を照合し、`b_exam_algo=50` を確認
- domainは10分野すべて4〜6問、標準24 / 応用26
- 選択肢重複、render metadata不一致、pre-submit解答漏えいなし
- 50問化後も `assets/app-v377.js` の総合実戦セレクタが43問のままだった統合漏れを発見
- `B_EXAM_ALGO_ITEMS` を50問へ同期
- 5,000回の16問抽出シミュレーションで不正構成0
- PR #202 merged、merge commit `8b29b13b2030a41ece29b92099a815e931cf22a7`
- production Pages deploy run `35589397381` success
- PWA cache contract: `fe-quest-v377-106`

### 科目B 総合実戦20問 runtime順序監査

`.github/reference-audits/B_FINAL_RUNTIME_ORDER_AUDIT_2026-09-21.md`

- protected移行後にアルゴリズム16問とセキュリティ4問を20問全体でshuffleしていた順序ドリフトを発見
- アルゴリズム16問内 / セキュリティ4問内だけを個別にランダム化
- 本番想定の **アルゴリズム16問 → セキュリティ4問** の区分順を復元
- 問題集合・難易度・採点・100分タイマーは変更なし
- PR #203 merged、merge commit `da2fe333bee10e221ec5a0799ad5cc5c8f783318`
- production Pages deploy run `35602662422` success
- PWA cache contract: `fe-quest-v377-107`

### 科目B 総合実戦 再開データ整合性監査

`.github/reference-audits/B_FINAL_RESUME_INTEGRITY_AUDIT_2026-09-21.md`

- `fequest_bfinal_resume_v1` の復元前validationを追加
- Q1〜Q16=algo / Q17〜Q20=security を検証
- protected question ID 20件の一意性、4択、server map、回答・flag・index範囲を検証
- pre-submit itemへ正答・解説系fieldが混入していないことを検証
- 不正・破損payloadは破棄し、総合実戦runtimeへ持ち込まない
- resume key / schema 1 / 100分 / 16+4 / server-side grading は変更なし
- protected bankは変更なし、active total 1180、`b_exam_algo=50`
- PR #204 merged、merge commit `d136220be022f087473fe9469b6ab23e7e558bf3`
- production Pages deploy run `35614253427` success
- PWA cache contract: `fe-quest-v377-108`


### 科目B 総合実戦 採点・結果パイプライン監査

`.github/reference-audits/B_FINAL_GRADING_RESULT_AUDIT_2026-09-21.md`

- 表示4択のshuffle → server choice index → answerIndexの戻しを監査
- 未回答は正答位置が0番でも正解扱いされないことを確認
- question gateのanswer再送は回答済みIDを重複追加せず再試行可能
- 全20問のserver grading完了前にはXP / history / statsを更新しない
- bridge session再利用時の判定が「同じ20問の集合」止まりだったため、完全順序一致へ修正
- grading resultも `results[i].questionId === expectedIds[i]` を全件確認してから結果へ反映
- protected bankは変更なし、active total 1180、`b_exam_algo=50`
- PR #206 merged、merge commit `19ce7118a25a99c353df52612a3d66a26289a540`
- production Pages deploy run `35615019010` success
- PWA cache contract: `fe-quest-v377-109`


### 科目B 総合実戦 セキュリティ誤答履歴識別監査

`.github/reference-audits/B_FINAL_SECURITY_MISTAKE_IDENTITY_AUDIT_2026-09-22.md`

- セキュリティ最終問題の誤答履歴が `scenario sourceId + format` 単位で、同一シナリオの第2問 / 第3問を区別できない不整合を発見
- final result detailへ protected question ID を保持
- algorithmは従来どおりsourceId、securityだけprotected question IDをmistake identityに使用
- 過去履歴にquestionIdがない場合は旧sourceIdへfallback
- profile schema migrationなし
- PR #208 merged、merge commit `92879e58828e92fc0f7f3dae989c6f6a2056844c`
- production Pages deploy run `35672904840` success
- PWA cache contract: `fe-quest-v377-110`

### 科目B 総合実戦 mat05 復習先難易度監査

`.github/reference-audits/B_FINAL_MAT05_REMEDIATION_AUDIT_2026-09-22.md`

- 新規 `bexam_mat_05` は標準・二次元配列だが、既定復習先が `matrix_find`（応用）になっていた取り残しを発見
- 既存の `bexam_mat_01 / 02` と同じ方針で `matrix_sum`（標準）へ修正
- CIで問題側 / 復習先側のlevelとdomainを検証
- 問題内容・採点・問題選択は変更なし
- PR #209 merged、merge commit `10e96f49c7cc5612b9087ad443e0241e7720a677`
- production Pages deploy run `35673125032` success
- PWA cache contract: `fe-quest-v377-111`


### 科目B 総合実戦 post-submit protected data retention監査

`.github/reference-audits/B_FINAL_POSTSUBMIT_RETENTION_AUDIT_2026-09-22.md`

- `bFinalHistory` に問題文・ユーザー回答・正解・解説まで永続化され、backup / recovery snapshotにも入る不整合を発見
- persisted detailを `kind / format / domain / ok` の分析metadataだけへ縮小
- full問題文・正答・解説は即時結果レビュー中のmemory / DOMに限定
- 結果画面を離れる時と新しい総合実戦開始時にfull review memoryを破棄
- 採点成功後に `bFinalItems / bFinalAnswers / flags` 等の重複runtimeを解放
- profile schema: 5 → 6
- schema 5専用checksum互換を追加し、既存profile / atomic envelope / backupを旧規則で検証後にschema 6へ移行
- readiness / format analytics / 履歴一覧 / 学習時間見積りはmetadataだけで維持
- protected bankは変更なし、active total 1180、`b_exam_algo=50`
- PR #211 merged、merge commit `e96a20a5fcc717bfebe8f572ba4c21054ed3ae7a`
- production Pages deploy run `35689491972` success
- PWA cache contract: `fe-quest-v377-112`

### 科目B 短時間実戦 post-submit protected data retention監査

`.github/reference-audits/B_SHORT_PRACTICE_POSTSUBMIT_RETENTION_AUDIT_2026-09-22.md`

- `bMockHistory / bCompoundHistory / securityMockHistory` をmetadata-onlyへ縮小
- 保存detailはモード別に `level / kind / qlevel / scenarioId / ok` 等の分析metadataだけ
- 問題本文・選択肢・選択回答・正答・解説は永続履歴へ保存しない
- profile schema: 6 → 7
- schema 6 checksum互換を追加
- 即時結果レビューのfull detailはmemory / DOMに限定し、結果画面離脱時に解放
- protected bankは変更なし、active total 1180、`b_exam_algo=50`
- PR #213 merged、merge commit `3a1d2757debb9acf53dc9e83d601378f95423379`
- production Pages deploy run `35697054173` success
- PWA cache contract: `fe-quest-v377-113`

### 科目A 模試 post-submit protected data retention監査

`.github/reference-audits/A_MOCK_POSTSUBMIT_RETENTION_AUDIT_2026-09-22.md`

- v431時点の `mockHistory.details` が `shownOptions / correctIndex / answerIndex` をprofile / backup / recoveryへ長期保存していた不整合を発見
- v432ではpersisted detailを `id / ok / flagged / seconds` へ縮小
- 採点直後の `lastMockAttempt` はfull detailをmemory上に保ち、従来の即時レビューを維持
- 履歴レビューはユーザー回答本文を保存せず、現在のprotected questionで問題・正解・解説を確認する
- analytics / mock diagnosis / 履歴レビューの誤答判定を `ok` metadata対応へ変更
- profile schema: 7 → 8
- schema 7 checksum互換を追加
- protected bankは変更なし、active total 1180、`b_exam_algo=50`
- PR #214 merged、merge commit `27a1a58b343de299a91bca4ab62599d34973bd5a`
- production Pages deploy run `35699137452` success
- PWA cache contract: `fe-quest-v377-114`


### 科目A 通常演習 / 初回診断 post-submit retention監査

`.github/reference-audits/A_PRACTICE_DIAGNOSTIC_RETENTION_AUDIT_2026-09-22.md`

- `qStats / sessions[].log / diagnosticScores` のprofile永続化は既にmetadata-onlyで、問題文・選択肢・正答・解説を保存していないことを確認
- 通常演習の採点結果はUI描画後に `q.a / q.exp / q.choiceExps / q.__v376PostSubmit` を削除
- セッション終了時に `clearSubjectASession()` と `quizItems=[]` でhydrated protected runtimeを解放
- 解法トレーニングの保存値はユーザー入力途中式・一般条件語・選択肢index・秒数等で、protected本文の自動複製なし
- 初回診断だけ、結果表示後も `diagnosticItems / diagAnswers` がbridge memoryに残る取り残しを発見
- v433で結果描画直後に `diagnosticItems=[] / diagAnswers=[] / diagIndex=0 / clearProtectedCache()` を一括実行
- profile schemaは8のまま、protected bankも変更なし
- PR #215 merged、merge commit `0fdab47051cab982330e01bb81f4b79fc8adab27`
- production Pages deploy run `35699659688` success
- PWA cache contract: `fe-quest-v377-115`


### Profile全体 protected checkpoint retention横断監査

`.github/reference-audits/PROFILE_PROTECTED_CHECKPOINT_RETENTION_AUDIT_2026-09-22.md`

- `reviewJourneys / mockMistakeStats / masteryHistory / techniqueStats / sessions / chapterMastery` はmetadata中心で、protected問題本文・正答・解説の長期保存なし
- `dailyPlans[*].blockProgressV373` に科目B途中再開用のanswer positionが残る2経路を発見
- アルゴリズムの2回目予測正解後tailで、`choiceIndex` が正答位置そのものとしてprofile / backup / recoveryへ保存されていた
- セキュリティケースの回答済みcheckpointでも、直近 `choiceIndex` が正答位置になり得た
- v434ではtrace tailのchoiceIndexを保存せず、authorized server resumeでtailを再取得
- セキュリティは「1回目誤答後・未完了」の既知の誤答indexだけ保存し、回答済みではnull
- current profile normalizationで `dailyPlans` sanitizerを通し、既存schema 8 profile / backupの該当indexもschema 9移行時に浄化
- profile schema: 8 → 9
- schema 8 checksum互換を追加
- protected bankは変更なし、active total 1180、`b_exam_algo=50`
- PR #216 merged、merge commit `bc9db1af7f95de4438b37195e7f7a49c8eb3894c`
- production Pages deploy run `35700747464` success
- PWA cache contract: `fe-quest-v377-116`


### Protected content runtime lifetime / B-final resume横断監査

`.github/reference-audits/PROTECTED_RUNTIME_LIFETIME_AUDIT_2026-09-22.md`

- profile外のDOM / JS runtime / provider cache / localStorage / sessionStorage / IndexedDB / history.stateまで横断監査
- 科目B総合実戦の `fequest_bfinal_resume_v1` が `items:bFinalItems` を保存し、問題文・選択肢・render dataまでlocalStorageへ残していた不整合を発見
- v435ではresume payloadをversion 2へ変更し、`questionIds / optionMaps / answers / flags / index / timing` だけを保存
- reload時はquestion IDからprotected bridgeで20問を再hydrateし、保存したdisplay permutationを復元
- 科目A通常演習は途中離脱でもprovider hydrated session / `quizItems` / question DOMを解放
- 科目A模試は即時結果・レビューを離れた時に `mockItems / lastMockAttempt / reviewItems` とprotected DOMを解放
- Subject B mode / trace screen離脱時にtrace / security / short practice / finalのruntimeとbridge cacheを解放
- B-final metadata-only resumeは画面離脱では保持し、明示的な終了では従来どおり削除
- profile schemaは9のまま、protected bank変更なし、active total 1180、`b_exam_algo=50`
- PR #217 merged、merge commit `a823753f591cb0b265343ed594bf3747a6070637`
- production Pages deploy run `35715768128` success
- PWA cache contract: `fe-quest-v377-117`


### 公開GitHub / Pages static protected-content残存監査

`.github/reference-audits/PUBLIC_STATIC_PROTECTED_CONTENT_AUDIT_2026-09-23.md`

- GitHub repositoryがpublicで、Pages artifactは `.git/.github/README.md` 等を除いて広くrepository assetを配信する境界であることを確認
- base / IPA 9.2 extension / Subject-B gap catalogはmetadata-onlyで、問題本文・選択肢・正答位置・解説等を含まないことを確認
- v436で全 `assets/question-catalog*.json` を横断するprotected field CI guardを追加
- providerの代表版はfield transport codeのみで、静的なquestion-bank本文埋込みは確認されず
- `assets/app-v377.js` に、既にredactedされたSubject-B mini mockのdead legacy残存として、正答候補値・詳細解説を含む `B_MOCK_EXTRA_DISTRACTOR / B_MOCK_EXPLANATION` が残っていた不整合を発見
- 両constantにはread siteがなく、v436で安全に削除
- Pages artifact側でも同じabsence / metadata-only catalog contractを検証
- profile schemaは9のまま、protected bank変更なし、active total 1180、`b_exam_algo=50`
- PR #218 merged、merge commit `bf918d02d7cc8984bed17de25b9104a1965cf96d`
- production Pages deploy run `35791662537` success
- PWA cache contract: `fe-quest-v377-118`


### Pages current-provider surface監査

`.github/reference-audits/PAGES_CURRENT_PROVIDER_SURFACE_AUDIT_2026-09-23.md`

- current runtimeは `index.html` のbase providerと `public-config` が動的loadするlatest v35 providerだけを使用することを確認
- v35 providerはhistorical metadata catalogを直接合成し、historical provider JS v7〜v34をimportしない
- 旧provider JS 28本（約527KB）がPagesとservice-worker precacheに残っていたため、v437でbrowser/offline surfaceから除外
- metadata catalog群はcurrent v35 providerが利用するため維持
- GitHub repository上のhistorical provider sourceはtraceabilityのため削除しない
- publication / deploy CIでPages artifactとSWからv7〜v34が除外され、base + v35が残ることを検証
- profile schemaは9のまま、protected bank変更なし、active total 1180、`b_exam_algo=50`
- PR #219 `pages-current-provider-only-v437-20260923` で実装中。初回publication / v35 CI success確認済み。**handoff更新後の最新head CI / merge / Pages deployをlive再確認する**
- target PWA cache contract: `fe-quest-v377-119`


### 科目Bアルゴリズム ミニ模試 protected runtime監査

`.github/reference-audits/B_MINI_MOCK_RUNTIME_AUDIT_2026-09-23.md`

- redacted stubによる0問化経路をprotected bridgeの8問hydrate / server gradeへ復旧
- 採点待ち中の回答変更、結果の順序・正答位置・判定不整合、画面離脱後の結果適用を防止
- 未回答の誤答判定・読み込み中キャンセル・結果解放をintegration testで検証
- PR #220 merged、main `090b33221a8070ce42cc61ab6e19c62732d25c5a`
- publication CI run `35803409485` success、v35 CI run `35803409400` success
- production Pages deploy run `35803452914` success
- PWA cache `fe-quest-v377-120`、profile schema 9、protected total 1180、`b_exam_algo` 50

### 科目Bセキュリティ ミニ模試 protected runtime監査

`.github/reference-audits/B_SECURITY_MINI_RUNTIME_AUDIT_2026-09-23.md`

- redacted stubから8問のprotected hydrate / server gradeへ復旧。基礎2・標準4・応用2、ログ読解は標準1・応用1
- 提出中の回答固定、8件のID・正答位置・判定検証、未回答処理、離脱中の結果破棄
- format analyticsのログ分類をprotected移行後の公開シナリオIDと整合
- PR #222 merged、main `03971646435daf36fc355ed9bf9076a2d658cdad`
- publication run `35804975108` success、v35 run `35804975034` success、Pages run `35805011810` success
- PWA cache `fe-quest-v377-121`、profile schema 9、protected total 1180、`b_exam_algo` 50

### 科目A関連問題復習・公開残存関数の現行経路監査

`.github/reference-audits/REDACTED_RUNTIME_AUDIT_2026-09-23.md`

- 「関連問題を出題」設定を現行の科目A通常復習・学習計画の復習へ接続。公開メタデータから同じカテゴリ・概念の実在するIDだけを一部選ぶ
- 元の期限到来問題を少なくとも半分維持。再開IDは保持。直前復習は従来どおり元問題を優先
- 旧variant generatorと科目B総合実戦の旧関数は現行の保護ブリッジ経路では使われないことを確認。出題内容・正答は公開しない
- PR #224 merged、main `d56f37bf3de66d46817e22ec4ebda4b25c4b2b3c`
- publication run `35809095536` success、v35 run `35809095545` success、Pages run `35809143667` success
- PWA cache `fe-quest-v377-122`、profile schema 9、protected total 1180、`b_exam_algo` 50

### 科目A受験準備度の認知レベル評価監査

`.github/reference-audits/SUBJECT_A_READINESS_EVIDENCE_AUDIT_2026-09-23.md`

- 演習履歴があっても認知レベル別評価が常に0だった経路を、公開メタデータと保存済み問題IDの履歴から集計する形で修正
- 未演習の診断結果の加点上限を維持。既存のprofile構造は変更せず、問題・正答の公開もなし
- PR #226 merged、main `088910e2839ae9c4b183a64460db82b603c5daa7`
- publication run `35811298405` success、v35 run `35811298407` success、Pages run `35811328424` success
- PWA cache `fe-quest-v377-123`、profile schema 9、protected total 1180、`b_exam_algo` 50

### IPA 9.2 集合・ベン図ラボの読みやすさ監査

`.github/reference-audits/IPA92_VENN_READABILITY_AUDIT_2026-09-23.md`

- 本番デスクトップ表示で、ベン図ラボの本文・補助文字が11〜13pxと小さく、ユーザー向けに「IPA Ver.9.2補強」が残ることを確認
- ベン図ラボの本文・ラベルを拡大し、同表記をベン図・整列・グラフ・モデリング・メモリの5ラボから除去
- PR #228 merged、main `b29430845a77326865cf940b708bf28b5cf2c6cb`
- publication run `35812143960` success、v35 run `35812143979` success、Pages run `35812171084` success
- PWA cache `fe-quest-v377-124`。クラウドブラウザは1363pxのため、スマホ実機相当のタッチ・スクロール検証が済むまでは `FE92-THEORY-SET-VENN` を `in-progress` のままにする

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
- ユーザー向け画面・教材本文では、監査元の書名・章固有の呼称・「参考資料では」「参考書の例題」など、外部教材由来と分かる表現を使わない
- 主要本文18px以上、補助ラベル16px以上をスマホ基準にする
- 数式の指数・対数の底は上付き/下付き表記を優先する
- 不要な読み仮名は付けず、最尤法・尤度のような難読語の初出に絞る
- カード・図・表の上下余白とモバイル崩れも同時監査する
- 章の作業後は `.github/reference-audits/` に監査記録を残す

## 7. 次のデフォルト作業

ユーザーから別の具体的な修正指示がなければ、**IPA 9.2教材の未完了項目を章単位で監査する。** `ipa92-coverage.json` の43項目中37項目は `in-progress`、6項目は `verified-covered`（2026-09-23確認時）。ベン図ラボの表示改善 #228 は済み、スマホ実機相当のタッチ確認は未完了。実装済みとスマホ操作・直接演習・学習履歴まで検証済みの状態を分け、資料の強調箇所と現行教材を照合する。旧空関数は名前だけで復元せず、画面の実際の呼び出し経路を確認する。

手順:

1. `REFERENCE_MATERIAL_AUDIT_POLICY.md` と最新の章監査・公式シラバス対応表を読む
2. 章の節順に、説明・図・演習・スマホ操作・保存復旧の不足を確認する
3. 問題・正答を公開assetへ戻さず、不足が確認できた箇所だけ補強する
4. 監査記録→PR→CI success→merge→Pages deploy successまで確認する

## 8. リポジトリと保護教材の役割

- GitHub 公開リポジトリ: アプリコード、CSS、CI、監査方針、概念レベルの監査記録
- protected lesson bank: 教材本文の正本
- protected question bank: 問題本文・選択肢・解説・科目B render / trace metadata の正本
- 教材本文そのものを公開GitHubへコピーしない
- lesson / question bank を更新した場合、merge 後の source commit と content_version を対応する import manifest に記録する

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
