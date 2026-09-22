# 科目B 総合実戦 mat05 復習先難易度監査 — 2026-09-22

## 目的

科目B総合実戦の誤答後に案内される復習先が、出題問題より不必要に難しくなっていないかを、新規7問追加後の50問プールで再確認する。

## 発見した不整合

`bexam_mat_05` は二次元配列の **標準** 問題。

二次元配列の既定復習先は `matrix_find`（応用）だが、以前の監査で標準問題 `bexam_mat_01` / `bexam_mat_02` については、標準の `matrix_sum` へ送る補正を入れていた。

新規追加された `bexam_mat_05` はその補正対象に含まれておらず、標準問題の誤答から応用演習へ難化する回帰が生じていた。

## v429 修正

- `bexam_mat_05` の復習先を `matrix_sum` に固定
- `matrix_sum` のlevelが標準であることをCIで確認
- `bexam_mat_05` 自身も標準・二次元配列であることをCIで確認

## 維持する仕様

- 問題内容・採点・問題選択は変更なし
- 既存の `bexam_mat_01` / `bexam_mat_02` 修正は維持
- tree/listの既知例外は変更なし
- protected question bank変更なし
- active protected question total: 1180
- `b_exam_algo`: 50
- profile schema migrationなし

## PWA

- cache contract: `fe-quest-v377-111`

## 結論

新規7問追加後の復習導線に1件だけ、既存の難易度方針から外れる取り残しがあった。v429で `bexam_mat_05` を同難易度の `matrix_sum` へ揃えた。
