# 科目B 第1章：引数の位置対応・returnの独立補助2問（2026-10-10）

## 再開時のlive確認

- Public main `fd09458d8112f9e11abacbda5ba5ba18d223a75c`、private main `b48f38959a788dacc9371dcedd94497e426a3ba6`。
- 双方open PR0。前記録branch（record-b-types-acceptance / record-b-types-import-20261010）はahead0/behind1/files0。public最新Pages `38020057600` success。実装・記録CIもsuccess。
- 両recursive tree非truncated、AGENTS.mdなし。GitHubのlive値を正として再開し、過去のmemoryだけで判断しない。
- DB1188問digest `4995a10a4ee697f6ba0cdab1d8f749cf`、130教材digest `e89f8d33fa35a4d104110807dddb3543`。

## 教材・既存問題の照合と判断

添付03第4版の物理057〜061（紙面055〜059）を画像で実読。関数の各部、複数引数を左から対応させる流れ、returnによる呼出し終了、引数/局所/大域の区別を確認。今回の新問題は独自の変数・数値・処理と選択肢であり、参考書の問題/解説/コードの転載ではない。04問題集全章の新規再監査はしていない。

現行protectedのactiveアルゴリズム143行（b_exercise40 + b_compound45 + b_exam_algo58）をliveで本文/renderまで取得。全行の関数/引数/return候補を確認し、複数引数の関数定義を持つ直接問題は0。既存再帰のreturn、値渡し1引数、局所/大域、木の高さ等はあるが、今回の2技能を独立して問う直接確認と同一視しない。既受入recursion等を無目的に再受入しない。全B190行/全50実戦候補の今回全採点を主張しない。

IPA現行資料Ver.5.1を実読し基本情報用別紙2の関数/手続呼出し表記を照合。returnの説明の照合元は添付03と現行guide。公式資料にreturnの明示行があったとは主張しない。
公式資料: https://www.ipa.go.jp/shiken/syllabus/doe3um0000002djj-att/shiken_yougo_ver5_1.pdf

## 保護source・DB

- Private PR #136 head `95456de962dbb9848edf41045e5bdd113fcf420f`、supplement `38049231151` / protected `38049231192` success。source merge `fe187926624c283c4b7897bc3f6acd38ed4d8444`。
- 新ID2件 `b_exam_bgrammar_call_order` / `b_exam_bgrammar_return_exit`。版 `b-grammar-functions-protected-v1-20261010`。全8選択肢理由あり。正答・問題本文・コード・選択肢・解説はprivate DB/sourceだけで保持。
- CI成功・merge後にone-shot append SQLを1回だけ適用。既存ID欠如、baseline件数と全行digest、全130教材、既存1188行不変、新2行の全フィールドreadbackをtransaction内で検査。ON CONFLICT/既存UPDATE/DELETEなし。
- 適用後1190問digest `45a80736f79bc29d0ccd312efcc11160`。旧1188行digest `4995a10a4ee697f6ba0cdab1d8f749cf`、全130教材digest `e89f8d33fa35a4d104110807dddb3543`保持。全2行（created_at/updated_atを除く）fixtureとreadback一致。UI後の再確認でも全digest一致。
- import manifestのsource/version/count/pool/payload SHAを1回記録。SHA `0876ceb33e924e1f0789907c5543b081d6d68f543d19648cdabbb9461977e26f`、imported_at `2026-10-10T11:44:23.802742+00:00`。
- Private記録PR #137 head `123383ff74e060401809a7c092bdf7539c85a655`、supplement `38049574686` / protected `38049574720` success。private main `9eb50482c6d800e2ffda0ace9d633d13131a2cfa`。
- **新旧INSERT・provenance SQL・既適用理由SQLを再実行しない。** schema/auth/RLS/権限変更なし。live gate v376 version3を取得して動的requestedIds対応を確認、旧repo gateを再deployしない。

## 公開実装・検査

Public PR #368 head `4533bde2f06a41110486d3422f5411bdfc715db1`、publication `38049278860` / v35 `38049278836` success。implementation main `cab6df2ddbe6700e47cfb74540867a59ab4dbc26`、Pages `38049347661` success。

既存文法早見表に「引数・returnの2問を確認する」を別入口として追加。元6問と型/未定義2問を置換・必須化しない。専用metadata-only catalogと独立modeを既存補助UIに追加。回答前のpayloadに正答/解説があれば拒否、bootstrap/grade検証と遅延応答の破棄を維持。profile/XP/history/offline保護本文へ書かない。通信必須/途中再開不可/XP・履歴・基礎進捗非加算をUI表示。

cache195、補助JS query `bgrammar-functions-195`。app/通常trace/final bridge/activation loader/一般provider/元6・型2catalog/補助CSSのblobは開始時と一致。本体/loader query `bfinal-resume-192`、guideCSS query `bgrammar-184`維持。一般catalog1180、通常B180、実戦50候補、基礎20+15、総合16+4、guide8節/10表は変更なし。DB1190を通常catalog件数へ流用しない。

ローカル検査：private旧6/types2/functions2 validator、JS syntax、公開synthetic3mode検査、guide/nested breakすべてPASS。新問は引数位置の独立計算、早期returnで後続が実行されないこと、偽経路/呼出し元の継続と境目を検査。公開testには保護fixtureをコピーせずalpha/beta/gamma/deltaを使用。全modeのflow/誤答retry/初回score/異なるversion-count-practice/leak/通信失敗、6方向の閉じた旧bootstrap/gradeと新modeの競合を検査。開始/終了ボタン、focus/消去を確認。

ローカル準備中の不足参照ファイルとSQL抽出regexの過剰escapeはpush前に修正して全PASS。GitHub CIは初回からsuccess。ブラウザーやアプリの本番障害として扱わない。

## 本番通常UI・保持

今回の既存browser tab1はabout:blank、FE QUESTに通常navigateすると初回設定画面だった。前回300XPゲストの継続確認はできない。保存データの消去/リセット/復旧/統合操作なし。今回だけの新QAゲストで必須初回診断12/12を通常操作で完了→120XP、受験日未定・60分の既定条件からホームへ。診断12問は補助2問の受入数へ含めない。

通常導線 学習→科目B→別モード→プログラムトレース→文法早見表→新2問。2unique位置、4採点操作（第1問誤答→再挑戦・第2問正答、別開始で第1問正答表示後の途中終了検査）、1結果。全2正答/説明・8理由、誤答choice無効化/ヒント、正答時全choice無効化、初回正解1/2と結果focusが新入口へ戻ることを確認。第1問の追加操作を3問目のunique受入に数えない。

終了と途中closeでcode/options/feedback空・question hidden。旧types2と旧6はそれぞれ先頭1/2・1/6だけ読込、未採点close。既受入8問の新規全反復/再採点ではない。

新2本文/コード/選択肢/解説/理由18px、見出し19px。feedback容器自体16pxでもp/liは18px。desktop document client/scrollWidth1348/1348、横溢れなし。実スマホ/narrow touch/内部横移動/縦横切替は未受入。

ホーム移動・通常reload後に120XP、A0/130・B0/35・トレース0/20・security0/15・短い実戦0/5・総合実戦0/2保持。今回QAの0進捗であり、過去300XPゲストの2/35を保持できたと主張しない。結果/入口/120XPの画像を保存。公開GitHubに保護本文を含む画像を置かない。

## 確定範囲と次の限定作業

引数位置対応・return後非実行/呼出し元継続の独立補助2問はdesktop受入完了。文法章全skill・全B・実スマホ完了ではない。

次は**同じ文法章のコメントと実行行の区別を直接問う既存protected問題をliveで探索し、既存利用/追加/guide補強を判断する**。単にコードにコメントがあるだけを独立技能受入と数えない。第2章へ自動で進まない。今回追加後のアルゴリズム行は145（40+45+60）。

境界値の作成/候補排除、他13親26予測の理由、制御exam5行の理由とfinal bridgeでの引継ぎ不足、実スマホは残件。IPA43は6 verified-covered/37 in-progress、inventory incomplete。第22章関連度gapも維持。
