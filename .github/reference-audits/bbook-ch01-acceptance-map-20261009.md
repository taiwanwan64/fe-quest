# 文法章・教材と演習の受入対応表（2026-10-09）

## Live起点と今回の範囲

public main `d82a57461652cf63339749a42cb6c8bdcde66f2c`、private main `756f1451e114990cc59599cef4be7ed4b5c93b9b`。双方open PR 0。前作業branch `record-b-control3-acceptance-20261009` はahead0/behind1/files0。#360 publication `37922957802`、main Pages `37923053097` success。private最新の保護CI `37853336515` / `37853336462` success（PR headに対する実行でありmain SHAの新たな実行とは扱わない）。双方recursive treeにAGENTS.mdなし。

pinned mainのindex.html内の文法guide・専用6問catalog・補助UI・総合実戦bridge、現行の監査記録を実読。DBの基礎40予測・補助6問・制御exam5問のcatalog/render/choice_explanations計51行をread-onlyで再確認した。追加の構文探索はactiveなb_exercise40＋b_compound45＋b_exam_algo56＝141行を対象とする。これはsecurity45を含む全B186行の再監査ではない。構文検索のAND一致にはビット演算も入るため、文字一致だけで論理andのcoverageを確定しない。

添付03第4版の物理028、067〜080（紙面026、065〜078）を画像で再読。特に紙面074の確認13項目、境界値、候補代入、コメント/文字列連結の補足を現在guideへ対応づけた。前回全70ページ監査を継承するが、今回全章をもう一度読んだとは主張しない。04全章の新規監査なし。下表は一般的な技能の整理であり、参考書の設問・解説・コードを転載しない。

今回は既存受入の対応づけだけ。新規の本番採点・ブラウザー操作・XP加算・DB mutation・教材/アプリ変更なし。

## 教材と受入の対応

guide番号は現行「文法早見表」内の8節。受入済みはリンクした通常UI記録の範囲に限定する。「保留」は問題がないという意味ではなく、今回確認した記録から独立した技能の受入を確定できないという意味。

| 技能 | guide | 対応する演習・受入証拠 | 判定と具体的な残件 |
| --- | --- | --- | --- |
| 型・宣言・初期化・未定義 | 1 | 補助concat/division/logicalで型を使用。loop_sum等で初期値・代入を追跡 | 初期化/自己代入のトレースは受入済み。5型の識別と未定義≠0/false/空文字を直接問う技能は保留。今回51行に独立した受入証拠なし。全Bでの欠如とは断定しない |
| 算術・比較・mod・整数/実数除算 | 2 | count_even、gcd_euclid、補助division、ctrl_02 | 対応する計算・採点・全体説明は受入済み。補助divisionと基礎10予測は4択理由も受入済み。ctrl_02の4択理由は空 |
| 論理and/or/not | 2 | 補助logical_orはorとandの比較、logical_notはandで作る区間の否定 | 6問受入記録に含まれる。andも直接存在するため新たな欠如扱いにしない。ビットAND/ORを代用して数えない |
| if/elseif/else、最初の真、独立ifとの違い | 3 | count_even/ctrl_01でif、既存binary_search_bでelseif | ifと偶奇分岐は受入済み。elseifの次候補はbinary_search_bの2予測。複数条件が同時に真になるif列・独立ifとの比較はguide説明済み、独立した採点受入は保留 |
| while/do、初回偽、終了判定 | 4 | 補助do_boundary、gcd_euclid、ctrl_02/03 | 0回/1回と複数回の後判定をそれぞれ受入済み。guideと補助だけでctrl_03受入を代用しない。無限ループの検出は説明のみで独立受入保留 |
| forの順序・境界・増減 | 5 | loop_sum/count_even/nested_loop、ctrl_01/05。既存array_reverseは減少for | 増加・累積・入れ子は受入済み。減少forはarray_reverseの2予測が次候補。増減幅で境界に届かない例はguide掲載のみ |
| トレースの制御行・省略セル | 7 | 既存5親10予測と最終区間を受入。guideに省略記号と条件の表 | 状態/区間/終了までのUI受入済み。5つの制御命令の意味を学習者が自力説明できるという学習到達判定はしていない |
| 関数の引数・return・呼出し/戻り | 6 | recursionの2予測、補助scope。guideは複数引数の位置対応 | 呼出しと戻り、呼出し別状態は受入済み。複数引数の順序・return後の行非実行を直接問う独立受入は保留 |
| 関数と手続、戻り値なし | 6 | 既存object_counter/tree_dfsには手続。guideに違い | 今回の5親/制御5/補助6の受入だけで手続の技能を完了扱いしない。既存問題の目的はオブジェクト/木でもあるため、同章の不足として直ちに全採点しない |
| 局所/大域・同名・呼出し別初期化 | 6 | 補助scopeで同名変数と2呼出し、recursionで呼出し別状態 | 対象の通常UI採点・4択理由受入済み。大域共有を別手続が変更するケースはguide説明のみ、独立受入保留 |
| 空欄候補へ代入する解法 | 7 | guideに候補確認と1例だけで確定しない注意。compound/examに空欄補充形式あり | 空欄形式の存在と、この章の解法手順の受入を区別。候補を代入して排除する一連の技能は保留。全poolの採点完了は主張しない |
| 実行例・境界値・小数処理 | 2/5/7 | 補助division/do_boundary/logical_not、guideに境目と内側の例 | 指定された商/余り、初回偽、上限境界の計算は受入済み。学習者が境界の前後・内部の試験値を自ら作る技能は保留 |
| コメント・文字列連結・解く手順 | 2/7 | 補助concatは連結と元変数変更、scopeのコードに行末コメント | 連結は受入済み。コメントは掲載/使用だけで独立した理解問題の受入とは数えない。解法の説明を読み、出力を予測して候補を排除する総合手順は保留 |

breakは制御exam ctrl_04の通常UIで最内側の繰返しから抜ける動作を受入済み。ただしguide4のbreak説明は短い一般注記で、入れ子でどこへ戻るかの説明図/例は薄い。これは問題欠如ではなくguideの説明補強候補。略語はguide8に掲載済みであり、名前だけから動作を断定しない注意もある。略語暗記を章完了の必須採点へ勝手に追加しない。

## 既存受入の証拠と計数

| 対象 | ID範囲 | 通常UIで確定した範囲 | 参照 |
| --- | --- | --- | --- |
| guide1個・8節/9表 | 現行indexのb-grammar-v404 | 18px、desktop表示、表のfocus。実狭幅の内部横移動は未受入 | [文法再監査](bbook-ch01-grammar-reaudit-20261008.md) |
| 補助6問 | b_exam_bgrammar_do_boundary/scope/logical_or/logical_not/concat/division | 全6問の正答根拠・4択理由。意図的誤答/再挑戦。XP/履歴へ加算しない | [補助6問](bbook-ch01-direct-practice-20261008.md) |
| 基礎5親10予測 | loop_sum/count_even/nested_loop/gcd_euclid/recursion、各_1/_2 | 全10予測・5完了、4択理由40件、18px/表示消去/配列番号 | [既存トレース](bbook-ch01-existing-trace-acceptance-20261008.md)・[理由と表示](bbook-ch01-choice-reasons-20261009.md) |
| 制御exam5問 | b_exam_bexam_ctrl_01〜05 | 通常総合実戦で全5件の採点と全体説明 | [ctrl_02/05](bbook-ch01-control-final-resume-20261009.md)・[ctrl_01/03/04](bbook-ch01-control3-acceptance-20261009.md) |

3群の対象は6＋10＋5＝21問題IDで重複しない。これは文法の全skill数・章完了率・全Bの受入率を示さない。別ゲストの受入記録を同じプロフィールへまとめない。最新の総合実戦QAゲスト600XP/履歴2件は#360で再読込受入済み、今回再検査したとは言わない。

live 51行の理由は、補助6＋基礎10＝16行で各4件、制御5＋他基礎30＝35行は空。基礎の残る15親30予測には探索・ソート・木等も含まれるため、全30行を文法の必須残件に一括指定しない。

## 理由不足の契約と次作業

総合実戦の現行 assets/protected-b-final-bridge-v376.js のgradeSessionはcorrect/answerIndex/explanation/postSubmitを返し、choiceExplanationsを引き継がない。appのrenderBFinalResultも全体説明の表示である。したがって制御5行に理由をDBへ入れるだけでは利用者画面まで届かない。制御の理由補強を行う際はprivate source/guarded SQL・gate回答後payload・final bridge・result表示・失敗/blank/再開/XP契約をまとめて検査する。既存基礎の理由表示helperを変更しただけで実戦の不足が解決するとは判断しない。

次の小さな受入単位は**既存array_reverseの2予測（減少for）＋binary_search_bの2予測（elseif）**。今回liveで両親のコードと各2予測の存在、4行の理由が空であることを確認した。この4行の保護本文/正答/解説を独立トレースし、4択理由を補強する必要を判断してから、通常UIで対象4予測のみ受入する。二分探索アルゴリズム全体の章完了とは扱わない。追加新問を作る前に既存4行を利用する。

続く候補は型/未定義、複数引数、コメント、境界テスト作成・候補排除、guideの入れ子break説明。これらは「未受入/薄い説明」の候補であり、全Bpoolに存在しないと確定した項目ではない。新規追加を決める場合は該当pool本文を再照合し、問題使用と独立技能の出題を区別する。

受入済み補助6・基礎5親・制御5件を無目的に全反復しない。第2章へ自動的に移らない。実スマホ狭幅/タッチ/内部横スクロール/縦横切替は未受入。coverage in-progress、IPA43登録（37 in-progress / 6 verified-covered、inventory incomplete）、第22章関連度計算direct-practice-gapを維持。

## 不変確認

read-only最終照合：1186問digest `df83aae7e41c90f929b180ffb18bfc13`、130教材digest `e89f8d33fa35a4d104110807dddb3543`。前回と一致。既適用SQL・理由SQL再実行、旧gate再deployなし。private main不変。cache191・公開実装は#357/#358のまま。変更は本対応表と引き継ぎだけ。記録PR後のmain/作業branch/open PR/CI/Pagesはliveで確認する。
