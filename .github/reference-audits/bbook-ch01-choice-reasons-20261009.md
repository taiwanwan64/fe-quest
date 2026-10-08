# 科目B 文法章：既存トレース選択肢別理由・表示改善（2026-10-09）

## 起点と範囲

GitHub liveでpublic main `4c648c4d4b97507f6cca9de7ecfd3623b514bc9f`、前作業branch `8aaf1d3472456cb71a1231a3437c873b60da209d`（tree一致）、private main `030c4164dda109974fbba150213f1cec1cc5db74`、双方open PR 0、直近CI/Pages successを実読して再開。同じ文法章で、既存5親10予測の40理由と通常表示を改善。第2章へ進めていない。

## 保護データ

private PR #131 head `6c7fdb59ab7627ade2a8fb1af60c36a00df2e493`、理由CI `37853061048` / 保護CI `37853060782` success。10対象のchoice_explanationsのみ更新するdeltaと独立の計算検証、全行照合SQLを追加。

初回SQLは更新後照合が失敗し、トランザクション全体をロールバック。対象10理由がすべて空のまま・全体digest維持を確認。JSON演算子の優先順位によりreadback期待式がreplaceのみになったことをread-onlyで再現。private PR #132で両JSON operandに括弧を付け、検査を追加。head `4340cc3bc12b2fea719ccc95f6ed3523f447a727`、理由CI `37853336515` / 保護CI `37853336462` success、private main `756f1451e114990cc59599cef4be7ed4b5c93b9b`。

修正SQLを1回適用済み。対象10問・40理由のreadback一致。正答・本文・code・選択肢・hint・全体explanation・catalog・version・日時は不変。非対象1176問・全130教材の全行digest保持。全1186問digest `df83aae7e41c90f929b180ffb18bfc13`、教材digest `e89f8d33fa35a4d104110807dddb3543`。理由SQLおよび従来既適用deltaは再実行しない。gate version3は実読のみ・再deployなし。

## 公開実装とCI

public PR #354 head `1af444259ddd7f2ff11f8b2ab94a7bc1b226fbc9`、publication `37854036526` / v35 `37854036512` success、配信main `d50d226730747f129a0d22a4615dafda11524a6f`、Pages `37854126136` success、cache188。11変更blobはローカル検証ファイルのGit blob hashと一致。

通常bridgeは誤答時に選択1理由だけ、正答後に4理由をアプリへ渡す。空理由の既存30予測は全体解説の従来契約を維持。textContentで描画し、次の予測・一覧・リセット・新問題ロード時に消去。コード・予測・解説18px、一次元配列nowrap＋内部横スクロール。ロード前に旧packet/currentB/状態を消去し遅延採点の旧packetを拒否。得点・採点・正答・永続プロフィール形式は維持。

キーボード横スクロール用属性がbMockに付いていたことを公開差分レビューで発見。public PR #355で通常renderBVisualの配列に限定しbMock属性を撤去、実描画テストで対象と非対象を区別。head `1a78c2adaa16cccffdccd0d1a4d4f6ebd1ad13a5`、publication `37854501893` / v35 `37854501959` success、配信main `9cfd114116f19071dcfb97ffaeb7004f3b00fd61`、cache189。8変更blobもローカルhash一致。

ローカル回帰: 実bridgeの回答前保護、誤答1/正答4/旧空配列/不完全理由、forgetAnswer、textContent/XSS文字列、再回答XP、解説の区間/最終区間保持、添字と内部focus・専用探索/ソート分岐、named keyboard region、loading reset順序を確認。CI全check成功。回線障害は本番で誘発していない。


## Pages最終実装

修正PR #355のPages `37854560807` success、main `9cfd114116f19071dcfb97ffaeb7004f3b00fd61`。通常再読込でscript query `btrace-choice-189`を確認。ループ完了210XP・B1/35・1/20を再読込後も確認。

## 通常UI受入

許可済み別QAゲストで診断12/12、60分・受験日未定、120XPから開始。旧575XP/120XPセッションはこのブラウザーに存在せず、プロフィールの削除・復旧・統合なし。旧セッションの永続保持を今回証明したとは言わない。

| 親 | 予測 | 正答後の理由 | 完了後XP |
| --- | --- | --- | --- |
| loop_sum | 1 / 2 | 各4 | 210 |
| count_even | 1 / 2 | 各4 | 300 |
| nested_loop | 1 / 2 | 各4 | 390 |
| gcd_euclid | 1 / 2 | 各4 | 480 |
| recursion | 1 / 2 | 各4 | 570 |

loop_sumの意図的誤答1件は選択1理由だけ・XP120不変・同じ4択で再回答可能。正答10操作で40理由表示。最終区間と完了まで理由保持を確認。診断と分けて10unique ID/10予測位置/11採点操作/5完了。追加6問は再採点していない。loop_sumはcache188で受入後、通常再読込でcache189・B1/35・210XP保持を確認。残り4親は189で受入。

コード/予測見出し/4選択肢/理由のcomputed font sizeは18px。偶数カウントの配列5要素はrect.topが全て353.75で1行、表示番号1〜5、内部focusは2番目を維持。1363px viewportに対しdocument scrollWidth1348でページ横溢れなし。領域tabindex=0/role=region/名前をDOMで確認しArrowRight入力を実行。ただしこの幅ではclientWidth=scrollWidth=270でoverflowなしのため、実際の横移動/実スマホ狭幅/タッチ/縦横切替の受入とは言わない。

完了後のリセットで理由hidden・状態未実行へ戻り、XP300不変。別問題ロード時に読み込み用code/message・未実行STATE・予測なし・説明なし・step無効を確認。ロード中の未採点おすすめを戻る操作は完了後にコースへ戻ったため、通常モード一覧から対象に入り直した。得点変更なし。遅延処理の全ケースを本番で誘発したとは言わない。

最終通常reload後に570XP、A0/130、B5/35、アルゴリズム5/20、セキュリティ0/15を確認。計算120+10×5+5×80=570一致。完了5親は前回と同じだが、新しい理由表示の受入だけを今回確認。画像を保存（保護された設問入り画像はpublic GitHubに置かない）。

## 次の同章残件

既存5親の40理由は完了。他15親30予測の理由は空のまま、全通常40予測へ理由追加済みとは言わない。文法exam/do/div等の未受入分は既存source/gate/前回記録とliveを照合して対象を限定する。無目的に受入済み5親や補助6問を全反復せず、第2章へ自動的に進まない。

実スマホ狭幅/タッチ/横スクロール/縦横切替、残る基礎15親30予測、全B180の受入、文法章全skill完了は未確定。coverage in-progress、IPA43（37 in-progress / 6 verified-covered）、第22章関連度gap維持。記録PR後の最新main/作業branch/open PR/CI/PagesはGitHub liveで再確認する。
