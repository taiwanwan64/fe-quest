# FE QUEST — 次チャット引き継ぎ

> **重要:** このファイルは作業再開の入口です。ここに書かれた状態を盲信せず、次チャットでは必ず GitHub の live 状態（main / 作業ブランチ / open PR / CI / Pages deploy）を最初に再確認し、GitHub の現状を正としてください。

## 最新確定状態：文法章の教材・演習・受入対応表（2026-10-09）

live public main `d82a57461652cf63339749a42cb6c8bdcde66f2c` / private `756f1451e114990cc59599cef4be7ed4b5c93b9b`、双方open PR 0、前作業branch ahead0/behind1/files0、#360 CI/Pages `37923053097` successから再開。現行guide/専用catalog/final bridgeとDB基礎40＋補助6＋制御5＝51行を実読。構文検索はactiveな基礎/compound/exam計141行に限定、全B186行の新規再監査ではない。03添付の物理028・067〜080を画像で再読し、紙面074の確認13項目を現行guideへ対応づけた。

[教材と受入の対応表](reference-audits/bbook-ch01-acceptance-map-20261009.md)に、guide8節・補助6問・基礎5親10予測・制御exam5問を整理。対象21 IDの受入を章完了率に変換しない。論理andは補助logical_or/notにも存在して受入済みで、欠如とは扱わない。制御5行の4択理由は空で、final bridgeもchoiceExplanationsを引き継がないため、DB理由追加だけでは画面の不足は解決しない。

**次の限定対象は既存array_reverseの2予測（減少for）＋binary_search_bの2予測（elseif）。liveで4行存在と理由空を確認。保護本文/正答/解説の独立トレースと理由の補強判断後、通常UIで対象4予測を受入する。** 既受入6問/5親/制御5件を全反復せず、第2章へ自動的に進まない。型/未定義、複数引数、コメント、境界値作成・候補排除は独立技能の受入保留。guideの入れ子break説明は補強候補。全Bで問題欠如と確定したわけではない。

今回は対応表/引き継ぎのみ、ブラウザー採点・XP・DB/アプリ/private変更なし。1186問digest `df83aae7e41c90f929b180ffb18bfc13` / 130教材digest `e89f8d33fa35a4d104110807dddb3543` 一致。cache191、既適用SQL/理由SQL/旧gateを再実行・再deployしない。実スマホ、coverage43（37 in-progress/6 verified-covered、inventory incomplete）、第22章関連度gapを維持。記録PR後のmain/branch/open PR/CI/Pagesは次回liveで再確認する。以下は当時の履歴。

## 最新確定状態：文法制御exam5問のUI受入一巡（2026-10-09）

public main `f377b33024d7addcc6369b7abbe00449f46935f3` / private `756f1451e114990cc59599cef4be7ed4b5c93b9b`、双方open PR 0、前作業branch ahead0/behind1/files0、#359 CI・Pages `37921465582` successをlive確認して再開。既受入ctrl_02/05を全反復せず、未受入ctrl_01/03/04の保護本文を再読・独立トレース。添付第4版の物理42（紙面040）のwhile/do前判定/後判定を画像で確認。

前回360XP・実戦履歴1件を同じブラウザーの通常UIで確認し、今回は同一QAゲストを継続。旧570/575XPプロフィールの復旧/統合/継続証明なし。プロフィール消去・リセット・再診断・別ゲスト作成なし。

通常総合実戦を1回開始し、対象3件が自然出題: `b_exam_bexam_ctrl_03` Q2（do後判定）、`ctrl_01` Q3（偶奇分岐）、`ctrl_04` Q10（最内側break）。隠し関数/状態編集/強制出題/選択規則変更なし。10回答後に見直し印付きQ2へ戻り通常reloadし、10/20・Q2・約97分・360XP・4択順序・選択済み回答・★印を保持して再開。対象本文を永続resumeへ書かない既存metadata形式は維持。

20問提出→20/20（擬似言語16/16＋sec4/4、未回答0）、+240XP→600XP、時間05:05。全20問レビューと対象3件の正答/説明が独立計算に一致。**前回ctrl_02/05＋今回ctrl_01/03/04で既存制御exam5問の通常UI採点/説明受入が一巡。do後判定の未受入は解消。** 制御5件を文法章全skill/全B180/実スマホ完了とは言わない。

提出後の通常reloadで600XP、A0/130・B基礎0/35・トレース0/20・総合実戦2/2、ベスト100%、履歴2件（今回20/20・05:05／前回20/20・15:04）保持。重複加点なし。600=診断120＋実戦240×2。各実戦20表示位置であり、累計40unique IDや全50件受入とは主張しない。1回で3対象がそろったため追加実戦を反復しない。結果画像保存済み。

公開実装・private変更なし、受入記録2ファイルのみ。作業前後read-only全行digest一致:1186問 `df83aae7e41c90f929b180ffb18bfc13` / 130教材 `e89f8d33fa35a4d104110807dddb3543`。**既適用SQL/理由SQL再実行、旧gate再deployなし。** 実装は#357/#358、cache191のまま。

**次は同じ文法章の残件を教材guide・補助6問・既存5トレース10予測・制御5examの受入対応表としてliveで整理し、未確認skill/誤答理由の不足を具体化する。受入済み制御5件や補助6問/5トレースを無目的に全反復しない。第2章へ自動的に飛ばさない。** 制御exam5行のchoice_explanationsは空。他15親30予測の理由、実スマホ狭幅/タッチ/内部横移動/縦横切替、IPA coverage（43登録・37 in-progress/6 verified-covered、inventory incomplete）、第22章関連度gap維持。

詳細：[残る制御3問の受入](reference-audits/bbook-ch01-control3-acceptance-20261009.md)。記録PR後の最新main/branch/open PR/CI/Pagesは次回liveで再確認する。以下は当時の履歴。

## 最新確定状態：文法制御exam2件受入・総合実戦cold boot修正（2026-10-09）

live public `3653fd687a29b5a376250003adc659d66cb6cae4` / private `756f1451e114990cc59599cef4be7ed4b5c93b9b`、双方open PR 0、前作業branch差分なし、CI/Pages successから再開。同じ第1章の制御exam5件をlive保護本文・独立トレースで照合して5/5一致。既存div/doがあるため全B欠如とは判定しない。

別QAゲスト診断12/12→120XPから20問総合実戦へ。5/20回答後の通常reloadでbridge未準備による `v376_b_final_bridge_missing` と二重例外を観測。PR #357はDOM読込完了後にrestoreし、不在bridgeのcatchも安全化。公開後に最新版provider切替前の旧catalog検索競合が残り、PR #358でactivation loaderのconfig/最新版provider準備だけをawaitする処理を追加。クラウド認証/同期完了へ依存しない。本文・DB・採点・選択・profile/resume形式は不変。resumeへ保護本文/選択肢/codeを永続化しない。

#357 final head `153ade6038db6f514769c69d9b9444657879bc81`、publication `37920142525` / v35 `37920142494` / Pages `37920205597` success。#358 final head `f7d5fb531c750066f6457888aa6d69743045b822`、publication `37920557465` / v35 `37920557452` / Pages `37920601960` success。実装配信main `765f05c6e6394534c29071018fc9aecd29f42d2c`、cache191、app/loader query `bfinal-resume-191` を本番DOMで確認。元失敗再現と遅延config/provider、正常復元、通信/順序/不在bridge失敗を回帰testへ追加。最初の#357 CI cache固定検査更新漏れはmerge前に修正済み。

本番同じ途中metadataを通常reloadし、5回答・6問目・約88分・120XPを復元。SW追加reloadも保持。その後全20問を通常UIで提出し20/20正解、擬似言語16/16＋sec4/4、未回答0、+240XP→360XP。全20問レビューの正答/説明を確認。文法対象の `b_exam_bexam_ctrl_02`（Q9:整数div while）と `ctrl_05`（Q4:累積）の2件を採点/説明まで受入。関連再帰Q11/探索Q16のdivも同じ20問で確認。独立照合5/5とUI2/5を混同しない。

提出後の通常reloadで360XP、A0/130・B基礎0/35・トレース0/20・総合実戦1/2、ベスト100%、履歴1件（20/20・100%・15:04）保持、重複加点なし。15:04は修正/配信待機を含むQA時間。旧570/575XPゲストの復旧/統合/継続証明なし。診断とは別に20unique問題位置/1提出であり、再hydrate回数を新規受入数へ加算しない。探索時ミニ模試8問は未提出退出。

DB read-only不変1186問digest `df83aae7e41c90f929b180ffb18bfc13` / 130教材 `e89f8d33fa35a4d104110807dddb3543`。private変更なし。**既適用SQLや理由SQL再実行・旧gate再deployなし。**

**次は同じ文法章の未受入 `ctrl_01/03/04`、特にdo後判定 `ctrl_03` を通常UIで確認する。ctrl_02/05や既受入トレース/補助6問を無目的に全反復しない。** 他15親30予測の選択肢理由、実スマホ狭幅/タッチ/実内部横移動/縦横切替は未受入。全B180・全skill・全章の完了とは言わない。coverage in-progress、IPA43（37 in-progress / 6 verified-covered）、inventory incomplete、第22章関連度gap維持。

詳細：[制御exam・総合実戦再開の受入](reference-audits/bbook-ch01-control-final-resume-20261009.md)。以下は履歴。記録PR後のmain/branch/open PR/CI/Pagesを次回liveで再確認する。

## 最新確定状態：文法章の既存10予測・40選択肢理由と表示改善（2026-10-09）

既存loop_sum/count_even/nested_loop/gcd_euclid/recursionの10予測に40理由を追加。private PR #131/#132のCI成功後、修正したone-shot SQLを1回適用済み。初回SQLはreadback照合のJSON演算子優先順位で全件ロールバックし、データ不変を確認後に括弧を修正。対象choice_explanationsだけ変更、正答/本文/code/選択肢/日時等不変、非対象1176問と全130教材の全行digest保持。1186問digest `df83aae7e41c90f929b180ffb18bfc13` / 130教材digest `e89f8d33fa35a4d104110807dddb3543`。private main `756f1451e114990cc59599cef4be7ed4b5c93b9b`。**理由SQLと従来既適用deltaは再実行しない。gate version3再deployなし。**

public PR #354で誤答選択1理由/正答4理由・textContent表示、18px、配列nowrap、次予測/一覧/リセット/新問題ロード時に説明消去を実装。head `1af444259ddd7f2ff11f8b2ab94a7bc1b226fbc9`、publication `37854036526` / v35 `37854036512` / Pages `37854126136` success。PR #355で配列キーボード領域属性を通常renderBVisualへ限定（bMockへの付与を撤去）し対象の回帰テストを追加。最終head `1a78c2adaa16cccffdccd0d1a4d4f6ebd1ad13a5`、publication `37854501893` / v35 `37854501959` / Pages `37854560807` success。実装配信main `9cfd114116f19071dcfb97ffaeb7004f3b00fd61`、cache189、script query `btrace-choice-189`を通常reloadで確認。GitHub blob hashとローカル検証ファイル一致。得点/採点/一般catalog/providerは維持。

許可済み別QAゲストで診断12/12→120XPから、10予測全ての4理由・5完了、意図的誤答1件で選択1理由/XP不変/再回答を確認。診断とは別に10unique ID/10予測位置/11採点操作/5完了。loopは188、残り4親は189で受入。最終reload後570XP（120+50+400）、A0/130、B5/35、トレース5/20保持。旧575/120XPセッションの復旧/統合/削除なし、旧セッション保持を今回証明したとは言わない。補助6問の全操作は反復していない。

表示はコード/予測/4択/理由18px。5配列セルが同じ行で番号1〜5、ページ横溢れなし。名前付きfocus可能領域を確認したが、このdesktop幅は内部overflowなしのため実際の横移動・実スマホ狭幅/タッチ/縦横切替は未受入。リセットの理由消去と新問題ロード時の旧STATE/予測/理由消去を通常UIで確認。画像保存済み。

**次は同じ文法章の未受入exam/do/div等をlive保護本文と前回記録で対象限定し確認する。他15親30予測の理由は空のまま。受入済み5親や補助6問を無目的に全反復せず、第2章へ自動的に飛ばさない。** 全B180・文法章全skill・実スマホ完了とは言わない。coverage in-progress、IPA43（37 in-progress / 6 verified-covered）、第22章関連度gap維持。

詳細：[選択肢理由・表示改善の受入](reference-audits/bbook-ch01-choice-reasons-20261009.md)。記録PR後の最新GitHub main/作業branch/open PR/CI/Pagesはliveで再確認する。以下は当時の履歴。

## 最新確定状態：文法章の既存5トレース受入・解説と図番号修正（2026-10-08）

既存loop_sum/count_even/nested_loop/gcd_euclid/recursionの5親10予測を通常UIで正答・全体解説・最終区間・完了まで確認。修正前誤答/再挑戦2操作＋修正後10操作、10unique ID/11問題位置/5完了。診断とは別カウント。補助6問の全操作や既適用SQLは反復していない。

PR #351で採点解説が次区間/最終区間のresetで消える不具合を表示だけ修正。head `67303ae88276bbb2cbbaa426d529033200c6269a`、publication `37748040737` / v35 `37748040797` / Pages `37748130635` success。main `610a815c046bb74cf4a18ffdb7a7c5698844a7b5`、cache186。実helper/grade-handler回帰と本番10予測で解説保持を確認。

PR #352で通常汎用配列/行列の番号ラベル2箇所をコードと同じ1始まりへ修正。内部focusと採点は不変、専用探索/ソートやbMockは対象外。初期候補の誤った描画関数への適用はpublication FAILでmergeを阻止し、対象関数を限定して修正。最終head `57a5aa012e3563078bb9909f5a186bd462210fd9`、publication `37749248086` / v35 `37749248073` success、pinned compare/blobも一致。配信main `3b4c4dfe47c6711948190f35a8d38445547ace8f`、Pages `37773254470` success、cache187。公開script query `btrace-index-187`、配列1〜5・行列1,1〜2,2と強調位置を通常UIで確認し、画像保存。

最初の許可済み別QAゲストは診断120＋修正前5＋修正後50＋5完了400＝575XP、トレース一覧5/20まで確認。継続時にブラウザーが初回設定となり、そのゲストのB5/35/履歴/再読込保持は未確認。プロフィールの消去/復旧/統合なし。公開後表示用の別セッションで診断12/12→60分・受験日未定、120XP・A0/130・B0/35を再読込後確認。配列/行列は未採点の図確認だけ。前の575XPを保持したとは言わない。

DB mutation/private変更なし。read-only最終1186問・130教材、全問digest `8385789f12edf994d6ae4eee0ea86b7f` / 教材 `e89f8d33fa35a4d104110807dddb3543` 一致。private main `030c4164dda109974fbba150213f1cec1cc5db74`。追加SQL/既適用delta/旧gateを再実行・再deployしない。

**次は同じ文法章の残件：既存10予測の選択肢別理由（live DBでは空）、通常トレース16pxの読みやすさ、一次元図の折返し、新演習読み込み中の前状態残存を保護source/gate/UI契約に照合して整える。未受入の既存文法exam/do/div等も対象を決める。既に済んだ5親・補助6問を無目的に全反復せず、第2章へ自動的に飛ばさない。** 残る基礎15親30予測・全B180・実スマホの受入完了とは言わない。coverage in-progress、IPA43（37 in-progress / 6 verified-covered）、第22章関連度gap維持。

詳細：[既存トレース受入記録](reference-audits/bbook-ch01-existing-trace-acceptance-20261008.md)。記録PR後の最新GitHub main/作業branch/open PR/CI/Pagesはliveで再確認する。以下は当時の履歴。

## 最新確定状態：文法章の保護された補助確認6問・デスクトップ受入（2026-10-08）

全B180行のlive保護本文を照合。doの後判定反復は既存 `b_exam_bexam_ctrl_03` にあり、全Bでdo欠如とは言わない。整数divも既存。while/do初回偽・同名局所/大域・論理or/not・文字列連結・実数商/整数商/余りの対比を、独自新ID6問で追補した。

private PR #130 head `4c77f9be3dca852ef2bbbba7fb4787404e85e42c`、補助CI `37735540263` / 保護CI `37735540351` success、private main `030c4164dda109974fbba150213f1cec1cc5db74`。one-shot guarded INSERTを1回適用済み。全6行readback一致、1186問/130教材、既存1180問・全130教材の全行digest保持。**追加SQLと第21章等の既適用deltaは再実行しない。** 全問digest `8385789f12edf994d6ae4eee0ea86b7f`、教材 `e89f8d33fa35a4d104110807dddb3543`。

public PR #349 最終head `996b21fe35dbf2df32ac6e92a4c69efc66a1a674`、publication `37735875205` / v35 `37735875238` success、実装配信main `9c26424d1edc836ecfeb356bd3063e8b68ab49b0`、Pages `37735921600` success、cache185。最初のCI失敗はcache184固定検査で、Pagesと検査を185へ揃えて解消。一般provider/catalog1180・B通常180・実戦50候補・基礎20+15・総合16+4・app本体は不変。専用catalogの補助6問だけを追加し、利用者へ「通信必須・XP/履歴/基礎進捗へ加算しない・再開不可」を明示する。回答前に正答/解説を返さず、内容を公開repoや永続cacheへ置かない。

本番通常UIで全6種類の採点・正答根拠・4選択肢理由を確認。意図的誤答1件→ヒント/無効化→再挑戦、他5問初回正解、初回スコア5/6（成功採点7・6問題位置・1結果）。全問本文/コード/選択肢/解説18px、見出し19px、viewport1363/document scrollWidth1348で横溢れなし。結果画面を目視・画像保存。途中終了とホーム移動で問題表示消去。通信失敗/遅延応答等は回帰test、本番回線障害誘発はしていない。

前回文法受入と同じ確認用ゲストの120XP・A0/130・B0/35・履歴なし・Aバンク979問を通常再読込後にも確認。プロフィール消去/復旧/別ゲスト作成はしない。以前の1247XPゲストを今回継続確認したとは主張しない。通常180問全採点や文法章全完了は未確定。

**次は同じ文法章の既存関連演習の通常UI採点/解説受入を前回記録と照合し、未確認分のみ進める。補助6問全操作や既適用SQLを反復しない。第2章へ自動的に飛ばさない。** 実スマホ狭幅/タッチ/横スクロール/縦横切替は未確認、coverage in-progress、IPA43（37 in-progress / 6 verified-covered）と第22章関連度計算direct-practice-gap維持。記録PR後の最新main/作業branch/open PR/CI/Pagesはliveで再確認する。

詳細：[直接演習追補の確定受入](reference-audits/bbook-ch01-direct-practice-20261008.md)。以下の候補/前回記録は当時の履歴で、この確定状態を優先する。

## 最新作業：文法章の全B gap判定と保護された補助確認6問（2026-10-08）

live public main `ca03a28954f82569fa275ba111e7bf5309567c27`、前branch `record-b-grammar-acceptance-20261008` head `823938ebd490ec91acc9b1804644e4f00f99c548`、private main `bf691b8ae0537766dc820d7e2ba824be783b5ae3`、双方open PR 0、CI/Pages successを再読。全B180行をlive保護本文まで照合した。doの後判定反復は既存 `b_exam_bexam_ctrl_03` があり、全B欠如の判定は撤回。整数divも既存。直接不足はwhile/doの初回偽比較、同名局所/大域、論理or/not、文字列連結、実数商/整数商/余りの対比。

同章内の新規ID6問を保護source/DBと専用metadata catalog・補助確認欄で追加する候補を作成。通常180問catalog/provider、実戦50候補、基礎20+15、総合16+4、app-v377.jsを変更しない。XP・履歴・基礎進捗へ加算しないことをUIへ明示し、プロフィールへ書かない。DBはprivate CI後にone-shot appendのみで1180→1186問、130教材/既存全行digestを保持する。private SQLは再実行不可、既存章の適用済みdeltaも再実行しない。

PR/CI・DB適用・Pages・全6問の本番受入はこの候補時点では未完了。後続の確定記録とGitHub liveを正とする。詳細：[全B直接演習の追補](reference-audits/bbook-ch01-direct-practice-20261008.md)。次は同章の配信/全6問/既存進捗保持を確定し、文法章全skill/スマホの完了を宣言せず、第2章へ飛ばさない。第22章関連度gap、スマホ残件、coverage in-progress、IPA43（37 in-progress / 6 verified-covered）維持。

## 最新状態：03科目B・文法章ガイド改善とデスクトップ受入（2026-10-08）

GitHub liveのpublic main `ca6e598854a322289b3bac84496b53302960d79f`、前作業branch `record-ch22-production-acceptance-20261008` head `c059a68a2b5c50ff0e71d74121319879a5e01daf`（mainとtree一致）、private main `bf691b8ae0537766dc820d7e2ba824be783b5ae3`、双方open PR 0、CI/Pages successを実読して再開した。03科目B参考書・第1部第1章「文法」は印刷026〜095、物理028〜097の全70ページ画像、確認13項目、章末6問と全解説まで再監査した。IPA現行用語/言語Ver.5.1別紙2も照合。04本文全章の今回監査はしていない。

PR #347で既存文法早見表1個・8節だけを独自例で改善。未宣言入力例を除去し、型・未定義・代入、mod/not/コメント/文字列、if最初の真、while/do0回対1回、for途中値と終了判定値、関数入力→return、同名局所/大域、紙トレースの省略と境界値を具体化。名前表2列、長表2個は名前付きfocus可能横スクロール、主要文字18px。app/保護provider/catalog/ID/選択肢/正答/既存履歴を変更しない。publication `37733206164` / v35 `37733206041` success後マージ、配信確認main `c85bede4de1689eff69c37aac64f9ac25f37094a`、Pages `37733300602` success、cache184。記録PR後のmain/branch/CI/Pagesはlive確認する。

本番通常再読込後に全8節・9表を確認、本文/コード/表/カード等216要素が18px。1363px viewport / document scrollWidth1348で横溢れなし。while/do比較、for途中表、局所/大域の別箱、紙トレースを画像で目視、確認画像を保存。本番由来console errorなし。現在ブラウザーは初回設定状態だったため、**別の確認用ゲスト**で診断12/12→計画確認を通常UIで完了。120XP・A0/130・B0/35を再読込後に確認。以前の第21章1247XP/直近4履歴を今回継続確認したとは主張しない。プロフィール消去/復旧/統合はしていない。

DB全行digest前後一致、130教材1180問。private main変更・DB mutationなし。**第21章等の適用済みDB差分を再実行しない。** 基礎20演習40行のコード・予測・正答/説明を静的再読したが、今回40問の本番採点はしていない。

**ガイド内容改善・静的readability・デスクトップ表示受入は完了。文法章全skill/直接演習/実スマホの完了を宣言しない。次は同じ文法章の直接演習不足（do、同名局所/大域、論理or/not、文字列連結、整数/実数除算）を全Bpoolのlive metadata/保護本文に照合し、重複しない保護問題/provider/catalogを設計・受入する。第2章へ自動的に飛ばさない。** これは基礎20/40内でのgap判定で、他pool全体の欠如は今回未確定。第22章の関連度計算direct-practice-gapも残す。実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認、coverage in-progress、IPA43（37 in-progress / 6 verified-covered）維持。

詳細：[文法章再監査と受入](reference-audits/bbook-ch01-grammar-reaudit-20261008.md)。以下は過去の履歴で、次作業はこの段落を優先する。

## 最新状態：第22章3ガイド改善・科目B cold boot修正（2026-10-08 JST）

GitHub liveの公開main `abf8055627cafe5a333c633b9777ade0a7ecf1a7`、旧作業branch `record-ch21-desktop-complete-20261008`、private main `bf691b8ae0537766dc820d7e2ba824be783b5ae3`、双方open PR 0・CI/Pages successを実読して再開。02参考PDF753〜779の全27ページ画像と全6章末問題・解説、IPA現行試験要綱5.6を照合した。第22章は130教材に含まれず、科目Bの既存3ガイドが対象。

公開PR #344で本番構成・擬似言語・長文セキュリティの3ガイドを改善。IRT評価点と練習正答率を区別し、20問解答/19問評価、擬似言語の初出説明、ログの意味、公式リンクを追加。本文18px・短い仕様ラベル16px。publication `37703582039` / v35 `37703582021`、Pages `37703672537` success。
本番で保存済み科目Bの初期復元がB配列の初期化より先に走るTDZ停止を確認。#345で初期復元1行だけをmicrotaskへ移し、実宣言を使うA/B冷起動回帰検査を追加。既存PWAの資産更新を保証する2 URLのversion query、cache183。publication `37704043557` / v35 `37704043549`、Pages `37704093654` success。配信確認main `36b0f4bad1bd1ac46ac49ce25dd42eedde044b53`。後続の記録PR・最新main/CI/Pagesはlive確認する。

本番通常再読込後に学習画面が起動し、科目Bへ通常UIで移って20/15の一覧・4モード（trace/security/実戦/総合実戦）設定表示を確認。今回採点は行っていない。3ガイド本文/カード/注記/summaryは各18px、仕様4ラベル16px、1363px viewport/document scrollWidth1348で横溢れなし。修正後のFE QUEST由来console errorなし。今日の学習推薦は既存ロジックで科目Aを表示するため、再読込後の科目Bタブ保持そのものを主張しない。
同じ第21章確認用ゲストの1247XP、教材6/130・第21章6/6、B0/35、バンク979問、直近4章末12/12履歴全文一致を確認。途中に既存の別画面データ保護通知が出たため、UIの「最新状態を読み込む」に従い継続。プロフィール消去・ゲスト再作成・過去採点変更なし。定着数は時点により3/6〜4/6の表示があったため完全固定保持を主張しない。

DBは全行digest前後一致、130教材1180問維持。科目B全180行の公開catalog metadata一致（trace40/security45/compound45/exam50）、基礎35は20演習＋15ケースで180問とは別指標。private main変更・DB mutationなし。**第21章の適用済みDB差分を再実行しない。**

**第22章3ガイドの内容改善とデスクトップ受入は完了。全6章末skillのうち「関連度計算」の直接演習は現行180問に見つからず direct-practice-gapとして残す。第22章全skill/科目B180問全品質の完了を宣言しない。次は03科目B参考書・第1部第1章「文法」の全章を現行ガイド/20演習と照合し、既存監査を現状から再確認する。** 今回03/04は導入・目次だけ読み、本文全章は未再監査。関連度計算は総合問題の章単位作業で保護pool/provider/catalog契約を含めて設計する。実スマホ狭幅・タッチ・縦横切替は未確認、coverage in-progress、IPA43（37 in-progress / 6 verified-covered）維持。

詳細：[第22章監査と起動修正](reference-audits/ch22-strategy-reaudit-20261008.md)。以下の第21章以前は当時の履歴であり、次作業はこの段落を優先する。

## 最新状態：第21章の内容・デスクトップ38/38確認完了（2026-10-08 JST）
GitHub liveで公開main `1bbbecbc992e146cbfffd1e23c6bc47315120181`、旧作業branch、非公開main `f877616b37a897e1c5b88de745047e4b6324fc88`、双方open PR 0・CI/Pages successを実読して再開した。全6教材・全38関連問題、02参考PDF733〜752の20ページ画像（章末11問・解説）、IPA9.2印刷102〜108を照合。
非公開PR #129の保護CI `37699904155` success、private main `bf691b8ae0537766dc820d7e2ba824be783b5ae3`。6教材・13問題を完全期待値guard transactionで1回適用、全19行readback一致・対象外124教材/1167問・imports metadata保持・130教材1180問。ID・選択肢・正答index・catalog・extra・版・active・日時・過去履歴は不変。**適用済みDB差分を再実行しない。**
公開PR #341はpublication `37699983316` / v35 `37699983328`、Pages `37700161829` success。#342で明示済み日本語意味への二重訳を表示判定だけ修正。publication `37701342179` / v35 `37701342086`、Pages `37701469076` success、配信確認main `11945b9c39ce488b031c59da4d6ddf9863ae4eaf`、cache181。本番再読込後のID用語で二重訳なしを確認。後続の記録PRと最新main/CI/Pagesはlive確認する。
全6教材のarticle各1個、本文・用語・表・カード等325要素18px、viewport1363/document scrollWidth1348で横溢れなし。派遣関係図・著作権帰属の条件表も目視。実選択関数100回で直接5/3/10/7/4/6、章末12unique・全6テーマ・比較保証。
通常UIで直接35問＋章末12問×4、**全38種類・83問位置/84採点操作・10結果**を確認。正解根拠・3誤答理由、意図的誤答のhint→無効化→再挑戦、21-01初回4/5・80%・再挑戦1、それ以外直接全初回正解。章末4回とも12/12・100%・全6テーマ・unique、比較02/03/04をすべて確認。
新規確認用ゲストで1247XP、教材6/130・第21章6/6・定着4/6。以前のゲスト進捗とは別データ。通常再読込後も直近4章末履歴全文一致・XP/進捗保持、科目Aバンク979問、記憶健康状態38（安定38/そろそろ0/要復習0）。全10履歴の保持を主張しない。意図的誤答の復習ルート1件は別指標として残る。履歴画像証拠保存済み、protected画像は公開GitHubへ置かない。
**第21章の内容・デスクトップ受入は完了。次は参考資料第22章と、現行科目B35演習の実装・監査残件をGitHub liveから確認して、章単位の次作業を定める。** 第22章・03/04資料の内容監査は今回未実施。第5〜21章の実スマホは未確認、coverage in-progress、IPA対応43（37 in-progress / 6 verified-covered）を維持する。
詳細：[第21章確定監査](reference-audits/ch21-full-reaudit-20261008.md)、`reference-audits/ch21-import-manifest-20261008.json`。下の第20章以前の段落は履歴であり、次章指示はこの段落を優先する。

## 最新状態：第20章の内容・デスクトップ45/45確認完了（2026-10-07 UTC）

GitHubのlive状態を再読して再開。public main `0e37897d2be0613c7cf47fd9472d394f43ca536a`（記録PR #339）、Pages `37608813823` success、実装branch `audit-ch20-whole-chapter-20261007` head `765ab13e33b9a1150a9f5649badd311681c1f3ff`、private main `f877616b37a897e1c5b88de745047e4b6324fc88`、双方open PR 0を確認。今回の完了記録PR後のmain/CI/Pagesはlive再確認する。

全7教材・45関連問題、02参考PDF685〜732の48ページ（印刷668〜714、全21過去問・解説）、IPA9.2印刷96〜101の内容監査と反映は前回確定済み。非公開PR #128、公開PR #338の実装を維持。7教材・24問題のDB差分は前回1回適用済み、52行readback一致・130教材1180問。今回も現行DBから45問を読み取り、**適用済みDB差分を再実行していない。**

前回ゲストの20-01〜04・20種類（21採点操作、意図的誤答1件→再挑戦成功）を引き継ぎ、別の新規確認用ゲストで残る20-05の9問・20-06の5問・20-07の8問を通常UIで全初回正解。章末12問を3回、各回12unique・全7テーマ・12/12正解で完走し、比較3種類をすべて採点・解説確認。累計は**全45種類、延べ78問・79採点操作**。今回分は58問・58操作・39種類。各問の正解根拠と3誤答理由、次問・結果画面を確認した。

20-06/07教材はarticle各1個、p/li/td/thの41/49要素が18px、1363px viewport・document scrollWidth1348pxでページ横溢れなし。前回20-01〜05の411要素とselectorが異なるため合算しない。線形計画法（20-03）と損益分岐点（20-04）のSVGを画像で目視し、軸・凡例・数値を確認。前回の接続timeoutは履歴として残し、今回は画面操作を完了できた。初期診断の採点待ちは最終的に12/12で完了し、アプリの不具合とは断定しない。

今回ゲストは初期診断120XP＋教材完了150XP＋直接22問220XP＋章末36問360XPで**850XP、教材3/130（第20章3/7・定着1/7）**。前回ゲストの517XP・教材4/130とは別データであり、進捗の消去・復旧・統合を主張しない。通常再読込前後の直近4履歴（章末12/12×3、20-07 8/8）の文字列が一致、850XP・教材3/130保持、再読込後の「進捗・設定の詳細」で記憶健康状態39件（安定39・そろそろ0・要復習0）を確認。周辺UIを含む履歴画像証拠を保存済み。教材・問題・解説の画面画像は公開GitHubへ置かない。

**次の内容監査は第21章「法務」全6教材・全関連問題・章末演習。** 第20章の内容・デスクトップ受入は完了。第5〜20章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認、coverage in-progress、IPA対応43項目（37 in-progress / 6 verified-covered）を維持する。

詳細：[第20章監査](reference-audits/ch20-full-reaudit-20261007.md)、`reference-audits/ch20-import-manifest-20261007.json`。以下の第19章以前の段落は当時の履歴であり、次章指示はこの段落を優先する。

## 直前の確定状態：第19章の内容・デスクトップ27/27確認完了（2026-10-07 UTC）

全4教材・全27関連問題と02参考PDF657〜684の28ページ（印刷640〜666、全21過去問・解説）、IPA9.2印刷91〜95を照合。非公開PR #127で4教材・13問題のhint/説明/比較設問を修正、private main `1dd812580ede476dadf573b7b38e6fa769921260`、保護CI `37575863355` success。immutable差分を照合してguarded transactionを1回だけ適用。全31行readback一致、対象外全行・metadata・130教材1180問維持。問題ID・選択肢・正答index・catalog・extra・版・active・日時は不変、過去回答の再採点なし。**適用済みDB差分を再実行しない。**

公開PR #334はpublication `37575870257` / v35 `37575870236` success後merge、Pages `37576001333` success。#335でLGWAN正式名の日本語訳を最長一致へ追補、CI `37577162349` / `37577162356`、Pages `37577231308` success。本番保存確認で追加metadata登録後に記憶件数の再描画が不足し17と表示される問題を発見。#336で記憶健康状態・復習予報の2領域だけをrefresh。quiz/profile不変の回帰検査、CI `37577653562` / `37577653512` success。配信確認main `bc698d93dc9d6a3dd37113172853267c83d2a4a8`、Pages `37577714481` success、cache178。修正後の通常再読込でも記憶対象27を確認。後続の記録PRと最新main/CI/Pagesはlive再確認する。

全4教材320要素の本文・用語・カード・表18px、article各1個、1348pxデスクトップ横溢れなし。実選択関数100回で直接6/4/5/9、章末12unique・全4テーマ・比較保証。通常UIの直接24問＋章末12問で全27種類の採点・正解根拠・3誤答説明を確認（延べ36問位置/38採点送信・5結果）。意図的誤答1件のhint→誤答無効化→再挑戦を確認。確認用helperの類似文誤対応で追加の初回誤答1件があり、helper修正後に再挑戦成功（アプリ不具合ではない）。19-01初回4/6・67%・再挑戦2・+54XP。他の直接4/4・5/5・9/9、章末12/12・100%、章末には比較3問すべて含む。

新規確認用ゲスト。前回ゲストの進捗を消去/復旧/保持したとは主張しない。通常再読込で直近4履歴全文・674XP・教材4/130・第19章4/4・定着0/4・各テーマバンク回答6/6・4/4・5/5・9/9・科目Aバンク979問を保持。追補後も履歴/XPと記憶27の保持確認。5結果を観測したが一覧は4件なので、全5履歴の再読込保持は主張しない。保存競合なし、UI履歴日は2026-10-06。詳細：[第19章確定監査](reference-audits/ch19-full-reaudit-20261007.md)、`reference-audits/ch19-import-manifest-20261007.json`。

**次は第20章「企業活動」全7教材・全関連問題・章末演習。第20章は今回未監査。** 第5〜19章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応表43項目（37 in-progress / 6 verified-covered）を維持。全27種類の再操作や適用済みDB更新の反復を避ける。

## 直前の確定状態：第18章の内容・デスクトップ46/46確認完了（2026-10-07 UTC）

全8教材・全46関連問題と02参考PDF623〜656の34ページ（印刷606〜638、全23過去問・解説）、IPA9.2印刷86〜90を照合した。18-01〜06は参考書、18-07/08はIPA技術戦略の補足。非公開PR #126で8教材・18問題の説明/ヒント/比較設問を修正し、private main `11c79c0709e8dbd60f69190e7c684fe82204354a`、保護CI `37570067976` success。immutable差分を照合したguarded transactionを1回だけ適用し、対象外全行・metadata・130教材1180問を維持、全54行readback一致。問題ID・選択肢・正答index・catalog・extra・版・active・日時は不変。比較5問は教材テーマ名と戦略体系全体/個別判断を区別する設問へ変更。履歴再採点なし。既適用差分は再実行しない。

公開PR #332はpublication `37570133004` / v35 `37570133031` success後merge、配信確認main `1ed127c7c8b3e9ea8fd96cffb87f55670689b099`、Pages `37570234550` success、cache175。8教材380要素の本文・用語・表18px、article各1個、1348pxデスクトップ横溢れなし。実選択関数100回で直接3/3/5/3/10/3/8/5、章末12unique・全8テーマ・比較保証を検証。18-05は11候補から10問上限。

通常UIで全8テーマの直接演習40問、マーケティング再演習10問、章末12問×7回を完走し、全46種類の採点・正解根拠・3誤答説明を確認（延べ134問/135採点、16結果）。意図的誤答1件のhint→誤答選択肢無効化→再挑戦、初回2/3・67%・再挑戦1・+27XPを確認。章末7回はいずれも12/12・100%。新規確認用ゲストで、前回ゲストの進捗を消去/復旧/保持したとは主張しない。通常再読込で直近4履歴全文・1872 XP・教材8/130・第18章8/8・定着7/8・マーケティングバンク11/11・バンク979問を保持。16結果は観測済みだが一覧は4件のため、全16履歴の再読込保持を主張しない。保存競合なし。UI履歴日は2026-10-06。詳細: [第18章確定監査](reference-audits/ch18-full-reaudit-20261007.md)、`reference-audits/ch18-import-manifest-20261007.json`。後続の記録PR・最新main/CI/Pagesはlive再確認する。

**次は第19章「ビジネスインダストリ」全4教材・全関連問題・章末演習。第19章は今回未監査。** 第5〜18章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応表43項目（37 in-progress / 6 verified-covered）を維持する。全46種類の再操作や適用済みDB更新の反復を避ける。

## 直前の確定状態：第17章の内容・デスクトップ12/12確認完了（2026-10-06 JST）

全2教材・全12関連問題と参考PDF605〜622の18ページ、IPA9.2印刷83〜85を照合した。非公開PR #124で2教材・6問題のhint/理由、#125で17-01本文2文の英語正式名を追補。private main `890bb3976f1ad0adcb9d907accf6cae1f35932f9`、保護CI `37382487145` / `37383431027` success。完全期待値transactionを各1回適用し、対象外行・metadata・130教材1180問を維持、最終全14行readback一致。既適用差分は再実行しない。

公開PR #330はpublication `37382762957` / v35 `37382763225` success後merge、配信確認main `efffaab7695acd7710e4517a0a4a2980a017163c`、Pages `37382870641` success、cache174。2教材132要素の本文・用語・表18px、article各1個、デスクトップ横溢れなし。実選択関数100回で直接3/5、章末12unique・両テーマ・比較1・追加3を検証。

通常UIで直接3問/5問と章末12問を完走し、全12種類の採点・正解根拠・各3誤答理由を確認（延べ20問/21採点）。意図的誤答1件のhint→誤答選択肢無効化→再挑戦と初回2/3・67%を確認。17-02は5/5、章末12/12・100%。今回ブラウザは初回設定画面だったため新規確認用ゲストとして検証し、前回ゲストの進捗を消去/復旧/保持したとは主張しない。通常再読込前後で3履歴全文・417 XP・教材2/130・第17章2/2・定着1/2・バンク979問を保持。保存競合なし。追補の英語正式名も本番表示確認。詳細: [第17章確定監査](reference-audits/ch17-full-reaudit-20261006.md)、`reference-audits/ch17-import-manifest-20261006.json`。後続の記録PR・最新main/CI/Pagesはlive再確認する。

**次は第18章「経営戦略マネジメント」全8教材・全関連問題・章末演習。第18章は今回未監査。** 第5〜17章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応表43項目（37 in-progress / 6 verified-covered）を維持。章単位で進め、全12種類の再操作や適用済みDB更新の反復を避ける。

## 直前の確定状態：第16章の内容・デスクトップ28/28確認完了（2026-10-05）

全4教材・全28関連問題と参考PDF579〜604の26ページを照合した。非公開PR #122で4教材・5問題、追補#123で2問hintを反映済み。公開PR #326で本文・比較表18pxと回帰検査・cache173、#327で独立した追補記録をmerge済み。最新source main `423f94465f047592b4b660e52b8f7baabc903ab1` と全32行のDB期待値一致を確認し、既適用更新は再実行しない。

通常UIで直接7/3/10/3問と章末12問×3回を完走し、全28種類の正解判定・選択肢別理由を確認した。意図的誤答1件のhint→誤答選択肢無効化→再挑戦・初回集計も確認。途中の保存競合は別画面による更新の追補記録と整合する。最新状態から再開した最後の章末12問は通知なしで完了し、通常再読込後も12/12・100%、727 XP、教材4/130・第16章4/4・定着1/4、バンク979問を保持。延べ59問/60採点の全保存を主張しない。

反映確認時の公開main `aae364e43811f66fceaff41c429d07271c20a11c`、Pages `37286475029` success。非公開#122 CI `37284437942` / #123 CI `37285337927` success。今回の確定記録PRと最新main/CI/Pagesはlive再確認する。詳細は [第16章全体の確定監査](reference-audits/ch16-full-reaudit-20261005.md)、`reference-audits/ch16-import-manifest-20261005.json`、[ヒント追補と独立表示確認](reference-audits/ch16-solution-hints-followup-20261005.md)。追補の未完了記述は追補単独の実績であり、全体の現在状態はこの確定記録を優先する。

**次の内容監査対象は第17章「システム企画」全2教材・全関連問題・章末演習。第17章は今回未監査。** 第5〜16章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応表43項目（37 in-progress / 6 verified-covered）を維持する。次回もGitHub現状を正とし、全28問の再操作や適用済みDB更新の反復を避ける。

## 直前の確定状態：第15章の内容・デスクトップ52/52確認完了（2026-10-05）

第15章の残る `ipa92_a_service_request_001` を通常UIの15-08演習で確認した。正解判定と正解根拠・3誤答説明を読み、10問演習を10/10・100%で完走した。前回の51種類と合わせ全52種類のデスクトップ確認が揃った。新規確認用ゲストの履歴・XP・教材進捗を通常再読込で照合した。前回の別ゲストの進捗とは区別する。この段落は第15章時点の履歴であり、最新の次章は冒頭を参照する。

- 公開PR #323でAIOps正式名内の略語展開を修正、#324で第15章のRFCを変更要求として表示。#323のpublication `37259935425` / v35 `37259935394`、#324のpublication `37260539910` / v35 `37260539881`はsuccess。表示修正の公開main `f5aed480f4bb411df3f1572fa18dc47e4d306c3a`、Pages `37260593402` success、cache172。後続の記録PRと最新main/CI/配信はlive確認する。
- 非公開main `0a0828a830e2aa50e629cc1672103cc601373578`、保護CI `37240191137` success。保護DBの適用済み8教材・11問題差分は今回は再実行していない。本文・正答・ID・過去履歴は変更しない。
- 今回3回の10問演習を合わせ、前回からの累計は延べ141問/142採点送信・52 unique ID。AIOps正式名は#323配信後、RFCの変更要求表示は#324配信後の通常演習で確認済み。通常再読込で直近3履歴の各10/10・100%、500 XP、教材1/130・第15章1/8・定着0/8、15-08の12/13、バンク979問を確認した。これらは今回の新規ゲストであり、前回の8/8ゲストを消した意味ではない。
- 詳細: [第15章の監査](reference-audits/ch15-full-reaudit-20261005.md)、`reference-audits/ch15-import-manifest-20261005.json`。ブラウザ接続障害から復旧し、残るサービス要求の画面証拠を取得し、修正済みRFCの確認画像も保存済み。
- 第5〜15章の実スマホ狭幅・タッチ・横スクロール・縦横切替は引き続き未確認。内容・デスクトップ完了と実機受入を区別し、章coverageとIPA対応表の完了数は変更しない。現在の環境で実機確認できなければ、この残件を保持して第16章全体の内容監査へ進む。全52問の再操作や適用済みDB更新を反復しない。

## 次チャットでユーザーが送る文

> FE QUEST開発の続きです。最新版をGitHubから実際に読み取り、main・現在の作業ブランチ・PR・CIの状態を確認して、前回の続きから進めてください。過去の記憶だけで判断せず、GitHubの現状を正としてください。

この一文を受けたら、以下の順で復旧してください。

## 1. 最初に確認するもの

### 作業単位（ユーザー指示 2026-10-01）

以後は**章単位**で進める。章内の全節・教材・問題バンク・章末演習をまとめて照合し、修正・検証・残件を章の記録へ集約する。節1件だけを完了して次章へ飛ばさない。第10章は内容・デスクトップ受入を完了し、次の内容監査対象は第11章「情報セキュリティ」全体。第5〜10章のスマホ残件は未完了のまま引き継ぐ。スマホ実画面・タッチ等が未検証なら章のcoverageはin-progressとし、内容・デスクトップの完了と区別する。現行状態は直近のPR/CI/DB/監査を読むこと。

### 第10章の章単位受入・利用制限からの再開（2026-10-04）

再開時live公開main `67e6c7d10ec6cea2b108c8b9480ddbc71409ed50`、非公開main `628260ffa5f498f41c78879563954c5b3d7706fb`、双方open PR 0、作業branch `audit-ch10-chapter-clarity-20261003` head `0c642d5ead45b8ae267a341a85c6dbd2506977cb`を再読。公開PR #299、非公開PR #108はマージ済み。公開publication `37111481069` / v35 `37111481072`、保護教材CI `37111312443`、公開mainのPages `37111587058`はすべてsuccess、cache159。

第10章10教材・62種類（直接56＋比較6）と02参考PDF355〜404の全50ページ画像、01のネットワーク補助箇所を全章単位で照合。単位と付加情報の計算、LANの予備経路、IPv6表記、サブネット範囲、NAPTの2通信、DNS階層、7層とカプセル化、メールとCookie、パリティ・同期、SNMP/SDNを独立例で補強。小テスト解説7件と問題8件の不一致・曖昧な誤答を修正。原子的expected/replace適用は前回完了済みで、今回は再実行せず、非公開immutable mainとlive DBの10教材・8問題を全フィールド再照合して一致。130教材/1180問・ID/正答index/catalog/version/activeを保持し、履歴再採点なし。

全10教材→直接演習55問、誤答からの教材/類題1問、章末12問×3回、第9節の別10問を通常UIで完走。102問＋初問の再挑戦1回（103採点操作）で全62種類の正解判定・選択肢別解説を確認。回線は意図的誤答により初回7/8・88%と再挑戦1件を確認し、類題1/1で復習を解消。他は全初回正解、章末は3回とも12/12・全10テーマ・重複なし・比較を含む。本文/表/コード520要素の最小18px、サブネット短いラベル16px、元の26/6ビット境界と図の余白を本番で実測・目視。通常再読込後も教材10/10・全体10/130、定着4/10、1,667 XP・979問、最新4履歴（第9節10/10・章末12/12×3）の全文一致を確認。詳細は [第10章の確定監査](reference-audits/CH10_CHAPTER_ACCEPTANCE_2026-10-03.md)。

第5〜10章のスマホ幅・タッチ・横溢れは未確認、coverageはin-progress。IPA対応表43項目（37 in-progress / 6 verified-covered）は変更しない。第10章を完全完了とは呼ばない。次回はlive main/branch/PR/CI/Pagesを再読し、適用済みCASや全62種類の再演習を反復しない。スマホ残件を保持し、対応可能なら実画面を確認する。現在の環境で確認不能なら、次の内容監査は第11章「情報セキュリティ」全体。今回第11章は未着手。後続の記録PRと最新main/配信はliveで確認する。

### 第9章の章単位受入（2026-10-03）

再開時live公開main `770d49ff3d132f23968f381ae9dcb60ef6331393`、非公開main `f4d5bc7a5f4ca7985b3820e744d586260a9616bb`、双方open PR 0、CI/Pages successを確認。第9章8教材・44種類（直接41＋比較3）と02参考PDF295〜354の全60ページ画像を照合。三層スキーマ、参照先の表・選択/射影、関数従属・第1〜3正規形、索引、回復、ロック、SQLの実結果、OLTP/OLAP等を独立例で補強。小テスト5件の説明不一致、問題6件の理由・ヒント・曖昧な誤答1選択肢を修正した。問題ID・正答index・教材/問題versionとactive・履歴schemaを保持し、過去回答を再採点しない。

非公開PR #107は最終head `559ce12c59a5fd5c832ea92a8a90f3af0b48a31f`、CI `37102858888` success、main `366f366cd5ea066a1a3f390bfb094eac1f190bff`。公開PR #294〜#297はpublication/v35の両CI成功後にマージし、各mergeのPages成功を確認。表示最終修正の公開mainは `b5e7cbf4b8173b894e179449e10e1078f032cae0`、Pages `37104457919` success、cache158。完全期待値CASで8教材・6問題を1回適用し、全payload/指定問題フィールド、130教材/1180問、他章教材・対象外問題digestの保持を確認した。

通常UIで直接5/5・3/3・7/7・3/3・5/5・5/5・4/4・9/9と章末12/12×2回を完走。計65回答、全初回正解で、比較3を含む全44種類の採点・選択肢別解説を確認。章末は各回全8テーマ・重複なし・比較を出題。教材のSQLを実行して集計・副問合せ・ビュー・DML・NULLを検査した。本文/表/コード18px、短い図ラベル・small・JOIN表caption16pxを最終配信後に実測。通常再読込後も新規確認用ゲストの第9章8/8・全体8/130、1,170 XP・979問と直近4履歴（章末12/12×2、09-08 9/9、09-07 4/4）を保持。定着2/8と教材完了8/8は区別する。詳細は [第9章の確定監査](reference-audits/CH09_CHAPTER_ACCEPTANCE_2026-10-03.md) を読む。

第5〜9章スマホ幅・タッチ・横溢れは未検証、coverageはin-progress。IPA対応表43項目（37 in-progress / 6 verified-covered）は変更しない。次回はlive main/作業branch/PR/CI/Pagesを再確認し、適用済みCASや全44種類の再操作を反復せず、第10章全体の内容監査へ進む。後続の記録PRと最新main/配信はliveで確認する。

### 第8章の章単位再開（2026-10-03）

再開時live公開main `b349b063f5831b7759c00fa21ab7195cd26ef2ba`、非公開main `0072a48ff9c3e83341d4828c89d3e4715c43dc8b`、双方open PR 0、CI/Pages success。第8章4教材・21種類と参考PDF275〜294の全ページ画像を照合。小テスト3件の設問/解説不一致、CUI/CLI・WCAG・量子化/chの初出説明、コンボの表示、PCMの段階と時間逆算、クリッピング/アンチエイリアシングの前後図を修正する。本文/比較表18px・短い図ラベル16px以上。直接演習3/7/5/4問、章末12問。比較の二条件分類メタデータを優先して「比較を含む」案内と実選択を一致させる回帰検査を追加。cache154。教材ID/version/active・問題・正答・履歴schemaを保持。詳細と後続CI/CAS/本番実操作は `reference-audits/CH08_CHAPTER_ACCEPTANCE_2026-10-03.md` を読む。第5〜8章スマホは未検証、coverageはin-progress。

第8章の内容・デスクトップ受入は本番で確認済み。非公開PR #106は保護教材CI `37086485832` success、main `f4d5bc7a5f4ca7985b3820e744d586260a9616bb`。公開PR #292はpublication `37086575026` / v35 `37086575048` success、merge/main `82273d5a8d133faf48b00e1cc885d550a5d43df6`、同headのPages `37086628075` success、cache154。保護DBの4教材を完全期待値CASで適用後に全payload照合し、130教材/1180問・全問題/他章教材digestを保持。通常UIで直接3/3・7/7・5/5・4/4と章末12/12を完走（31回答、全初回正解）。比較2種類を含む全21種類の採点・選択肢別解説を確認。章末は全4テーマ・重複なしで比較2種類を実出題した。本文/表/計算コード18px、実際の切り取りと中間色10画素、コンボ入力/選択一覧を本番で実測・目視確認。通常再読込後も第8章教材4/4・全体6/130、1550 XP・979問と直近4履歴を保持。第5〜8章スマホは未検証、coverageはin-progress、IPA対応表43項目（37 in-progress / 6 verified-covered）は変更しない。詳細は第8章監査の確定記録を読む。次回はlive main/作業branch/PR/CI/Pagesを再確認し、適用済みCASや21種類の全問操作を反復せず第9章全体の内容監査へ進む。記録更新PRの最新main/CI/Pagesはliveで確認する。

### 第7章の章単位再開（2026-10-03）

公開main `246754564a02a7245eb59874f21d1e757b7f2fa2`、非公開main `9d56fa6771805390e17d70677e0ffdbd85be0ca8`、双方open PR 0、CI/Pages successをlive確認。第6章の比較5種類受入はPR #288でマージ・配信済み（Pages `37082431357` success）。第5・6章のスマホ実機・タッチは引き続き未確認で、今回も幅/touch操作がなく通常の拡大キーは幅を変えなかった。確認不能なゲートで同じ作業を反復せず、未完了の記録を保持して第7章の内容監査へ進む。前章のcoverageを完了へ変更した意味ではない。

第7章2教材・16問と参考PDF265〜274の本文画像・章末問題/解説を照合。8ビット小テストの説明不一致、リフレッシュの初出説明、NAND/NORの操作単位、7セグメントの接続先からビット列を求める手順を補強する。本文・比較表18px、図中ラベル16px以上へ。直接演習は3/7問、章末12問。非公開の2教材deltaと公開CSS/検査/CI/cache152を用意。問題本文・正答・IDs・version/active・履歴schemaを保持する。詳細とCI/本番結果は `reference-audits/CH07_CHAPTER_ACCEPTANCE_2026-10-03.md` を読む。スマホは未検証、coverageはin-progress。

第7章の内容・デスクトップ受入は本番で確認済み。非公開PR #105（CI `37083849349` success、main `0072a48ff9c3e83341d4828c89d3e4715c43dc8b`）、公開PR #289/#290をCI成功後にマージ。表示の追加修正後の公開mainは `8a8a61d30477e9c0deff7d06646e49b2f08ebd69`、Pages `37084516238` success、cache153。保護DBの2教材を完全期待値CASで適用し、130教材/1180問、問題全件・他章教材のdigestを保持。通常UIで直接演習3/3・7/7、章末12/12を2回完走（計34回答）し、比較2＋章末専用4を含む全16種類の採点・選択肢別解説を確認。再読込後も直近4履歴・979問・1040 XPを保持。本文/追加表18px・図中ラベル16pxと表の余白、gラベル位置を配信後に実測・目視確認。スマホ残件は第5〜7章で未完了、coverageはin-progress、IPA対応表43項目の完了数は変更しない。記録更新のみの後続PRと最新main/CI/Pagesはliveで再確認する。内容・デスクトップ確認済みの章の全問再操作やCASを繰り返さず、スマホ残件を保持して次の章全体の内容監査へ進める。この第7章記録の時点では第8章は未監査だった。現在は上記の第8章確定記録を参照する。

### 第6章の章単位再開（2026-10-02）

GitHub live main/open PR/CI/Pagesと保護DBを再読し、6教材・32問を章全体で照合。OSの初出用語とページ置換例、ファイル階層図の親子関係、デバッガの具体例、OSS/商用の分類を修正。教材・比較表の可読性と第6章12問/全6節・直接演習27問の回帰検査を追加する。第5章のスマホゲート通過を意味しない。詳細と後続のCI/本番適用結果は `reference-audits/CH06_CHAPTER_ACCEPTANCE_2026-10-02.md` を読む。

公開PR #283/#284、非公開PR #104をCI成功後にマージ・本番反映済み。動作修正後の公開mainは `f0df1f94796d295ade373ba6e564a8412966341b`、Pages `37007168608` success、cache150。保護DBの5教材は完全期待値CASで適用し、全体130教材/1180問・問題全件のdigest・他章教材を保持。新規確認用ゲストで全6教材、直接演習27問、全6節を含む章末12問を操作。章末12/12、ミドルウェア初回3/4＋再挑戦1問正解、再読込後の直近4履歴を確認。FIFO/LRUの新規表4セルと補足3段落を本番18pxで再実測した。全32問の内容照合と、実画面29種類（39回答）は区別する。残り比較3種類の実操作、第5・6章のスマホ/タッチは未確認なのでcoverageはin-progress。冷間読込直後の全体バンク表示710問など、メタデータ準備前の表示も残課題として記録。全27問の再操作や解決済み修正を繰り返さず、同章の残件から再開する。最新SHA/PR/配信は毎回live確認する。

第6章の問題数表示の残件は2026-10-03に修正。公開PR #286はCI2件成功、merge `3d6efa64f38cd8b1295adcaff2526adc759df575`、Pages `37080659127` success、cache151。演習履歴/模試設計の固定710問を現行登録済みID数へ更新し、遅延メタデータ登録後に既存教材行の演習件数・回答分母も更新する。新規ゲストの本番通常再読込で979問と第6章10/3/3/3/4/4を確認。進行中演習・保存履歴の不変は実登録処理の回帰検査でPASS。詳細は第6章監査の2026-10-03欄。残り比較3種類の実操作と第5・6章スマホ/タッチは未確認、coverageはin-progress。現在のローカルが古い場合は保持してlive mainから新しいbranchを作る。次回もmain/open PR/CI/Pagesを実際に再確認し、修正済みの総数表示や27問完走を反復せず同章の残件から進める。

第6章の比較問題の実操作残件は2026-10-03に解消。再開時live公開main `6c3e207534abb456639b159aa466c712fedfa5a9`、Pages `37081077733` success、双方open PR 0を確認してから、通常の章末12問を4回完走（48回答、すべて12/12）。`challenge_cmp_06_01`〜`05` の全5種類で正解判定と選択肢別解説を確認し、10月2日の直接演習27種類と合わせ全32種類の実操作ゲートを通過。今回48問だけで全32種類を出題したわけではない。通常再読込後も章末100%・12/12の直近4履歴と979問表示を保持。アプリ/保護DBは今回更新せず、監査・引き継ぎだけを記録する。第5・6章スマホ実画面・タッチ・横溢れは未検証なのでcoverageはin-progress、IPA対応表43項目の完了数を変更しない。詳細は第6章監査の「比較問題5種類の本番受入」。次回もmain/作業branch/open PR/CI/Pagesをlive再読し、32種類の演習を反復せず同章のスマホ残件から再開する。

### 第5章の最新到達点（2026-10-01）

公開PR #280で非同期読込中の旧表示を消し、CI2件とPages `36847162854` success。新規確認用ゲストで4テーマ24問と章末12問を再完走し、比較2件を含む全26種類の実画面・採点・選択肢別解説、再読込後の直近4履歴を確認。PR #281で補足本文・RAID説明を18pxへ統一、CI2件とPages `36849303942` success、main `9283e8e3472065b2715fa55d61bc623000b2a5b3`、cache148。配信後の本番05-03補足2段落は18pxを実測。スマホ幅・タッチは未確認で、viewport公開機能がなくdata URL検証もセキュリティ方針が拒否したため中止した。CSS検査やデスクトップをスマホ受入に代用せず、coverageはin-progress。詳細は `reference-audits/CH05_CHAPTER_ACCEPTANCE_2026-10-01.md` の末尾。次回もGitHub liveを読み、同章のスマホ残件を引き継ぐ。全問操作や解決済み読込修正をやり直す必要はない。

1. `main` の最新 SHA
2. open PR 一覧
3. open PR があれば head branch と最新 SHA
4. GitHub Actions の直近 CI / Pages deploy の状態
5. `.github/REFERENCE_MATERIAL_AUDIT_POLICY.md`
6. `.github/reference-audits/` の最新章監査
7. 必要な場合は保護教材の lesson bank の現行 payload / content_version

過去会話の記憶より、上記 live 情報を優先すること。

## 最新確認・作業（2026-09-26）

- 2026-09-28 第3章03-02「基本の3構造」スマホ表示: ユーザー画像で選択の枝とYes/No・A/Bの対応が読みにくいことを確認。公開版の保護教材HTMLは `.control3-v383` の3カードと `<code>` 内の改行による文字図であることを実画面で確認。表示時に順次・選択・反復を明確な構造へ組み替え、選択はYes/Noの2列、反復は条件へ戻る行を独立させる。狭い幅の余白を縮め、回帰検査を追加。PWA cache目標 `fe-quest-v377-141`。教材・問題の保存データは変更しない。PR/CI/Pagesとスマホ実機での最終確認を行うこと。
- 2026-09-28 指数表記: 公開main `6b272dc978b3b9c0cc32ac964493a61daccc6c20`、open PR 0、Pages run `36338507732` 成功を確認。教材・問題・解説に残る `10^9` や `2^(n−1)` を表示時に上付きへ変換する処理を追加。保護教材の遅延読み込みも対象にし、コード・編集欄は除外。回帰検査をpublication CIへ追加し、PWA cacheを `fe-quest-v377-140` に更新。問題本文や学習データ自体は変更しない。PR/CI/Pagesと公開画面での最終確認はこの変更の後に行うこと。
- 2026-09-27 03-05出題品質: live main `f839d9271ed970817fc2bdbaac808cdccee23032`、open PR 0、Pages run `36314004262` 成功。非公開ソースmain `7c856ba53aabd4ba1c3c9f4c1ff60d026518f7f3`、open PR 0。新規ゲストの03-05は案内6問に対し実際7問で、章末用 `challenge_cmp_` が混入。JSON用途の近接2問（`coreq_03_05_2` / `_3`）も連続した。テーマ演習から章末比較を除外し、両問の並びを離す修正と回帰検査を追加。cacheを `fe-quest-v377-139` に更新。保護問題本文の差別化、他テーマの残設問、スマホ実画面は継続。監査は `reference-audits/CH03_PRODUCTION_UI_PRACTICE_GATE_2026-09-26.md`。coverageは in-progress。
- 2026-09-27 章末チェック公開検証: PR #253 はmain `5c4bcfbd9563f322a48090f085f58f6954a82964` へマージ、publication/v35 CIとPages run `36291638849` 成功。新規ゲストで初回診断後、公開版の第3章章末チェック12問を完走し、03-01〜03-05をすべて出題で確認。初回4/12（33%）、再挑戦4問正解。履歴は再読み込み後も「第3章・章末チェック・33%」「4/12問正解」を保持。読み込み中の旧10問カウンタ残りを修正し、cacheを `fe-quest-v377-138` に更新。スマホ実画面、テーマ別バンク残りの品質確認は継続。監査は `reference-audits/CH03_PRODUCTION_UI_PRACTICE_GATE_2026-09-26.md`。coverageは in-progress。
- 2026-09-27 章末チェック: live main `0f03f69a9b4c165038a548fe198008064a9f660d`、open PR 0、Pages run `36289794013` 成功を確認。第3章の章末演習は入口12問の案内に対し実際10問で、03-04の設問が含まれない回があった。現行10問を完走（10/10）。各テーマから最低1問と比較・状況判断を優先し、合計12問とする選択処理に修正。回帰検査を追加し、PWA cacheを `fe-quest-v377-137` に更新。公開版の修正後12問完走、スマホUI、問題バンク残りの品質確認は継続。監査は `reference-audits/CH03_PRODUCTION_UI_PRACTICE_GATE_2026-09-26.md`。coverageは in-progress。
- 2026-09-27 続き: PR #251 はpublication/v35 CI成功、main `0c1fc5ac391b8872276f49d4bf575de4b3192365` へマージ、Pages run `36289300724` 成功。公開版で難度「標準」を確認。`core_03_03` と `core_03_01` の本番教材から各10問を完走（両方10/10）。これで第3章5テーマすべてで教材→直接演習の1セッションを完走し、直近4件のテーマ名・結果が再読み込み後に保持された。章末統合演習、テーマ別問題バンクの全問、スマホ幅での可読性・タッチ操作は未確認。`reference-audits/CH03_PRODUCTION_UI_PRACTICE_GATE_2026-09-26.md` を参照。coverageは in-progress。
- 2026-09-27 live main `85377672640389724daa55a39acee89ccbd62dd0`、open PR 0、Pages run `36281988127` 成功を確認。新規ゲストで診断12問の後、`core_03_02` 本番教材→テーマ演習6問を完走。結果83%（初回5/6）、履歴は再読み込み後も保持された。履歴のテーマ名を修正したPR #250はCIとPages run `36288947205` 成功、本番で再確認済み。続いて `core_03_04` と `core_03_05` の教材・各7問を完走（両方7/7）。難度 `standard` の表示を「標準」へ修正し、PWA cacheを `fe-quest-v377-137` に更新。03-03・スマホUIのゲートが残る。記録は `reference-audits/CH03_PRODUCTION_UI_PRACTICE_GATE_2026-09-26.md`。coverageは in-progress。
- 第3章の本番UIをゲスト環境で確認。03-01教材→直接演習1問の採点・解説、グラフの最短経路/BFS、整列ラボの1手進行と切替を操作。教材一覧の章見出し・教材行をキーボード対応したPR #248はマージ済み。publication/v35 CI、Pages run `36234388292` 成功、公開画面でEnter/Space操作を再確認。記録は `reference-audits/CH03_PRODUCTION_UI_PRACTICE_GATE_2026-09-26.md`。スマホ実画面、全節演習完走、履歴確認は残る。coverageは in-progress。
- 第3章のプログラム分類と言語を出題と照合。`core_03_04` は既存説明が対応。JSONのキー・値・配列の実例を `core_03_05` に補強（`v376-lessons-ch3-json-shape-v456-20260926`、非公開ソースPR #84 / CI success）。監査は `reference-audits/IPA92_PROGRAM_LANGUAGES_PRACTICE_ALIGNMENT_2026-09-26.md`。第3章5節の出題前照合を順番に記録したが、スマホ実画面・直接演習・履歴・ラボ実操作は未完了。coverageは in-progress。次は実画面・演習ゲートを確認。
- 第3章の探索・整列・再帰を19問と教材・整列ラボで照合。二分探索の件数増加の途中計算を保護教材 `core_03_03` に補強（`v376-lessons-ch3-binary-growth-v455-20260926`、非公開ソースPR #83 / CI success）。監査は `reference-audits/IPA92_SEARCH_SORT_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次は第3章のプログラムの分類と言語を照合。
- 第3章の決定表を出題と照合。規則列の実際の読み取り例を保護教材 `core_03_02` に補強（`v376-lessons-ch3-decision-table-example-v454-20260926`、非公開ソースPR #82 / CI success）。監査は `reference-audits/IPA92_DECISION_TABLE_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次は第3章の探索・整列・再帰を照合。
- 第3章グラフ理論を出題・教材・操作ラボと照合。重み付き経路の合計と重みなしラボの最少辺数の違いを保護教材 `core_03_01` に補強（`v376-lessons-ch3-weighted-graph-path-v453-20260926`、非公開ソースPR #81 / CI success）。監査は `reference-audits/IPA92_GRAPH_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次は第3章の残りの節を順に照合。
- 数値解析と線形計画法を照合。線形補間の計算途中のみ保護教材 `core_02_07` に補強（`v376-lessons-ch2-interpolation-example-v452-20260926`、非公開ソースPR #80 / CI success）。線形計画法は第20章 `core_20_03` の既存教材に対応し増補不要。監査は `reference-audits/IPA92_NUMERICAL_LP_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次は第3章グラフ理論。
- 第2章のAI P0 4項目を出題と照合。用語表はあったがSVM/PCA、CNN/RNN、基盤モデル/LLM、few-shotの判断手順を補強した。非公開ソースPR #79 / CI success、`core_02_05` は `v376-lessons-ch2-ai-decision-bridge-v451-20260926`。監査は `reference-audits/IPA92_AI_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次は第2章の数値解析・線形計画法を照合。
- 第2章のマルコフ過程・仮説検定も照合: 仮説検定の既存説明は出題に対応。マルコフ過程の二経路確率計算のみ補強した。非公開ソースPR #78 / CI success、`core_02_06` は `v376-lessons-ch2-markov-paths-v450-20260926`。監査は `reference-audits/IPA92_MARKOV_HYPOTHESIS_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。スマホ実画面・直接演習・履歴の検証が残る。
- 第2章の形式言語も監査: 正規表現・閉包は既存教材で対応、BNFの再帰展開だけ出題前の手順が薄いため補強。非公開ソース PR #77、保護教材CI success。`core_02_04` は `v376-lessons-ch2-bnf-trace-v449-20260926`。監査記録は `reference-audits/IPA92_FORMAL_LANGUAGE_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress。次はマルコフ過程・仮説検定を節順に照合。
- 継続作業: 第2章の述語論理で出題前の説明不足を発見。非公開ソース PR #76 はマージ、保護教材CI success。`core_02_01` のみ `v376-lessons-ch2-predicate-bridge-v448-20260926` へ更新済み。監査記録は `reference-audits/IPA92_PREDICATE_PRACTICE_ALIGNMENT_2026-09-26.md`。coverageは in-progress のまま。次は形式言語・正規表現を節順で監査する。
- 作業開始時の live main: `73be1902886587178ba915bf67648da2f2ec2533`（PR #237）。open PR / open Issue はともに0。
- PR #237 head `092f2669f850fd9fc060b1e2a72416cb753d58fd` の publication run `35955275533` / v35 run `35955275583` は success。main の Pages run `35955324267` も success。
- PR #235でラボを統一前の2種類へ復元済み。#231〜#234の統一方針を再適用しない。#236/#237のレッスン一覧復帰時の中央表示も反映済み。
- 残存ブランチには過去のsquash等によりmainへ祖先として入っていないものもある。open PRなしを確認し、残存branchだけで未着手と判断しない。
- 今回の作業ブランチ: `audit-venn-practice-state-20260926`。集合・ベン図ラボの練習状態の不整合を修正し、CI回帰検査を追加。詳細は `reference-audits/IPA92_VENN_PRACTICE_STATE_AUDIT_2026-09-26.md`。
- 対応表は43項目（37 in-progress / 6 verified-covered）のまま。今回だけで集合の教材・直接演習・履歴の全ゲートを完了扱いにしない。
- 目標PWA cache: `fe-quest-v377-139`。profile schema / protected banksは変更なし。
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


## 11. 2026-10-04 第11章「情報セキュリティ」章単位監査完了

GitHub / protected DB の現状を正として、第11章を章単位で再監査した。

### protected lesson / question

- private PR #109 `audit: Chapter 11 security whole-chapter clarity` merged
- private merge commit: `2d80b516e69cbadf426a563f7a65fdd3c0f5ed3b`
- protected CI `Validate protected lessons` run `37164740753`: success
- `core_11_01`〜`core_11_08` の8 lessonすべてで、本文ルートへ `ch11-depth-v392` を適用
- 11-01〜11-06のquick quiz解説を、設問の正答理由を直接説明する形へ修正
- UNIX系アクセス権を「左から 読取り(4)・書込み(2)・実行(1)」へ明確化
- 2要素認証と2段階認証の説明を分離
- 既存ID・正答位置・catalog metadata・content_version・active flagを維持したまま10問を別角度へ置換
  - パスワードリスト攻撃
  - AES / RSA / SHA-256
  - BCM / BCP
  - JIS Q 27001 / ISMS適合性評価
  - UNIX系アクセス権
  - DMZ
  - ファジング
  - CAPTCHA
  - 多要素認証
  - 本人拒否率 / 他人受入率
- guarded baseline付きでDBへ反映済み
- 反映後も active lesson `130`、active question `1180` の件数は不変

### public app / CI / production

- public PR #301 `audit: Chapter 11 security acceptance and readability` merged
- public merge commit: `304911ef847284c9315b8883c08155c255a09c69`
- Chapter 11 public metadata:
  - 全38問
  - chapter comparison 4問
  - テーマ演習 `3 / 5 / 5 / 3 / 3 / 3 / 4 / 8`
  - 章末確認12問、重複IDなし、8テーマすべてを含み、chapter comparisonも含む
- `ch11-depth-v392.css` の本文/注記/code/リスクカード文字サイズをスマホ基準へ調整
- 第11章readability CIを追加
- 初回public CIはChapter 11 selector testの正規表現エスケープ誤りで失敗したが、branch上で修正
- 修正後:
  - `Validate sanitized FE QUEST publication` run `37165024026`: success
  - `Validate IPA 9.2 question v35 public activation` run `37165024030`: success
- production Pages deploy run `37165053856`: success
- PWA cache contract: `fe-quest-v377-160`
- 監査記録: `.github/reference-audits/CH11_CHAPTER_ACCEPTANCE_2026-10-04.md`

### 次のデフォルト作業

別の具体的指示がなければ、次は参考資料の節順に沿って **第12章「システム開発」** を章単位で監査する。

対象:
- 12-01 システム開発技術
- 12-02 システム要件定義
- 12-03 システム設計
- 12-04 プログラミングとオブジェクト指向
- 12-05 テスト

第5〜11章の静的スマホreadability CIは整備済みだが、実機スマートフォンでの最終タッチ・スクロール・横幅確認は別残件として扱う。


## 12. 2026-10-04 第12章「システム開発」章単位監査完了

GitHub / protected DB の現状を正として、第12章を章単位で再監査した。

### 参考資料との照合

参考資料の第12章は次の5節。

- 12-01 システム開発技術
- 12-02 システム要件定義
- 12-03 システム設計
- 12-04 プログラミングとオブジェクト指向
- 12-05 テスト

既存のprotected lessonには、SLCP・共通フレーム・開発工程階層、DFD、設計4工程、モジュール結合度、オブジェクト指向、UML、Vモデル、ホワイト/ブラックボックス、5種類の網羅、トップダウン/ボトムアップ、スタブ/ドライバまで既に実装されていたため、今回は大規模追加ではなく「章全体の読みやすさ・quick quiz整合・直接演習の重複改善」を中心にした。

### protected lesson / question

- private PR #110 `audit: Chapter 12 system development whole-chapter clarity` merged
- private merge commit: `7fecdd68decc168ef6b585b055c1db6b514e86d6`
- protected CI `Validate protected lessons` run `37165989620`: success
- `core_12_01`〜`core_12_08` の8 lessonすべてで本文rootへ `ch12-depth-v393` を適用
- 12-01 / 12-02 / 12-03 / 12-05 のquick quiz解説を設問の正答理由へ直接対応
- 既存ID・正答位置・catalog metadata・content_version・active flagを維持したまま5問を別角度へ置換
  - 共通フレーム
  - モジュール結合度（データ結合）
  - DFDのプロセス
  - UMLシーケンス図
  - 複数条件網羅（2条件なら4組合せ）
- guarded baseline付きでDBへ反映済み
- 反映後も active lesson `130`、active question `1180` の件数は不変

### public app / CI / production

- public PR #303 `audit: Chapter 12 system development acceptance and readability` merged
- public merge commit: `ee06be81ad48671087858b0363149703b0444f6f`
- Chapter 12 public metadata:
  - 全54問
  - chapter comparison 5問
  - テーマ演習 `3 / 7 / 7 / 8 / 7 / 6 / 4 / 7`
  - 章末確認12問、重複IDなし、8テーマすべてを含み、chapter comparisonも含む
- `ch12-depth-v393.css`
  - note 17px → 18px
  - lifecycle補助文 15px → 16px
  - design-step補助文 15px → 16px
  - 横長表の横スクロールと既存レスポンシブbreakpointを維持
- 第12章readability CIを追加
- `Validate sanitized FE QUEST publication` run `37166113547`: success
- `Validate IPA 9.2 question v35 public activation` run `37166113558`: success
- production Pages deploy run `37166141859`: success
- PWA cache contract: `fe-quest-v377-161`
- 監査記録: `.github/reference-audits/CH12_CHAPTER_ACCEPTANCE_2026-10-04.md`

### 次のデフォルト作業

別の具体的指示がなければ、次は **第13章「ソフトウェア開発手法」** を章単位で監査する。

参考資料の第13章は `13-01 ソフトウェアの開発モデル`。現行教材・公開問題metadata・protected DBを最新mainから読み直し、ウォーターフォール、プロトタイピング、アジャイル等の説明・図・演習・スマホreadabilityを確認する。

第5〜12章の静的スマホreadability CIは順次整備しているが、実機スマートフォンでの最終タッチ・横スクロール・横幅確認は横断残件として扱う。


## 13. 2026-10-04 第13章「ソフトウェア開発手法」章単位監査完了

GitHub / protected DB の現状を正として、第13章を章単位で再監査した。

### 参考資料との照合

添付参考資料の第13章は `13-01 ソフトウェアの開発モデル` の1節構成。
本文・過去問で、ウォーターフォール / アジャイル、スクラム、ローコード / ノーコード、リバースエンジニアリング、マッシュアップ、XP、ペアプログラミング、リファクタリング、ソフトウェア構成管理を確認した。

現行 `core_13_01` にはこれらの主要事項が既に実装されており、`core_13_02`〜`core_13_04` はIPAシラバス側の補足テーマとして知的財産適用管理・開発環境管理・構成管理/変更管理を保持している。

### protected lesson / question

- private PR #111 `audit: Chapter 13 software development methods whole-chapter clarity` merged
- private merge commit: `eaa07b9c7c0b85596bb2fc96123f84b44643cf9c`
- protected CI `Validate protected lessons` run `37166640421`: success
- `core_13_01`〜`core_13_04` の4 lessonすべてで本文rootへ `ch13-depth-v394` を適用
- `core_13_01` quick quizの解説を、正答であるアジャイルの短期反復・フィードバックの説明へ修正
- 既存ID・正答位置・catalog metadata・content_version・active flagを維持したまま2問を参考資料の重点へ置換
  - デイリースクラム
  - リバースエンジニアリング
- guarded baseline付きでDBへ反映済み
- 反映後も active lesson `130`、active question `1180` の件数は不変

### public app / CI / production

- public PR #305 `audit: Chapter 13 software development methods acceptance and readability` merged
- public merge commit: `4e445a880655885d8134f83cbcddb7da57692165`
- Chapter 13 public metadata:
  - 全30問
  - subject_a 29問
  - chapter_extra 1問
  - `core_13_01` の即時演習対象は16問あるが、通常テーマ演習の上限により実出題は10問
  - テーマ演習実出題数 `10 / 4 / 4 / 4`
  - 章末確認12問、重複IDなし、4テーマすべてを含み、比較問題も含む
- `ch13-depth-v394.css`
  - note 17px → 18px
  - waterfall / agile工程カード見出し 17px → 18px
  - waterfall / agile工程カード補助文 15px → 16px
  - agile releaseラベル 17px → 18px
  - mashupカード見出し 17px → 18px
  - スクラムイベント表 / 構成品目表の横スクロールを維持
- 第13章readability CIを追加
- 初回public CIは `core_13_01` のテーマ演習上限10問を16問と誤って期待して失敗したため、実際のselector仕様に合わせて修正
- 修正後:
  - `Validate sanitized FE QUEST publication` run `37166812398`: success
  - `Validate IPA 9.2 question v35 public activation` run `37166812394`: success
- production Pages deploy run `37166835694`: success
- PWA cache contract: `fe-quest-v377-162`
- 監査記録: `.github/reference-audits/CH13_CHAPTER_ACCEPTANCE_2026-10-04.md`

### 次のデフォルト作業

別の具体的指示がなければ、次は **第14章「プロジェクトマネジメント」** を章単位で監査する。

参考資料の節順:
- 14-01 プロジェクトマネジメント
- 14-02 プロジェクトスコープマネジメント
- 14-03 プロジェクト資源マネジメント
- 14-04 プロジェクトスケジュールマネジメント
- 14-05 プロジェクトコストマネジメント
- 14-06 プロジェクトリスクマネジメント

第5〜13章の静的スマホreadability CIは順次整備済みだが、実機スマートフォンでの最終タッチ・横スクロール・横幅確認は横断残件として扱う。

## 14. 2026-10-04 第11章「情報セキュリティ」再監査（2回目）完了

ユーザーの「11章から監査をもう一度」の指示を受け、過去記録ではなくlive GitHub / protected DBを正として第11章を再監査した。開始時は公開main `bc706502839a61cfb438f582cf3d30fe4c8d0c86`、非公開main `eaa07b9c7c0b85596bb2fc96123f84b44643cf9c`、双方open PR 0。監査途中に並行作業でopen PRが現れたため、そのlive状態を読み直して競合を避け、最終的に同じ章の再監査PRへ合流した。

添付教科書の第11章（PDFページ405〜464、60ページ）を本文・図表まで再確認し、protected lesson 8件・第11章question 38件をlive DBから照合。第2パスでスパム、CIA三大特性、OAuth文言、問題解説/ヒントを補強し、さらに全章再監査でハッシュ/署名、認証局、DMZ、リスク、CVE/CVSS/CWE/CPE、生体認証、媒体別データ消去などの具体性を改善した。

### protected側の確定状態

- PR #112 merged。CI `37168791167` success。スパム/CIA/OAuth文言と9問の説明・ヒントを補強。
- 初回DB適用はguard不一致で失敗し、トランザクション全体がロールバック。部分更新なし。
- PR #113 merged。CI `37168996076` success。lesson baseline guardを現在行へ修正し、その後DB適用成功。
- PR #115 merged。CI `37169240057` success。CIAを直接問う演習へ `coreq_11_05_3` を置換し、ID/分類/正解index/content_version/activeを維持。
- PR #114 は最新mainへ更新後、head `b6397d5ec6f5c48e40582be4f8ff03199b8a2a4c`、CI `37169343700` success、merge `eb4c2fd5007a0dfde520a8d0300993f616f8754a`。
- live DBで8教材すべてがPR #114のreplace payloadと一致、対象11問すべてがreplace後フィールドと一致することを再照合。
- active lesson `130`、active question `1180`、第11章 `38` 問を維持。

### public側の確定状態

- PR #307 merged。publication `37169257801` success、v35 `37169257795` success。
- public merge/main `cf5a58f0386fb01e2332769a4c122464f4ce5038`。
- Pages `37169351504` success。
- PWA cache `fe-quest-v377-163`。
- 第11章の説明カード・アクセス権表の本文を18pxへ統一し、readability検査を強化。
- 詳細: `.github/CH11_FULL_REAUDIT_2026-10-04.md`。

### 残件と次の作業

実スマホでの狭幅・タッチ・縦横切替は未検証のため、coverageはin-progressのまま。内容再監査としては第11章の2回目監査を完了。ユーザーから別指示がなければ、次は添付参考資料の節順で第12章「システム開発」を同じ基準で再監査する。

## 15. 2026-10-04 第12章「システム開発」再監査（2回目）完了

第11章の再監査に続き、live GitHub / protected DB と添付参考資料を正として第12章を再監査した。添付参考資料の第12章（PDF 465〜508ページ、44ページ）を本文・図表まで確認し、12-01〜12-05と、FE QUEST側の補足テーマ core_12_06〜08を含めて章全体を照合した。

### 再監査で補強した内容

- 設計対象が「システム→ソフトウェア→プログラム→モジュール→関数→命令」と細分化する流れ。
- 結合テストで確認するインタフェースの具体例（引数・戻り値・データ形式・呼出し順序）。
- AかつBを使った条件網羅、判定条件/条件網羅、複数条件網羅の具体的な真偽組合せ。
- ホワイトボックス/ブラックボックスの得意な確認と、それだけでは保証できない点。
- V字モデルを直接判断する演習。
- UML汎化の白抜き三角形、ブラックボックス、共通フレーム/設計工程を章内比較問題へ反映。
- 設問とずれていた説明・ヒントを正答理由へ直接対応。

### protected側の確定状態

- private PR #116 merged。
- head `3c2fa60cf47cb47f225a06e6822abbdbec891981`。
- protected CI `37170183635` success。
- private merge `5cb04a770a94e9ddb2dc85c94f5be2afb1e2f589`。
- guarded transactionで2教材・9問題をDBへ反映。
- 反映後、対象2教材・9問題すべてがreplace後状態と一致することを再照合。
- active lesson `130`、active question `1180`、第12章 `54` 問を維持。

### public側の確定状態

- public PR #311 merged。
- head `7189201070aa308bce619a4bbd7f974748bbf438`。
- publication CI `37170398143` success。
- v35 CI `37170398183` success。
- public merge `d68e1351c269ca632b70ba01abd88be0bcb9c2a3`。
- Pages `37170423353` success。
- PWA cache `fe-quest-v377-165`。
- 第12章の説明文・表本文を18pxへ引き上げ、短い図ラベルは16px以上を維持。
- 詳細: `.github/CH12_FULL_REAUDIT_2026-10-04.md`。

### 残件と次の作業

実スマートフォンでのタッチ・横スクロール・縦横切替は未検証のため、coverageはin-progressのまま。内容再監査としては第12章の2回目監査を完了。その後ユーザーが第12章全体の監査継続を明示したため、下記追加確認を優先した。

## 16. 2026-10-04 第12章全体監査の追加確認

- 最新GitHub main・PR・CIと現行DBを再取得し、全8教材・54問の内容、参考資料44ページを確認。
- private PR #117 merged、CI `37171148170` success、main `f202698e5352b1105d44aa4dcf712c2927957a46`。
- 5教材・12問のguarded deltaをDBへ反映後、全変更フィールドを再取得して一致確認。無関係行・ID・正答・分類・版・active・教材topicを保持。130教材・1180問・12章54問。
- 受入れの解説に混入していた切戻しの判断軸、設問とずれたヒントを修正。網羅基準の論理式と短絡評価、SysML v1の範囲、ユーザーストーリー・CI/CD・移行・保守の具体例を補強。
- public PR #313 merged、head `e30baf5a09ba3744e48ff53c4c246683b6916b89`、publication `37171247930` / v35 `37171247961` success、main `2315d27019921579dad0ef25d6d7688daf819d91`、Pages `37171301526` success、cache166。
- 本番desktopで全8教材の読込、追加文、章専用の本文・表の18pxを確認。12-07全4問を解答完了し、受入れの誤答ヒント・再回答・解説表示を確認。
- 詳細: `.github/reference-audits/ch12-full-followup-20261004.md`。
- 残件: 実スマートフォンのタッチ・横スクロール・縦横切替、54問全件の解答操作。内容照合済みと実機受入れ済みを混同しない。coverageはin-progressを維持し、ユーザーの第12章指定を優先する。

## 17. 2026-10-04 第12章全54問の本番UI検証

- 最新GitHub main / open PR / CIと現行DBの54問を再取得して検証。開始public main `1700ceba2ec7cba6efcc392c547a532bd15e6e41`、private main `f202698e5352b1105d44aa4dcf712c2927957a46`、双方open PR 0。
- 本番Chrome desktopの新規ゲストで全8教材からテーマ演習49問を完了。12-07のみ意図的な初回誤答1件でヒント・誤答選択肢の無効化・再回答・再挑戦正解の集計を確認。
- 章末12問を4回（各回100%）完了し、比較5問も解答。全54 ID集合が再取得したlive DBの第12章ID集合と一致。
- 全54問の正答判定、正解根拠・他選択肢の解説、次問・結果画面への遷移を確認。延べ97問、意図的誤答の再回答を含む98送信。新規不具合なし。
- 詳細: `.github/reference-audits/ch12-ui-acceptance-20261004.md`。
- 前節の「54問全件の解答操作」は解消。残件は実スマートフォンの狭幅・タッチ・横スクロール・縦横切替のみ。実機を含むcoverageはin-progressを維持。
- 今回は監査記録のみ更新し、教材・問題・実装・DBは変更しない。第13章以降へ進めず、第12章の指定を優先する。

## 18. 2026-10-04 第13章全体再監査・全30問の本番UI検証

第12章全54問のUI確認後、ユーザーの継続指示に従い第13章へ進んだ。開始public main `375bc49b0ceea38f205a3053d18ba7315ae40e7a`、private main `f202698e5352b1105d44aa4dcf712c2927957a46`、双方open PR 0をlive GitHubで確認。添付参考資料の第13章PDF509〜520（12ページ）の本文・強調・図表を再確認し、全4教材・30問をlive DBから照合した。

- private PR #118 merged、head `7ada51e106050ca964742bc5ed573d5e74c1db4e`、CI `37192259297` success、merge/main `dc2c54a9072c047034bab63f45f863765af0a678`。
- 3教材・12問のguarded deltaを本番DBへ反映。スクラム/XP、環境の再現性と分離、ベースライン/変更管理、ヒント・説明・誤答理由を補強。設問本文・正解位置・正解選択肢・ID・分類・版・activeを維持。
- 全4教材・30問を反映後に再取得して変更・未変更フィールドを照合。無関係行・metadataの不変性をtransaction内で検査。130教材・1180問・13章30問。
- public PR #316 merged、head `03e71d81e7c0793eca2b72ca382daced6e146d94`、publication `37192324323` / v35 `37192324320` success、merge `502483c70223e03b244cc42e500cdf6b7a3e9bed`、Pages `37192586593` success、cache167。
- 説明カード・スクラム役割・イベント表・構成品目表の本文18pxを検査に追加し、本番computed styleも確認。
- 本番Chrome desktop新規ゲストで全4教材・全30 IDの正解判定、正解根拠、3つの誤答理由、次問・結果遷移を検証。延べ54問・55送信。13-04では意図的誤答1件のヒント・再回答・再挑戦正解を検証。未確認ID 0、新規不具合なし。
- 詳細: `.github/reference-audits/ch13-full-reaudit-20261004.md`。source commit/content_version対応: `.github/reference-audits/ch13-import-manifest-20261004.json`。
- 残件は実スマートフォンの狭幅・タッチ・横スクロール・縦横切替。coverageはin-progressを維持する。

### 第13章完了時の次作業（第14章は下記で完了）

第13章完了時の次作業は、第14章「プロジェクトマネジメント」全体を、最新GitHub main・作業ブランチ・PR・CIと現行protected DBを読み直して再監査する。第12章の指定は上記追加確認で完了し、第13章も内容・desktop全問検証まで完了。実機残件は横断事項として引き継ぐ。


## 19. 2026-10-04 第14章全体再監査・全46問の本番UI検証

開始public main `a12313b25a5de31c9518b1b3d6b81aae078c9173` / private main `dc2c54a9072c047034bab63f45f863765af0a678`、双方open PR 0をlive GitHubで確認。添付参考資料02の第14章PDF521〜552（書籍503〜534、32ページ）を画像で読み、全10教材・46問をlive DBで確認。

- 非公開PR #119で10教材・15問、#120で14-08のリスク定義と重複1文を追補。guarded transactionで適用し、無関係行・問題本文/選択肢/正解index・ID・分類・版・activeの不変性を検査。小確認解説5件以外のtopicを維持。
- 日程図の数値・軸と比較の読み方、工数配分の進捗率、日程短縮後の再計算、EVM/FP、欠陥密度、契約方式を具体化。本文/表18px・補助ラベル16px、固定サイズSVGと横スクロールを整備。
- CIと本番配信は最新状態欄のrunでsuccess。反映後全10教材・46問の全フィールドが期待値と一致、active 130/1180。
- 本番Chrome desktopで全10教材と全46 IDの採点・正解根拠/誤答理由・次問/結果遷移を確認。テーマ42問＋章確認12問×3、延べ78問/79送信。14-06の意図的誤答1件でヒント・無効化・再回答・集計を確認。追補後の14-08も再読込して最新表示を確認。
- 詳細 `reference-audits/ch14-full-reaudit-20261004.md`、source/version対応 `reference-audits/ch14-import-manifest-20261004.json`。実機残件は横断事項として保持。

### 次のデフォルト作業

別指示がなければ、第15章「サービスマネジメントとシステム監査」の全節・教材・問題・章末演習を、最新GitHub状態と現行protected DBを読み直して再監査する。内容・desktop確認と実スマートフォン受入れを区別する。


## 20. 2026-10-05 第15章全体の内容再監査・本番UI 51/52

公開live main `7eaaa3d175b4c5f596bade6c488f7418f16c385e`、非公開main `51e01b500fc323f7ec1bdda76f9263fc47aebdbe`、前回作業branch、双方open PR 0、CI/Pages successを実読して再開した。添付02資料PDF553〜578の全26ページ画像・強調・図表・19問題と、IPA9.2サービス/監査範囲を8教材52問へ照合。限定サービス時間の停止許容計算、監査計画/調書/フォローアップ、内部監査の独立性、ITガバナンス、Green IT、統制の限界、改善指標の偏り、復旧目標の時間軸などを独立例で補強。8教材・11問の説明、教材小テスト解説4件・要点2文を更新。問題の設問/選択肢/正答/ID/版/activeや履歴schemaは維持。

非公開 #121 CI成功、公開 #320/#321の両CI成功後にmergeし各Pages成功を確認。完全期待値transactionを1回適用して対象数・無関係行/metadata digestを検証し、8教材52問の再取得が期待値と一致。最終DB再読も反映直後と全フィールド一致、active130教材/1180問。英語正式名の途中へ日本語補足が入る表示を実画面で発見して #321で修正。配信cache170の通常再読込で正式名と直近4履歴保持を確認。

通常UIで8テーマ43問、全8テーマを含む章末12問×4回、運用追加10問×2回を完走。延べ111問/112送信で比較6種類を含む51 IDを確認。初回移行の意図的誤答→ヒント→正答再挑戦を含み、復習1件は新規ゲストで未解消。8教材409要素の最小18px、図/表をdesktopで実測・目視。最後の確認時は教材8/8・定着2/8・1,657 XP、運用バンク12/13。

**残るUI 1問は `ipa92_a_service_request_001`。** 内容は照合済みだが出題・採点・解説の実画面は未確認。通常15-08を再度開いた直後に確認ブラウザのtransportが切れ、復旧手順取得も `409 Conflict / environment_offline` で停止。最後の教材完了ボタンの成否は観測できず件数へ含めない。本番停止とは判断しない。最終再読込とスクリーンショット保存も残件。詳細とsource対応は第15章監査/manifestを読む。内容完了だけで章全体完了としない。

### 次のデフォルト作業

live main / 作業branch / PR / CI / Pages / DBを再読し、接続可能な通常UIで15-08の残る1問を確認して終了結果・履歴・進捗の再読込と画像証拠保存を完了する。CASを再適用せず、確認済み51種類を網羅し直さない。実スマホ残件を保持し、対応可能なら狭幅/タッチ/スクロール/縦横切替を確認する。その後、次の内容監査は第16章「システム戦略」全体。IPA対応表43項目の完了数は変更しない。

