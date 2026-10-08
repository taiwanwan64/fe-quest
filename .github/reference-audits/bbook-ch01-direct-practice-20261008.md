# 文法章・全B直接演習の追補（2026-10-08）

## 確定受入：追加6問の内容・デスクトップ（2026-10-08 UTC / JST）

### PR・CI・配信

- private PR #130 head `4c77f9be3dca852ef2bbbba7fb4787404e85e42c`。補助確認CI `37735540263` / 保護教材CI `37735540351` success後にmerge。private main `030c4164dda109974fbba150213f1cec1cc5db74`。
- public PR #349 最終head `996b21fe35dbf2df32ac6e92a4c69efc66a1a674`。publication `37735875205` / v35 `37735875238` success後にmerge。実装の配信確認main `9c26424d1edc836ecfeb356bd3063e8b68ab49b0`、Pages `37735921600` success、cache185。
- 初期headのpublication `37735688379` / v35 `37735688228` はcache184固定検査によりfailure。sw/Pages/公開2workflowの期待番号を185へ揃え、最終headのsuccessで解消した。一般providerの1180問/50候補契約は緩めていない。

### DB（既適用・再実行禁止）

CI成功後、privateに保存したone-shot guarded INSERTを**1回だけ**適用。新6行全field readback一致。全1186問/130教材、b_exam_algo56行（通常50+補助6）。既存1180行digest `c62e79b86ba41d03c054db09e6337bd2`、130教材digest `e89f8d33fa35a4d104110807dddb3543` は保持。追加後DB全問digest `8385789f12edf994d6ae4eee0ea86b7f` を採点後にも確認した。旧ID・選択肢・正答index・extra・version・active・日時を変えず、教材やimports、プロフィールや過去採点へ書いていない。新規fixtureはcreated/updatedをDB defaultで設定。第21章等の既適用deltaを再実行していない。

### 本番通常UI

前回文法ガイド受入と同じ確認用ゲスト（120XP・A0/130・B0/35・履歴なし）を再読。別ゲストへ作り直したり、過去の1247XPゲストを消去/復旧/統合したりしない。通常再読込→学習→科目B→別の学習モード→プログラムトレース→文法早見表の導線で6問を開始した。

全6種類を通常UIで採点し、各正答根拠・4選択肢の理由を読んだ。最初の問題は意図的誤答1件→ヒント/誤答無効化→正解再挑戦を確認。他5問は初回正解、最後は初回正解**5/6**と表示し、再挑戦を初回へ加算していない。成功した採点は7件、6問題位置・1結果。2問目のDOM計測helperでparseFloat未提供のエラー、4問目の最初のUI操作で採点表示へ移らず待機timeoutがあった。いずれも現在表示を再確認し、前者は再採点せず、後者は画面の選択肢を選び直して採点を確定した。通信異常やアプリ不具合と断定しない。

追加欄の各問題/解説/ボタン/ヒントを実測し本文18px、h4は19px。1問目20要素、他5問は各19要素（同じ静的欄を含むのでunique合計とは数えない）。viewport1363px、document scrollWidth1348px、追加欄client/scrollWidth868pxで横溢れなし。結果画面の余白・注記・120XPを画像で目視し、確認画像を保存した。公開GitHubへ画像を置いていない。

開始→最初の問題表示→「確認を閉じる」で本文/解説/選択肢が消え、途中解答を保存しない表示を確認。別の開始→最初の問題表示→ホームへの画面移動でコード空・question hiddenを確認した。通信失敗・不正payload・遅延応答・guide collapse時のcleanupは回帰testで検証し、**本番の回線障害を意図的に起こしたとは主張しない**。

通常再読込後も120XP・A0/130・B0/35、演習メニュー「まだ演習履歴がありません。」と科目A979問を確認。補助6問を既存の学習完了や履歴へ加算していない。基礎20/15・実戦50候補・総合16+4・app本体不変。今回採点したのは補助6問だけで、通常180問全品質/全本番受入を主張しない。console採取にブラウザー拡張由来のmetadata errorがあるがFE QUEST由来として扱わない。

### 継続の残件

補助6問の内容・デスクトップ受入は完了。文法章全体の完了を宣言しない。次は**同じ文法章**の既存関連演習の通常UI採点/解説受入を前回監査と照合し、未確認分のみ進める。実スマホ狭幅・タッチ・横スクロール・縦横切替は未検証。coverage in-progress、IPA43（37 in-progress / 6 verified-covered）、第22章関連度計算direct-practice-gap維持。第2章へ自動的に飛ばさない。追加SQLや既適用章delta、補助6問全操作の反復を避ける。

記録PR後の最新main・作業branch・open PR・CI・Pagesは次回live再確認する。下の候補時点記録より、この確定受入を優先する。

## 再開時に確認したGitHub現状

- public main: `ca03a28954f82569fa275ba111e7bf5309567c27`、tree `db68441381e262d4aba514a8d24a3efce0d7ef87`。
- 前作業branch `record-b-grammar-acceptance-20261008`: `823938ebd490ec91acc9b1804644e4f00f99c548`。mainとtree一致、open PR 0。
- Pages `37733947369` / publication `37733857607`: success。
- private main: `bf691b8ae0537766dc820d7e2ba824be783b5ae3`、open PR 0、保護CI `37699904155`: success。両repoのrecursive treeにAGENTS.mdなし。

## 全180行からのcoverage再判定

保護DBからactiveなtrace 40 / security 45 / compound 45 / exam 50の本文・コード・選択肢・正答・ヒント・解説・renderを読み取った。前回の基礎20/40内のgapを全Bへ拡大して照合した結果を、次のように限定する。全180問の本番採点や全品質受入を完了した意味ではない。

| skill | 既存の根拠 | 今回の判断 |
|---|---|---|
| doの後判定反復 | `b_exam_bexam_ctrl_03` | 既にある。全Bでdoが欠如しているとは言わない |
| while/doの初回条件偽・0回対1回 | 同問題は複数回の後判定反復 | 境界比較の直接確認を新規追補 |
| 同名の局所/大域・呼出しごとの初期化 | `b_exam_bexam_rec_02`は引数を変えても呼出し元変数が変わらない例 | 同名局所宣言/大域との区別は直接欠如 |
| 論理or/not | bit_permission / bexam_bit_04等はビット演算 | ビットOR/NOTを論理型のcoverageに数えない。直接欠如 |
| 文字列連結 | SQL/XSSの説明に文字列、連結リストに「連結」はある | 擬似コードで文字列を連結して出力する直接問題は欠如 |
| 実数商/整数商/余りの対比 | ctrl_02、binary_count、rec_04等でdiv。sales_filterで平均 | 整数除算自体は既存。実数商/整数商/余りを区別する直接確認を追補 |

## 追補の設計

- 独自の補助確認6問を新しいID `b_exam_bgrammar_*` と版 `b-grammar-protected-v1-20261008` で追加する。既存IDの意味・選択肢・正答や過去採点を変更しない。
- 本文/選択肢/ヒント/正答/解説は非公開sourceと保護DBのみ。公開の専用catalogはID/parent/順序/分野/形式等のmetadataだけ。
- 既存general providerの1180問catalog、Bの通常180問metadata、基礎20+15、実戦50候補・総合16+4選択を変更しない。専用catalogと独立した6問の補助確認欄として文法ガイド内に置く。DB全体は適用後1186問、b_exam_algoは56行（通常50+専用6）となる。
- 既存の同一question gateを利用。Supabaseのlive Edge Function version 3を読み、open preview / renderContext / answer後のchoiceExplanationsを確認した。repo内の古いgate本文を再deployしない。空のaccessCodeは現行open-preview仕様であり、新たな権限経路や秘密鍵を使わない。
- 学習履歴/XP/基礎35進捗/プロフィールへ書かない。利用者へ「加算しない」「通信必須」「途中再開不可」を開始前に明示する。内容をService WorkerやlocalStorageへ保存しない。metadataと公開UI資産のみAPP_SHELLに追加、cache185。
- 初回正答数と再挑戦を区別。誤答後のヒントと3誤答を含む選択肢別理由、無効化、次へ/結果を設ける。ガイド閉鎖・画面移動・pagehideでメモリー/セッショントークンと表示を消去、遅延応答の反映を拒否する。

## 検査とDB適用条件

私有validatorは6問の独立した実行結果と選択肢/正答を一致させ、本文コードがoracleの前提から変わらないことを検査する。公開回帰検査は6問flow、初回スコア、誤答再挑戦、回答前の正答漏れ/不完全payload/別pool/重複/不正catalogの拒否、採点失敗、遅延応答/閉鎖/画面移動時のcleanup、永続化なしを検査する。既存文法8節、ch22、A/B cold boot回帰はlocal PASS。

DB適用はprivate CI成功後、保存済みone-shot SQLを1回だけ実行する。全既存1180行digest `c62e79b86ba41d03c054db09e6337bd2`、全130教材digest `e89f8d33fa35a4d104110807dddb3543` が合うこと、新ID未存在をlock下で要求する。既存行をUPDATE/DELETE/upsertしない。追加後1186行・既存全行digest保持・6行全field readback一致を同じtransaction内で要求する。既適用の第21章等の更新を再実行しない。

## 現時点の残件

PR/CI・one-shot適用・配信・本番通常UIでの全6問、通信失敗/誤答/通常再読込、XP/履歴保持は後続の受入記録で確定する。現時点では未完了として扱う。実スマホの狭幅・タッチ・横スクロール・縦横切替は未検証。全skill完了、第2章着手、coverage昇格は宣言しない。IPA43（37 in-progress / 6 verified-covered）と第22章の関連度計算direct-practice-gapを維持する。

