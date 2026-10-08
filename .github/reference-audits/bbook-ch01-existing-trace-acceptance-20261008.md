# 科目B・文法章の既存トレース受入（2026-10-08 JST）

## 範囲と現状

GitHubを実読して開始：public main `68b32c73bbb82a8e08f9a2057c2a0dc1baac3cdb`、前作業branch `record-b-grammar-supplement-20261008`、open PR 0、publication/Pages success。private main `030c4164dda109974fbba150213f1cec1cc5db74`、open PR 0、保護CI success。双方recursive treeにAGENTS.mdなし。

同じ文法章の既存関連5親・10予測を通常UIで確認した。追加の補助6問は前回受入済みで反復しない。03参考書の文法章を前回全70ページ監査した記録を継承し、今回は分岐・while・for・関数・局所変数・呼出しの該当ページを再読。04本文全章の新たな監査はしていない。

## 修正とCI

### 解説の消失：PR #351

採点結果の解説を書いた直後に、次区間のreset処理が汎用メッセージで上書きする不具合を本番通常UIで再現。採点後の区間更新ではreset前の解説をtextContentとして保持し、最終区間にも同じ保持オプションを渡す。新規開始・リセットは従来どおり消去する。採点・正答・チェックポイント・XP加算式・履歴・DBは変更しない。

head `67303ae88276bbb2cbbaa426d529033200c6269a`、publication `37748040737` / v35 `37748040797` success後merge。main `610a815c046bb74cf4a18ffdb7a7c5698844a7b5`、Pages `37748130635` success、cache186。公開版script query `btrace-feedback-186` を確認して以下の10予測を採点した。

合成fixtureによる実helper/実grade-handler回帰：通常区間・最終区間の解説保持、plain text、新規reset、誤答再挑戦、通信失敗時のXP/位置保持、既解決tailの再採点防止。修正前で再現FAIL、修正後PASS。初期test抽出境界の誤りはtest harnessを修正し、アプリ不具合と区別した。

### 図の要素番号：PR #352

count_evenのコードは1始まりなのに汎用配列図が0始まりだった。同じ汎用二次元図も0始まりだったため、通常renderBVisualのラベル2箇所だけを1始まりへ揃えた。内部focus/matrixFocus、値、選択肢、保護コードは変更しない。専用探索/ソートとbMockVisualHtmlは対象外。

初期head `f280a775fa1f77d5bfd5a64d9df9c2b216e4d6bd` のpublication `37749015135` は新しい番号回帰でfailure。候補をGitHubへ渡す文字列置換が先に現れる別の描画関数へ当たり、ローカルで検査した関数と異なっていた。対象関数の境界内だけに修正し、ローカル候補cmp一致・GitHubのpinned compareとblob readbackで通常rendererの2行を確認。失敗headはmerge/配信しなかった。

最終head `57a5aa012e3563078bb9909f5a186bd462210fd9`、publication `37749248086` / v35 `37749248073` success後merge。main `3b4c4dfe47c6711948190f35a8d38445547ace8f`、Pages `37773254470` success、cache187。script query `btrace-index-187` の公開版を通常UIで確認。

実normal rendererの合成fixture回帰：配列番号・二次元行列番号、内部0始まりfocusとarrayState、専用探索/ソートdelegationを検査。旧rendererでFAIL、修正後PASS。feedback/文法/補助6/第22章/cold boot回帰もPASS。connectorの一時的に古いPR files表示だけで判断せず、最終commit compare/blobとCIで確定した。

## 通常UI受入

| 親ID | 予測ID | 確認した範囲 |
|---|---|---|
| loop_sum | b_exercise_loop_sum_1 / _2 | 2予測の正答・解説、最後の区間、完了 |
| count_even | b_exercise_count_even_1 / _2 | 2予測の正答・解説、最後の区間、完了 |
| nested_loop | b_exercise_nested_loop_1 / _2 | 2予測の正答・解説、最後の区間、完了 |
| gcd_euclid | b_exercise_gcd_euclid_1 / _2 | 2予測の正答・解説、最後の区間、完了 |
| recursion | b_exercise_recursion_1 / _2 | 2予測の正答・解説、最後の区間、完了 |

修正前のloop_sum第1予測で意図的誤答→ヒント→再挑戦正解を確認し、解説消失を発見した。通常トレースでは誤答選択肢は再び有効になる既存仕様で、補助6問の誤答無効化とは異なる。修正配信後にloop_sumを新しいセッションで開始し、上表5親10予測をすべて正答・解説保持まで確認。最後の区間を実行し、各完了表示と完了XPを確認した。

採点対象は10unique ID、問題位置は修正前1＋修正後10＝11、採点操作は修正前誤答/正答2＋修正後10＝12。初期診断12問は別で、これに加算しない。loop_sum第1予測を修正前後の別セッションで操作したので、同一セッションの重複採点とは扱わない。

ユーザーが許可した別の確認用ゲストで、診断12/12→60分・受験日未定の計画を完了。診断120XP＋修正前正答5XP＋修正後10正答50XP＋5完了400XP＝575XP、基礎トレース一覧5/20の表示を確認した。A0/130。B全体5/35の再読込後表示や通常トレースの演習履歴5件はこのゲストで未確認。完了はbProgress/XPへ記録する実装を読み、履歴件数を推測で確定しない。

### PR #352公開後の表示確認用セッション

継続時にブラウザーはabout:blank・初回設定になっており、前の575XPゲストを再利用できなかった。プロフィール消去・復旧・統合は行っていない。許可された確認用ゲスト作業の範囲で、別セッションを通常UIで診断12/12→60分・受験日未定まで進めた。120XP・A0/130・B0/35であり、575XPゲストと同じデータとは言わない。

配列count_evenを未採点のまま最初の3行まで実行：図は1〜5、i=1時の強調は第1要素。行列matrix_sumを第1予測まで実行：図は1,1 / 1,2 / 2,1 / 2,2、第1要素の強調とコードの行列番号が一致。図確認だけで追加正答・完了XPを加算していない。行列の固定回数step操作が予測停止後にdisabledとなり1回timeoutしたため、最新DOMを読み直して停止を確認し、再採点せず通常reload。120XP・A0/130・B0/35を確認した。前の575XPの永続化確認とは区別する。

修正された配列図を周辺UI込みで目視し、画像 `fequest-b-trace-index-1791460773230.jpg` を保存。保護教材の画像を公開GitHubへ置かない。consoleの採取にはブラウザー拡張由来metadata errorがあり、FE QUESTエラーと同一視しない。

## DB・保護範囲

今回DB mutationなし、private mainも変更なし。最終read-only再照合：1186問、全問digest `8385789f12edf994d6ae4eee0ea86b7f`、130教材digest `e89f8d33fa35a4d104110807dddb3543` が前回と一致。digestはto_jsonb各行をid順・空delimiterで連結する前回と同じ算出法。途中の改行delimiterによる別digestを更新と誤認しない。

追加SQL・第21章等の既適用delta・古いquestion gateの再deployはしない。一般catalog1180・通常B180・基礎20+15・実戦50・総合16+4は維持。本文・コード・正答・解説を公開記録やfixtureへ転載しない。公開回帰fixtureは独立した合成値のみ。

## 残件と次作業

- 同じ文法章を継続する。5親10予測の正答・全体解説は確認したが、対象10行のchoice_explanationsはすべて空。4選択肢の理由の受入完了とは扱わない。次はその不足を保護source/gate/UI契約に照合して補強する。
- 通常トレースのコード・メッセージは16pxのまま。前回の文法ガイド/補助6問18pxと混同しない。本文/選択肢/解説の読みやすさを同章内で整える残件。
- 配列図はデスクトップでも5要素目が折り返される。番号一致は確認したが、一次元の順序が見やすい配置の受入は残る。
- 新演習の非同期読み込み中に前演習の状態図/メッセージが一時的に残る表示も観測。protected表示の切替cleanupを次回照合する。
- 残る基礎15親30予測を今回全受入したとは言わない。文法に関係する未確認の既存exam制御/div/do等も範囲を決めて受入する。再帰5章・全B180問完了も主張しない。
- 575XPゲストの再読込後保持は未確認。現在の確認用ゲスト120XPと混ぜない。既に済んだ5親全採点と補助6問を無目的に反復しない。
- 実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA43（37 in-progress / 6 verified-covered）、第22章関連度計算direct-practice-gapを維持。第2章へ自動的に進まない。

記録PR後のmain/作業branch/open PR/CI/Pagesはliveで再確認する。
