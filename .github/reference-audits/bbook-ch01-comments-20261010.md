# 科目B 第1章：コメントと実行命令の独立補助1問（2026-10-10）

## 開始時のlive状態

公開main d6e15f04e7eaf59188edbdedb6cc0c40cbfda814、非公開main 9eb50482c6d800e2ffda0ace9d633d13131a2cfa。双方open PR0、前記録branchはahead0/behind1/files0、mainのPages 38049993802と各CIはsuccess。両recursive tree非truncated、AGENTS.mdなし。GitHubの現状を正として再開。

DB1190問digest 45a80736f79bc29d0ccd312efcc11160、130教材digest e89f8d33fa35a4d104110807dddb3543。

## 照合と限定判断

添付03の物理028〜030（紙面026〜028）の変数/宣言/上から実行する説明、物理074（紙面072）の行末・複数行コメント説明/範囲図、物理076（紙面074）の確認項目を画像で実読。関連する旧画像の関数/トレースページも確認したが、今回全章・04問題集全体を再監査したとはしない。IPA言語Ver.5.1別紙2の注釈記号を照合。改行を含む範囲と非実行の明示は添付03で確認。新問題・数値・選択肢・解説は独自作成で、教材の文章/問題/コードを転載しない。
公式: https://www.ipa.go.jp/shiken/syllabus/doe3um0000002djj-att/shiken_yougo_ver5_1.pdf

現行activeアルゴリズム145行（exercise40 + compound45 + examalgo60）をlive全文取得。コメント/注釈/実行されない行等をstem/explanation/hintとrender codeから確認。コメント記号がある既存問題はscopeの局所/大域ラベルだけで、独立したコメント非実行の確認とは数えない。145行の探索結果から1問を別入口へ追加し、全Bの今回全採点・全技能充足は主張しない。

## protected source・DB

- private #138 head b8c64d562db59ad268417260e37c6656105ef1ce、supplement 38051943574 / protected 38051943603 success、source merge be60b0bfa5dbd93ff4e8409703440312d8908a71。
- 新ID b_exam_bgrammar_comments、版 b-grammar-comments-protected-v1-20261010。行末/複数行/行中コメントの内側を実行しないことと、閉じた後の同じ行の命令を扱う。全4選択肢理由あり。問題本文・選択肢・正答・解説はprivateのみ。
- CI/merge後にone-shot appendを1回だけ実行。ID欠如・1190行と130教材の全digest・新1行の全readback・旧行不変をtransaction内で検査。既存UPDATE/DELETE/ON CONFLICTなし。
- 1191問digest 74c56a7ea47cceaf71c2247dc424df2b。旧1190問digest 45a80736f79bc29d0ccd312efcc11160、130教材digest e89f8d33fa35a4d104110807dddb3543保持。日時を除く全フィールドの再取得はcanonical比較でfixtureと一致。JSONのキー順を含む単純文字列比較は使わない。UI後のread-only再検査も一致。
- import manifestを1回記録。payload SHA256 91c296461560b679e571c79ced2aaf80456b56e216068ed46a156b83d8d0c348、imported_at 2026-10-10T12:28:13.211308+00:00。
- 記録private #139 head af04eb0b21377d73374e1d15d7ef374ee04b79a0、supplement 38052224560 / protected 38052224579 success、main 0bd634c59d2fc2ca37ef81900e8910c599c07acb。
- 新旧INSERT/provenance/理由SQLは再実行しない。schema/auth/RLS/権限変更なし。現行gate version3のrequestedIds 1〜60対応を実読。旧gate再deployなし。

## 公開実装・検査

公開 #370 head 900b9451eb0ccbd09218b05d0b8fcd80d52d5075、publication 38051947960 / v35 38051947980 success、implementation main 4f6232eece17e3a1035225be2805ca006a1cac6f、Pages 38052070458 success。

既存補助UIに独立comments mode/metadata-only catalog/1問ボタンを追加。元6問・型2問・引数2問を維持。guideのコメント説明を文字列連結の説明から分離し、改行をまたぐコメントと同じ行の外側の命令を明確化。guideの8節/10表は維持。

cache196、補助JS query bgrammar-comments-196。本体/trace/final bridge/provider/activation loader/旧3catalog/補助CSS/guideCSSは開始mainとblob一致。本体/loader query bfinal-resume-192は維持。一般catalog1180・通常B180・実戦50候補・基礎20+15・総合16+4は変更なし。DB1191を一般catalog件数へ流用しない。

公開testはsyntheticのみ。4mode（6/2/2/1）のflow・retry・初回score・通信失敗・version/count/practice検証・回答前leak拒否、12方向の閉じたbootstrap/gradeと新modeの競合を検査。privateは小さい許可済み構文の独立トレースで正答と3誤答モデルを検査し、任意コードを実行しない。ローカルでは誤答モデルの単純代入にparser未対応で一度失敗し、限定matcherを修正してPASS。公開ローカル/両PR CIは成功。既存アプリ障害とは扱わない。

## 本番UIと保持

タブ1はabout:blank、通常navigate後は初回設定。前回120XP/過去300XPゲストの継続証明なし。プロフィール消去/リセット/統合なし。今回の新QAゲストで必須診断12/12→120XP、受験日未定/60分の既定条件でホームへ。

学習→科目B→別モード→プログラムトレース→文法早見表→コメント1問。1unique ID、3採点操作（誤答→再回答、別開始で初回正解）、2結果（初回0/1・1/1）、未回答close1回。全正答/説明/4理由・誤答選択肢無効化/ヒント・正答時全選択肢無効化を確認。結果focusは新入口、終了/closeでcode/options/feedback消去・question hidden。引数2問は先頭読込のみ未採点close。既受入10問の再採点はしない。

本文/code/選択肢/理由18px、見出し19px、改訂guide18px。desktop document client/scrollWidth1348/1348で横溢れなし。実スマホ/狭幅タッチ/横移動/縦横切替は未受入。

ホームへ移動し通常reload後、120XP、A0/130・B0/35・trace0/20・security0/15・short0/5・final0/2保持。通常最近の演習は空。今回の新QA0進捗であり、以前の進捗/プロフィールの継続保証とはしない。終了/入口/120XPの画像を保存。保護本文の画像を公開GitHubへ置かない。

## 確定範囲と次の限定作業

コメントと実行命令の独立補助1問はdesktop受入完了。補助確認は6+2+2+1であり、通常演習・XP・履歴へは加算しない。文法章全skill・全B完了ではない。現在アルゴリズム146行（40+45+61）。

次は同じ第1章の境界値作成・候補排除について、現行guideとprotected問題の直接技能をliveで照合し、既存利用/不足補強/受入を判断する。既受入7親14予測・補助11問・制御5件を無目的に反復せず、第2章へ自動で進まない。

他13親26予測の理由、制御exam5行の理由/final bridgeの引継ぎ、実スマホは残件。IPA43（6 verified-covered/37 in-progress、inventory incomplete）、第22章関連度gapも維持。記録PR後のmain/branch/open PR/CI/Pagesはliveで再確認する。
