# 科目B 第1章：境界値の作成と候補比較（2026-10-11）

## 照合と限定した補強

live main public 545ba3ca46f7aabf83e41e4603d94acee67590db / private 0bd634c59d2fc2ca37ef81900e8910c599c07acb、双方open PR0、前記録branch ahead0/behind1/files0、CI/Pages成功を確認して再開。

添付03の物理072/075（紙面070/073）を画像で確認。境界付近から実行前の例を作る考え方と、結果の一致/不一致を使って候補を判断する手順を照合。参考書の問題・数値・文章を転載せず、独自問題で補強した。

現行guideは境界値と内部の例を説明済み。activeアルゴリズム146行（40+45+61）の全文を取得して照合。既存の論理否定問題は境界上の結果を直接問うため、境界計算自体をmissingと数えない。入力セットの作成と、1例で一致した候補を追加入力で絞る技能を直接問う問題は不足と判断。独立補助2問を別入口へ追加する。

- 既存6問・型2問・引数2問・コメント1問は維持。
- 新規公開catalogはID/分類/順序だけ。本文・選択肢・正答・解説は非公開保護DBに置く。
- 2問とも四つの選択肢すべての理由を用意。
- guideに、不一致1件で候補を除外できることと、一致例だけでは未確認入力の正しさを保証しないことを追記。
- XP・履歴・基礎35演習の進捗へ加算しない。

## 実装と検証

新content版 b-grammar-boundaries-protected-v1-20261011 / practice grammar-boundaries-v1、cache197、補助query bgrammar-boundaries-197。本体/loader query bfinal-resume-192は維持。

private検査は境界から必要入力を生成し、独立した集合モデルで期待結果を照合。全選択肢の不足値、全候補の残存集合、各誤候補の不一致入力、全8理由、one-shot appendのguardを検査してPASS。
public synthetic検査は5modeの通常進行・誤答retry・初回集計・本文/答え漏えい拒否・通信失敗・close/route cleanupと、20方向の遅延bootstrap/grade競合を検査してPASS。

DB append baseline1191問digest74c56a7ea47cceaf71c2247dc424df2b / 130教材digest e89f8d33fa35a4d104110807dddb3543。旧行を保持して2問だけ追加するguard。現行gateを実読し、この追加にAPI変更は不要。旧gateの再deployをしない。

## 本番受入れ

この実装PR時点では未実施。CI成功・private merge・guarded append/readback・public merge・Pages成功の順に進め、本番通常UIで新2問だけを受入れる。既適用SQLを再実行しない。

文法章全skill・全Bの完了とはしない。実スマホ、他13親26予測の理由、制御5行/bridgeの理由不足、IPA43（6 verified-covered/37 in-progress・inventory incomplete）、第22章関連度gapは保持。第2章へ飛ばさない。
