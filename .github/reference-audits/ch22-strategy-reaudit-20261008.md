# 第22章 合格戦略3節の再監査（2026-10-08 JST）

## 再開基準
GitHub live public main `abf8055627cafe5a333c633b9777ade0a7ecf1a7`、記録branch `record-ch21-desktop-complete-20261008` head `65f26cfc7e0e43c994a2a9e7eb4c4a0b9fd926c7`、private main `bf691b8ae0537766dc820d7e2ba824be783b5ae3`、双方open PR 0を実読。public Pages `37702618817`、publication `37702538344`、private保護CI `37699904155`はsuccess。
両repo recursive treeにAGENTS.mdなし。第21章は完了済みなのでDB適用/全問操作を反復しない。

## 参照範囲
02参考PDF物理753〜779（章扉・22-01〜03・章末6問・全解説、印刷736〜761）をページ画像で順に確認した。
03/04の表紙・導入・目次の冒頭だけも確認。03全363ページ・04全431ページを再監査した意味ではない。
現行GitHubの第22章、03文法、04gap統合監査を再読した。旧監査の完了をそのまま今回の本番受入に読み替えない。

正本：
- [IPA FE試験概要](https://www.ipa.go.jp/shiken/kubun/fe.html)
- [現行試験要綱・シラバス](https://www.ipa.go.jp/shiken/syllabus/gaiyou.html)
- [試験要綱Ver.5.6](https://www.ipa.go.jp/shiken/syllabus/rcu1hd00000141gq-att/youkou_ver5_6.pdf)：2026年10月適用、PDF19/22/24ページの構成・採点方式を確認。
- [IPA公式公開問題入口](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/index.html)

## 3節全体の照合と変更

| 節 | 既存で維持 | 不足と今回の限定修正 |
| --- | --- | --- |
| 22-01 | 100分・20問・16+4、双方の基準点、既存4ステップ | 600点は単純な正答率60％ではないこと、IRT正式名/日本語、アプリ練習結果との区別、19問評価。固定3〜10択断定を問題によって異なる表現へ。公式要綱入口。 |
| 22-02 | 文法丸暗記より処理理解、3群の学習順、トレース→実戦 | 擬似言語の初出説明・読み、公式公開問題の直接リンク |
| 22-03 | 科目A周辺知識、状況→証拠→問い、長文を捨てない | ログの初出説明、公式公開問題の直接リンク |

既存の3つの折りたたみ内だけを修正し、新規core_22教材や問題は作らない。学習本文・問題本文の転載はない。indexの3ガイド以外は完全一致、全id属性順序も一致。app/bridge/provider/catalog本体は変更しない。
戦略CSSは主要本文・カード説明・注意・summaryを18px、短い概要ラベル16px、強い数値21px。760/480pxの既存レイアウトを維持。公式リンクは下線・focus-visibleを付ける。

## 現行バンクをDBと公開metadataで再照合
読み取りのみ。新規import/delta/CAS/migrationは不要。

| pool | 問題数 | parent数 | parentあたり |
| --- | ---: | ---: | ---: |
| b_exercise | 40 | 20 | 2 |
| b_security | 45 | 15 | 3 |
| b_compound | 45 | 15 | 3 |
| b_exam_algo | 50 | 50 | 1 |

計180B問。35基礎演習は20+15であり180問を意味しない。公開base catalogの43実戦問へgap7件が合流し50問となること、unique ID・ordinal連続、総合実戦bridgeの20/16/4契約を新テストで確認。
全体130教材/1180問。読み取り時digest：question `c62e79b86ba41d03c054db09e6337bd2`、lesson `e89f8d33fa35a4d104110807dddb3543`。
問題の正答・選択肢・ID・version/active・時刻・過去履歴は今回変更しない。

## 章末6技能の対応（内容転載なし）

| 技能 | 現行対応・確認したID | 判定 |
| --- | --- | --- |
| 比較と最大値 | b_exercise_array_max_1/2等の比較・状態更新 | 既存技能対応。参考書と同じ3引数問題を収録している意味ではない |
| 累積基数変換 | b_exam_bexam_ctrl_05 | 既存直接演習 |
| 辺→隣接行列 | b_exam_bexam_mat_05 | 既存直接演習 |
| 整列済み配列マージ | b_compound_merge_sorted_1〜3 | 既存直接演習 |
| 共起件数を使う関連度計算 | 180行のcatalog/render全体と現行ガイドを確認。専用の直接演習は見つからない | direct-practice-gap。売上集計等を同技能と同一視しない |
| 長文の条件に沿った認証対策 | b_security_logs / phishing / password_spray等 | 既存ケース対応。参考書のテレワーク問題そのものの収録ではない |

35演習の全採点/全誤答理由の品質受入を今回完了したとは主張しない。関連度の専用演習不足は科目B教材再監査で扱う。

## 検査・配信
新しい `check-ch22-strategy-v377.mjs` は3ガイド・公式リンク・本文/補助文字・B metadata集計・16+4を検証。publication workflowへ追加。ローカルPASS。
SWと3 workflowのcache契約を `fe-quest-v377-182` へ同期。
PR/CI/merge/Pagesと本番確認の結果は後続確定欄に記録する。実スマホ狭幅・タッチ・縦横切替は未実施。第5〜22章のcoverageを完了にしない。IPA43項目（37 in-progress / 6 verified-covered）維持。
