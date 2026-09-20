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

- main: `26e2dec3b0d21be4fc5f8ca07955f5b7e09edeaf`
- open PR: 0
- active work PR: なし
- 最新本番 deploy: GitHub Actions run `35486914132`、success
- PWA cache contract: `fe-quest-v377-68`
- 第1章詳細図解 PR: #118、merged
- 第2章詳細図解 PR: #117、merged
- 第3章詳細図解 PR: #120、merged
- 第4章詳細図解 PR: #122、merged
- 第5章詳細図解 PR: #128、merged
- 第6章詳細図解 PR: #130、merged
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

ユーザーから別の具体的な修正指示がなければ、**参考書の第7章へ進み、第1章〜第6章と同じ粒度で章単位監査を始める。**

手順:

1. 参考書の第7章をページ画像も含めて確認
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
