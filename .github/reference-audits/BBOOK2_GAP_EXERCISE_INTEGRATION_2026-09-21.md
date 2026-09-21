# 科目B 予想＋過去問題集 — thin / missing 統合演習監査（2026-09-21）

## 目的

『科目B 予想＋過去問題集』全章監査で抽出した thin / missing 項目について、live protected B問題プールを再照合し、「解法ガイドだけで十分か」「直接演習も必要か」を判定した。

原著の問題文・図・選択肢・数値設定は転載・翻案せず、出題技能だけを抽出し、追加問題はFE QUEST独自のデータ・設定で作成した。

## live再照合

再照合前:
- b_exercise: 40
- b_compound: 45
- b_exam_algo: 43
- b_security: 45
- active total: 1173

単純なキーワード検索だけでは見落としがあったため、catalog、render title/context、擬似コードまで確認した。

### covered と判断したもの

- 後置記法（逆ポーランド記法）
  - b_compound_postfix_stack_1〜3
  - b_exam_bexam_sq_01
  - b_exam_bexam_sq_04
- 二分探索、挿入ソート、幅優先／深さ優先探索なども既存問題で直接演習あり

後置記法は既存問題が十分なため、追加しない。

## 直接演習を追加した7技能

1. 循環キュー
   - head / tail / count と回り込みを同時に追う
2. ゲーム木／ミニマックス
   - 葉からMIN/MAXを交互に評価する
3. 固定ビット幅のパッキング
   - シフトとORで上位／下位フィールドを合成する
4. クイックソートのpartition
   - pivotを基準に1回の分割処理の途中状態を追う
5. 数式 → 擬似言語
   - Σの1項をループ内の累積式へ対応させる
6. 辺リスト → 隣接行列
   - 無向辺を左右対称の2セルへ反映する
7. 累積基数変換
   - result × base + digit を左から反復する

## 追加後のprotected pool

- b_exercise: 40
- b_compound: 45
- b_exam_algo: 50
- b_security: 45
- active total: 1180

追加は b_exam_algo のみ。既存問題の削除・置換は行っていない。

## 公開カタログ設計

既存の `question-catalog-v376.json` は過去のprovider互換性を維持するため変更しない。

新規:
- `assets/question-catalog-b-gap-v1.json`
- 7件すべて公開されるのはID / domain / format / level / parentId等の安全なメタデータのみ
- 問題文・選択肢・正答・解説はprivate bankにのみ保持

最新providerのみ、この拡張カタログを追加マージする。

## pre-submit leak

7件すべてについて:
- optionsは4択
- answer_indexは0〜3
- renderContextにanswer / answerIndex / explanation / choiceExplanations / options等を含めない
- answer/explanationはsubmit後のみgateから返る

SQL検証で new_rows_valid = 7 を確認した。

## バージョン

- protected content_version: `v376-protected-b-gap-v1-20260921`
- public catalog: `b-gap-catalog-v1`
- latest provider: `v376-provider-33-ipa92-v1-v35-bgap1`
- merged catalog total: 1180
- bExamAlgo: 50
- PWA cache: `fe-quest-v377-105`
