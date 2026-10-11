# FE QUEST 一般公開・収益化の準備

更新日：2026-10-11。ユーザーは外部βテストを省略する方針を明示した。この決定を、以前の外部β必須方針より優先する。利用者募集・7日間アンケート・人数や支払意向の検証を公開条件にしない。技術上の動作確認は行う。

## 用意したもの

| 項目 | 状態 |
|---|---|
| 一般利用向けの紹介 `start.html` | 実装。現在無料・登録任意・自動課金なしを案内 |
| 旧 `beta.html` | 紹介ページへ転送。旧リンクを維持 |
| `help.html` | 始め方、PWA追加、バックアップ、URL移行時の復元 |
| `terms.html` | 現在の無料利用の条件。販売契約は含めない |
| `privacy.html` | 現在のアクセスコード不要・限定配信・公開Issue受付に整合 |
| `feedback.html` | ご意見／不具合の2種類。日別テストと価格アンケートを廃止 |
| 公開用ZIPを作るCI | 現行Pagesのsanitized buildと保護境界検査を再利用。Cloudflare向け認証リダイレクトとヘッダーを用意 |
| 非公開ソース `docs/launch/2026-10-11/` | 販売条件・特商法表記の下書き、移行手順、現行Edge Functionの移行準備 |

紹介URL： https://taiwanwan64.github.io/fe-quest/start.html

### 公開受付の限界

入力だけでは送信されない。内容と公開への同意を確認してGitHubの投稿画面を開き、GitHub上で投稿を確定する。GitHubアカウントが必要で、内容と投稿者は公開される。コピー・保存だけでは運営者へ届かない。非公開の窓口は未設定。この点を隠して「問い合わせフォーム設置済み」と言わない。

## 商用配信への移行

`Build commercial release package` の成功したmain実行からartifactをダウンロードする。中の `fe-quest-commercial-site.zip` はHTML等の公開アセットだけで、問題・教材のDB本文、管理キー、非公開ソースは入れない。

1. Cloudflare PagesのDirect Uploadでプロジェクトを作り、ZIPをアップロードする。`pages.dev`の無料URLで開始できる。新URLはこの時点で確定し、存在を確認する。独自ドメイン購入は必須ではない。
2. 問題・教材の両Edge Functionが許可するOriginを、**確定した新Originだけ追加**して更新する。現在の許可先は `https://taiwanwan64.github.io` だけで、ファイルをアップロードしただけでは保護コンテンツが動かない。全Origin許可・ワイルドカードへ変えない。
3. Supabase AuthのRedirect URLsに新しいアプリの正確なURLを追加し、ログイン・ログアウト・同期・削除の導線を新URLで確認する。移行用ZIPの`redirectTo`は実行中ページのベースURLを参照する。旧本番configは変更しない。
4. 旧URLでバックアップを書き出し、新URLで復元する。異なるOrigin間でlocalStorage/IndexedDBが自動移行されるとは説明しない。復元確認まで旧サイトとデータを残す。
5. 新URLで初回診断→今日の学習→保護教材→演習→採点→再読込後の保存、PWAの起動・更新を確認する。CIのスマホ幅検査を実機iPhone検証と同一扱いにしない。
6. 新URLが受入を通った後で案内URLを切り替える。旧サイトの自動転送やデータ削除を先に行わない。旧URLに戻せるよう、切替前のcommit・ZIP・新URLを記録する。

Cloudflareアカウント・新URL・独自ドメイン・認証許可先は今回確定していない。Cloudflareへのアップロード、Edge Functions再deploy、Auth設定変更は未実施。ZIP作成成功を商用本番稼働成功とは表現しない。

## 有料販売の開始に残る項目

| 項目 | 確定が必要な内容 |
|---|---|
| 商品 | 実際に利用できる有料機能と無料版との差。未実装AIを販売しない |
| 価格 | 税込月額、初回と更新時の金額、提供開始日。480円/980円は過去の仮説 |
| 販売者情報 | 本名／事業者名、住所、電話、連絡用メール、開示方法。私的な情報を推測・公開しない |
| 非公開サポート | メール等の受付先と対応方法。公開Issueに決済・個人情報を投稿させない |
| 決済 | Stripe等の本人確認・契約、テスト決済、成功／失敗／再送時の権限反映 |
| 解約・返金 | 解約導線、次回請求停止、利用終了日、返金条件、アカウント削除との区別 |
| 権利 | 全問題・教材・図解・コード・画像の商用利用根拠。出典と条件を台帳に残す |

現時点で課金、Paywall、有料AI、購入予約、自動更新は実装・有効化しない。ユーザーのβ省略は尊重し、これらを外部テストの人数や結果待ちにはしない。未確定な商品・料金・本人情報が原因の残件として扱う。

## 技術・権利の現状確認

- 開始時live：public `06e9fd7ffe9dfc23673b968f45d4029a3d6cef09`、private `7f2784b0f656ba1459923ce510126bd58ca94427`、双方open PR 0、既存CI/Pages成功。
- 2026-10-11読み取り確認：public schemaの全11テーブルでRLS有効。保護用10テーブルのpolicyなしINFOは一般クライアントを拒否する設計で、安易に読み取りpolicyを追加しない。
- security advisorの`fequest_commit_profile_v342` SECURITY DEFINER警告は実関数を読み、冒頭で`auth.uid()`と対象IDの一致を確認し、不一致を拒否することを確認した。これだけで全認証監査完了とはしない。運用上意図された同期RPCで、今回権限を変更しない。参考：https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- 漏洩パスワード対策無効の警告あり。認証方式・プランによる適用範囲を確認する残件。参考：https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- 現行gateは問題v3／教材v2、OPEN_PREVIEW有効。アクセスコード不要と配信上限を維持。DB/既適用SQLを再実行しない。
- 教材品質監査の残件は継続。β省略は、既存制御5問の理由/bridge、全内容の権利確認、実スマホ確認の完了を意味しない。
- IPAは公表済み試験問題の利用条件を案内している。出版社の独自解説・図・予想問題へ同じ条件を適用しない。参考書の文章・図の転載は行わず、既存品質監査と商用利用権利監査を区別する。

## 公開紹介文（募集ではない）

基本情報技術者試験の学習アプリ「FE QUEST」を個人開発しています。

参考書の解説を読んでも分からない、科目Bの処理を追えない、今日は何を勉強するか迷う。そのような悩みを、毎日の学習計画・図解・演習と復習で支えます。

現在は無料で利用でき、クレジットカード登録は不要です。スマートフォン・PCのブラウザに対応し、ログインなしでも学習できます。クラウド同期は任意です。

使い方と利用条件は紹介ページをご覧ください。合格を保証するサービスではありません。

https://taiwanwan64.github.io/fe-quest/start.html

外部への告知投稿やメッセージ送信は未実施。

## 確認コマンドと運用

- `node .github/scripts/check-beta-preparation-v1.mjs`（名前は互換性を維持。内容は一般公開に更新）
- 同コマンドに`--browser`を付け、Chromium 1280px/WebKit 390px/320pxで表示・旧リンク・公開同意・入力消失・秘密情報除外を確認。
- 案内ページを開くとアプリ用index.htmlのオフラインキャッシュへ保存する既存問題を修正。情報ページは自身のURLだけへ保存し、通信失敗時も自身のキャッシュへ戻す。SW cache198。GitHub配下と新Originルートの両方で合成回帰検査。端末内プロフィール・runtime・DBは変更しない。
- 新CI `Build commercial release package` はsanitized stagingだけをZIPにする。商用課金やホストへの自動deployはしない。
- 個人情報を使う手続きは非公開下書きで整理し、公開リポジトリへ実データを書かない。
- 不具合の優先順位：保存/消失疑い→起動/学習不能→採点/解説の誤り→表示/操作。対応時間や利用者数の実績を捏造しない。
- 重大な保存不具合が出たらバックアップを保全して調査。配信を切り戻しても、新Originの履歴が旧Originへ自動で戻るとは説明しない。

## 一次資料

- Cloudflare Direct Upload：https://developers.cloudflare.com/pages/get-started/direct-upload/
- Cloudflare headers：https://developers.cloudflare.com/pages/configuration/headers/
- Supabase redirect URLs：https://supabase.com/docs/guides/auth/redirect-urls
- GitHub Pagesの利用条件：https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features#pages
- 消費者庁・通信販売：https://www.no-trouble.caa.go.jp/what/mailorder/
- 消費者庁・最終確認画面ガイド：https://www.no-trouble.caa.go.jp/pdf/20240319la03_04.pdf
- IPA公開問題の利用条件：https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/index.html
