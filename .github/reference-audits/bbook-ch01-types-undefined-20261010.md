# 第1章文法：型・未定義の独立した補助確認2問（2026-10-10）

## Live起点・照合

開始 public main `b4368de36f5085bd26e5d8b521772475f58a0f7f` / private main `dfb709bafa302d13ef442e92a4e71b8a19cf211e`。双方open PR0、直近CI/Pages成功。前作業branchはahead0/behind1/files0。最新handoffと補助UI/catalog/private fixture/validator/SQL、実稼働gate version3を実読。recursive treeは非truncated、AGENTS.mdなし。

前回のlive探索はactiveなb_exercise40 + b_compound45 + b_exam_algo56 = 141行。型を使う計算問題・「未定義」を誤答候補とする問題はあるが、5型の用途識別と未定義/格納済みの値の対比を直接問う独立問題はこの範囲で確認できなかった。security45を含む全Bの新規欠如判定ではない。今回のDB baseline digestは前回と一致し、既存141行を含む全1186行の不変を確認した。

添付03の物理028/029/031/032（紙面026/027/029/030）を画像で確認。既存型・宣言・未定義guideは維持し、既存6問を置換せず独自2問を作成。参考書の文章・設問・解説・図・コードの転載ではない。型は用途に最も直接対応するものを問う。文字列型も空/1文字を扱えるため、1文字なら常に文字型しか入らないと誤解させない。

[IPA公式「用語・プログラム言語など」Ver.5.1](https://www.ipa.go.jp/shiken/syllabus/doe3um0000002djj-att/shiken_yougo_ver5_1.pdf)の別紙2で、値を格納していない未定義と未定義の代入の規則を実読。表計算の空値/nullや他言語の未定義動作と混同しない。Supabase skillに従いchangelog.mdを試みたがwebはmarkdown MIME未対応、HTML changelogと現行Tables docsへ切替。今回は既存表のcontent appendのみで、schema/extension/auth/RLS/gate変更なし。

## Protected source・DB

- private PR #134、head `b089d5c4ba8ed159490833b1f258e9b3b2f3df76`。
- supplement CI `38019467090` / protected lessons CI `38019467114` success。
- source merge `2252b09f0d4cbf959fb1ea605bfc09e1c5091b91`。
- 新ID `b_exam_bgrammar_types` / `b_exam_bgrammar_undefined`、content version `b-grammar-types-protected-v1-20261010`、新2問/8選択肢理由。
- 新fixture/validator/one-shot append SQLをprivateに保存。旧6問fixture/INSERT SQL/validatorは内容不変。
- validatorは5型の順と明示的sentinelで未定義状態を検査、コード・選択肢・正答・理由・SQL payload完全一致を確認。JS truthinessを未定義のモデルにしない。
- CI/merge後、pinned sourceとSQLを照合して新INSERTを1回だけ適用。全2行はcreated_at/updated_at以外の全フィールドをfixtureへ照合一致。
- 1186→1188問、旧1186行全フィールドdigest `a6f614049e12cd924c43838f58a3effb` を保持。全130教材digest `e89f8d33fa35a4d104110807dddb3543` 保持。
- 新全1188問digest `4995a10a4ee697f6ba0cdab1d8f749cf`、UI後も一致。
- pool: b_exercise40 / b_compound45 / b_exam_algo58 / b_security45 / subject_a979 / diagnostic12 / chapter_extra9。
- import manifestにversion/2件/pool/source merge/payload SHA256 `ab05c4bf2639486c22c444ff31b100d2c70a1bb779d1635b50ead7822a3229c5` をguard付きで1回記録、readback一致。
- **新旧INSERT・理由SQL・provenance SQLを再実行しない。旧gateを再deployしない。**

## Public実装・CI・配信

- public PR #366、head `06e6d4b6b3892bab5c7f1ec99a2c425b83977a58`。
- publication `38019468350` / v35 `38019468479` success。
- implementation main `afbf2d34930477dd691dcdad79dc78f3c97b643f`、Pages `38019598237` success。
- 元の6問専用catalogは同一blob。新2問を独立したmetadata-only catalog/ボタンで選ぶ。6問を強制してから2問を出す構成にはしない。
- 公開側にはID/分類のみ。新問題本文・選択肢・正答・ヒント・解説・render codeは置かない。public testのprompt/options/reasonsはsynthetic。
- 2subset共通UIにsize/version/practiceを分離。6問/2問のフロー、first score、誤答・再挑戦、不正catalog/bootstrap/回答前正答leak、採点失敗、終了後の遅延bootstrap/gradeとsubset切替をテスト。
- 本番本文はno-storeで取得しruntimeだけ。profile/XP/history/localStorage/sessionStorage/IndexedDBへ書かない。既存通信必須・加算なし・途中再開不可の案内は維持。
- cache194、新補助JS query `bgrammar-types-194`。app/trace bridge/activation loader queryは本体不変のため `bfinal-resume-192`。
- appJS・final/trace bridge・loader・元6問catalogのblobは開始mainと一致。一般catalog/provider1180、通常B180、実戦50候補、基礎20+15、総合16+4、guide8節/10表は不変。
- CI artifactにも新metadata catalog/SW/ボタン存在を検査。privateとpublicとも初回GitHub CI success。ローカル読出し用node commandの括弧/大きすぎるstdoutは修正し、ファイル別chunk readへ切替。これをアプリ不具合やGitHub CI失敗と扱わない。

## Production desktop acceptance

同じ300XP QAゲストを開始・公開後・確認後・通常reload後に確認。診断/リセット/profile削除/別ゲスト作成なし。隠し関数/状態編集/強制出題なし。

- 通常UIの学習→科目B→プログラムトレース→文法早見表→型・未定義の2問から開始。
- 新2unique問題位置/3成功採点（1意図的誤答→同問題再挑戦＋次問初回正解）/1結果。全2正答・全体解説・8選択肢理由を独立照合。
- 初回正解1/2。誤答ボタン無効化・ヒント・再挑戦・次へ・結果と選択subsetへfocus復帰を確認。1/2は意図的誤答を含むQA結果である。
- 文・コード・4択・理由18px、見出し19px。document client/scrollWidth1348で横溢れなし。実スマホ/狭幅/タッチの受入ではない。
- 既存6問は先頭まで読み込みのみ確認して未採点退出。6問全採点を新規受入に加算しない。
- 結果/途中終了ではcode0文字/options0/feedback空、question hidden。ホーム移動後と通常reload後も300XP、A0/130、B2/35、トレース2/20、security0/15、短い実戦0/5、総合実戦0/2を保持。
- 本番PWA更新で旧AX indexが失効し、fresh AXへ切替。独立したアプリ不具合とは断定しない。
- 画像 `fe-quest-types-undefined-20261010-1791601957749.jpg` 保存済み。保護問題画像を公開GitHubへ置かず、結果と入口のみを保存。

## 次と残件

型/未定義の独立した補助2問はdesktop通常UIで受入済み。章全skillや学習者の到達能力・全B完了は宣言しない。次は同じ第1章の複数引数の位置対応とreturn後非実行を直接問う既存protected問題をliveで探索し、既存利用/新規追加を判断する。既受入7親14予測・補助6+2問・制御5件を無目的に反復しない。第2章へ自動で進まない。

他13親26予測の理由、制御exam5行の理由/final bridge引継、コメント、境界値作成/候補排除、実スマホの狭幅/タッチ/内部横移動/縦横切替は残件。IPA coverage43（6 verified-covered/37 in-progress、inventory incomplete）、第22章関連度gapは維持。記録PR後のmain/branch/open PR/CI/Pagesは次回liveで再確認する。
