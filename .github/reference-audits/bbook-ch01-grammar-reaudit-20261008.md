# 03 科目B参考書・第1部第1章「文法」再監査 — 2026-10-08

## Live起点と範囲

- public main: `ca6e598854a322289b3bac84496b53302960d79f`
- 前作業branch: `record-ch22-production-acceptance-20261008` head `c059a68a2b5c50ff0e71d74121319879a5e01daf`。mainとtree一致。
- private main: `bf691b8ae0537766dc820d7e2ba824be783b5ae3`
- 双方open PR 0。public Pages `37704694106`、publication `37704630902`、private保護CI `37699904155` successを実読。
- 03 PDFの第1部第1章全体、印刷026〜095、物理028〜097（70ページ）を画像で順に確認。直前の物理027/印刷025の導入も確認。初期のページoffset推定は画像で訂正した。
- 型・代入・条件・繰返し・トレース・関数・有効範囲・解法・補足構文、確認13項目、章末6問題と全解説まで照合。
- IPA現行一覧から用語/言語Ver.5.1を確認。別紙2（物理6〜7）のif/while/do/for、演算子、未定義を照合。整数の小数処理を普遍的な暗黙規則として断定しない。
- 公式: https://www.ipa.go.jp/shiken/syllabus/gaiyou.html
- 言語定義: https://www.ipa.go.jp/shiken/syllabus/doe3um0000002djj-att/shiken_yougo_ver5_1.pdf
- 2026-09-20監査の完了文だけで判断せず、現行index/CSS/appとprivate DBの基礎20演習・40予測問題を再読した。04参考書本文は今回対象外。

## 概念対応と反映

既存文法ガイド1個・8節を改善。周辺の練習法/配列/二次元/構造体ガイドは増築しない。例・数値・文章・表は独自に構成し、参考書の問題/図/文章を転載しない。

| 章内概念 | 再監査時 | 反映 |
| --- | --- | --- |
| 型・宣言・初期化・代入・未定義 | thin | 未宣言入力例を除去、自己代入と途中値、文字列の0/1字も説明 |
| 算術・比較・剰余 | thin | 演算ごとの例、剰余の小値/0、境界を含む比較、整数処理の指定確認 |
| and/or/not、コメント、文字列連結 | missing/thin | 真偽表、否定、注記は非実行、数値加算との区別 |
| if/elseif/else | thin | 初期値付き例、最初の真だけ、既に偽の前提、独立ifとの違い |
| while/do、無限ループ | thin | 同じ初期値で0回/1回を数値比較、break等の出口との区別 |
| forの順序・境界・増減 | thin | 増加の全途中値と終了判定時値、減少例、境界不到達 |
| 関数・引数・return | thin | 位置対応、入力→途中計算→戻り値、宣言と呼出し、return後非実行 |
| 局所/大域・同名・呼出し間 | missing/thin | 同名でも別の箱、局所出力と大域出力、共有変更と呼出し別列 |
| 紙トレース、候補代入と境界値 | thin | 実表、変更省略≠未定義、制御の追跡、1例合致だけで確定しない |
| 略語・ptrの意味 | thin | 英語由来、ptrを「常に次の添字」と一般化しない |
| 本文・表・コードの文字と列数 | thin | 全主要文字18px、名前表2列化、2つの長表だけ名付きキーボード横スクロール |

## 保護問題と変更境界

- DB基礎40行のstem/options/answer_index/hint/explanation/choice_explanations/extra.render/traceSegmentをread-onlyで確認。20親演習のコードと予測対象を照合した。これは本番40問の採点受入ではない。
- 累積for・偶数mod・最大値・反転・探索・ビットAND・ソート・GCD・二重ループ・二次元・連結・オブジェクト・queue/stack・再帰・木は現行基礎演習に対応がある。
- **基礎20演習/40予測にdo、同名局所/大域、論理or/not、文字列連結、整数/実数除算の区別の直接演習がない。** ガイド掲載と直接練習の充足を同一視しない。他pool全体の有無は今回未確定。章全skillの完了を主張しない。
- 今回はpublicガイド/同CSS、SW cache184とCSS URL query、関連CI contract、新検査、監査記録だけ変更。app JavaScript、保護provider/catalog、private repo、DB、既存問題ID/選択肢/正答/履歴は変更しない。
- DB起点130教材1180問。question digest `c62e79b86ba41d03c054db09e6337bd2`、lesson digest `e89f8d33fa35a4d104110807dddb3543`。
- 第21章の適用済みDB差分を再実行しない。

## 検証と残件

- 独自例の独立計算、ガイド8節/唯一性、18px、表caption/header、横スクロールfocus、CSS URL/SW契約を新CIで確認。
- indexの既存ガイド外はCSS URL query以外一致。既存ID列不変。app本体不変、Chapter22契約・A/B cold boot回帰検査pass。
- 本番/CI/DB最終readbackは実施後に追記。
- 現在のブラウザーは初回設定で、前回第21章ゲストを持っていない。今回の別確認用ゲストを、以前の1247XP・履歴の引継ぎと主張しない。
- 物理スマートフォン狭幅・タッチ・横スクロール・縦横切替は未検証。ガイド内容改善、静的readability、デスクトップ受入と、章全体の完了を区別する。
- coverage in-progress、IPA43（37 in-progress / 6 verified-covered）維持。関連度計算の前回direct-practice-gapも残す。
- 次の章単位作業は、この文法章の直接演習不足を全Bpoolのlive metadata/保護本文と照合し、重複しない保護問題/provider/catalog契約を設計・受入する。第2章へ自動的に飛ばさない。

## 本番受入 — 2026-10-08 UTC

- 実装PR #347、head `b835cf4183e0e32270c8ee0ba175b851820ddbec`。publication `37733206164` / v35 `37733206041` successを確認してマージ。
- 配信確認main `c85bede4de1689eff69c37aac64f9ac25f37094a`、Pages `37733300602` success。cache `fe-quest-v377-184`、文法CSS query `?v=bgrammar-184`。
- 本番通常再読込後に、学習→科目B→トレース一覧の既存文法ガイド1個を開き、全8節・9表を表示確認。本文/カード/コード/表/注記/summary/captionの216要素が全て18px。
- 1363px viewport / document scrollWidth1348、ガイド幅906px、各表枠842px・scrollWidth842pxでデスクトップ横溢れなし。2つの長表は名前付きregion・tabindex0で、紙トレース表のクリック後focusも確認した。狭幅で実際に横スクロールしたとは主張しない。
- while/doの同初期値比較、for全途中値、同名局所/大域、紙トレース表を画面画像で目視した。周辺UIと120XPの見えるwhile/do確認画像を保存。保護教材の画像/問題本文をpublic repoへ置かない。
- 既存のブラウザーは初回設定状態だったので、別の確認用ゲストで初回診断12/12→計画確認を通常UIで完了。診断由来120XP、A0/130、B0/35を再読込後に確認。以前の第21章1247XP/4履歴の継続保持は今回未確認で、消去・復旧・統合をしていない。
- 40予測問題の本番採点は今回行っていない。起点の静的照合と、ガイド受入を区別する。
- 取得できた本番errorログにFE QUEST由来エラーなし（ブラウザー拡張metadataエラーは対象外）。
- DB最終readback130/1180、question digest `c62e79b86ba41d03c054db09e6337bd2`、lesson digest `e89f8d33fa35a4d104110807dddb3543`。起点と完全一致、DB mutationなし。
- **ガイド内容改善・静的readability・デスクトップ表示受入は完了。章全skill/直接演習/40問採点/実スマホは未完了。** 次チャットはまずlive GitHubを確認し、上記文法章直接演習不足を全Bpoolへ照合する。
