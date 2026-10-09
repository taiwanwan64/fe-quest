# 科目B 文法章：制御examの照合と総合実戦cold boot修正（2026-10-09）

## 開始時点
public main `3653fd687a29b5a376250003adc659d66cb6cae4` / private source main `756f1451e114990cc59599cef4be7ed4b5c93b9b` をGitHub liveで確認。双方open PR 0、前回作業branchはmainへの差分なし、CI・Pages success。旧private app snapshotを現行sourceとは扱わない。

前回受入済み5親10予測・補助6問は無目的に全反復せず、同じ第1章の未受入exam/do/divを対象とした。全B180・全章の完了とは判定しない。

## 読み取り照合
live保護DBの制御exam5 ID（b_exam_bexam_ctrl_01〜05）の本文・コード・4択・正答・説明を読み、独立トレースで5/5一致。choice_explanationsは5件とも空。既存div/do問題があるため欠如とは判定しない。添付第4版科目B本の物理42ページ（紙面040）のwhile/do前判定・後判定の比較を画像で再確認。原文・問題本文・正答・選択肢はこの公開記録へ転記しない。

総合実戦の通常UIは50件プールから16擬似言語＋4セキュリティを選ぶため、隠し関数や状態編集で対象問題を強制しない。別QAゲストで診断12/12、120XPから20問の通常UI受入を進めた。診断と実戦の問題数を合算しない。探索中の8問ミニ模試は未提出で退出し、完了や加点とは数えない。

## 見つかった不具合と修正
5/20回答し6問目で通常再読み込みすると `v376_b_final_bridge_missing` を観測。app初期化がindex後続のprotected final bridge scriptより先にresumeを呼び、catch側もbridge lookupで二重例外になって再開画面が停止。

- PR #357: DOMContentLoaded後にUI復元。bridge不在のerror reportも安全に処理。元順序の失敗を再現する回帰テスト、失敗時metadata保持を追加。
- #357公開後は警告へ安全に戻るが、追加gap問題を含む最新版providerの非同期有効化前に旧987件catalogを検索する競合が残る。
- PR #358: activation loaderにconfigと最新版providerだけの準備待機を追加しresume hydrate前にawait。クラウド認証/同期の起動完了へ依存せず待つ。cache191、app/loader query更新、既存キャッシュ検査を揃えた。

プロフィール保存形式、問題選択、採点、保護本文、DB、gate、SQLは変更しない。永続resumeは従来どおりID/optionMap/answers/flags/index/expiry等のmetadataだけで、本文・コード・選択肢を永続化しない。

## 自動検証
追加回帰: 元bridge競合、loading/interactive/complete、5回答・問題位置・見直し印・選択肢順・残り時間、プロフィール書込みなし、bridge不在・通信失敗・順序不正、遅延config/遅延providerで旧catalogをhydrateしない、準備失敗の警告/metadata保持。Node実行とsyntax PASS。

初回PR #357 CIはキャッシュ固定検査の更新漏れでFAIL。mainへmergeする前にv35とchapter22のassertionを揃えた。検査の削除・緩和はしていない。

| PR | 最終head | publication | v35 public | Pages |
| --- | --- | --- | --- | --- |
| #357 | 153ade6038db6f514769c69d9b9444657879bc81 | 37920142525 success | 37920142494 success | 37920205597 success |
| #358 | f7d5fb531c750066f6457888aa6d69743045b822 | 37920557465 success | 37920557452 success | 37920601960 success |

実装main `765f05c6e6394534c29071018fc9aecd29f42d2c`。本番DOMでapp/loaderのquery `bfinal-resume-191` を確認。

## 本番通常UI
同一QAセッション・同一途中5回答を通常reloadで復元。6問目、5/20、約88分、120XP保持、再開成功表示を確認。SW更新に伴う追加reloadでも6問目・5回答・XP保持。profileの消去・統合・復旧や状態の直接編集は行わない。

通常UIで20unique問題位置に回答し1回提出、20/20正解（擬似言語16/16、セキュリティ4/4）、未回答0、追加240XP、合計360XP。所要時間表示15:04（修正・配信・再開検証の待機時間を含むQA時間）。全20問の提出後レビューを開き、正答・解説を確認した。

文法章の今回対象として `b_exam_bexam_ctrl_02`（整数divのwhile実行回数、Q9）、`b_exam_bexam_ctrl_05`（反復累積、Q4）を通常UIの採点・解説まで受入。関連divを使う再帰Q11・二分探索Q16も同じ20問内で正解・説明確認。制御5件のうちUI受入は2件であり、read-only独立照合5件と区別する。`ctrl_01/03/04` の通常UI、特にdo後判定 `ctrl_03` は未受入のまま。強制出題や追加模試反復をしていない。

提出後、科目Bへ戻り通常reload。360XP、A0/130、B基礎0/35、トレース0/20、総合実戦1/2、ベスト100%、最近の総合実戦1件（20/20・100%・15:04・2026-10-09）を通常UIで確認。総合実戦の合格を基礎35件の完了へ置き換えない。提出済み途中examは自動再開されず、学習一覧から履歴へ到達した。重複加点なし。

結果画像保存済み。旧570/575XPのQAプロフィールの継続/復旧/統合は今回証明していない。今回の別QAセッションは診断120＋実戦240＝360XP。

## DB不変と残件
開始時と実装修正後のread-only全行digest一致:
- 1186問: `df83aae7e41c90f929b180ffb18bfc13`
- 130教材: `e89f8d33fa35a4d104110807dddb3543`

private変更なし。既適用SQLの再実行・旧gate再deployなし。他15親30予測の選択肢理由、実スマホ狭幅/タッチ/内部横移動/縦横切替は未受入。IPA43（37 in-progress / 6 verified-covered）、inventory incomplete、第22章関連度direct-practice-gap維持。この記録でcoverage完了や教材全体完了とは言わない。
