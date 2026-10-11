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

実装PR #372（head1487ca4251ab7eca203fab6863fc2c2171923381）のpublication38096746203 / v3538096746195はsuccess。公開merge11a773f2efc057ad23577180c8d0035a0eda4b8eのPages38096836807もsuccess。
private #140（headc265ea4b8951f2b097408d84aa6d5c19462ef6ca）のsupplement38096742128 / protected38096742134はsuccess、source15cb21888e0e603a2a6ffcb4ce12a15dbe97627a。guarded append1回、全2行canonical readback一致。1193問digest da5a38a70699a01214deb9bee8131aa2、旧1191問/130教材digestはbaselineを保持、UI後も一致。source/version/count2/payload SHAのmanifestを記録済み。private記録 #141はCI38096923442 / 38096923437 success後mergeし、main218154148e657090eb806319e9db575487216127。既適用INSERT/provenance/理由SQLは再実行しない。

今回もtab1 about:blankから初回設定。前回QAゲストの継続証明なし、データ消去/リセット/統合なし。新QA必須診断12/12→120XPから通常導線で新2unique問題・3採点（第1問誤答→再回答、第2問初回正解）・1結果、未回答close1回を確認。全2正答/本文/説明/8理由、ヒント・誤答のみ無効化・正答全無効化、初回正解1/2、結果focus/表示消去、本文/code/options/reasons18px・見出し19px、desktop1348px横溢れなし。通常reload後120XP、A0/130・B0/35・trace0/20・sec0/15・short0/5・final0/2、通常履歴空を保持。過去プロフィール継続保証とはしない。

実装後のrecursive tree差分は予定した9fileのみ。本体/trace/final bridge/provider/loader/旧4catalog/CSSはblob一致。一般catalog1180/通常B180/実戦50候補/基礎20+15/総合16+4/guide8節10表は維持。結果画像保存済み。新2問はdesktop受入完了。実スマホは未受入。

文法章全skill・全Bの完了とはしない。実スマホ、他13親26予測の理由、制御5行/bridgeの理由不足、IPA43（6 verified-covered/37 in-progress・inventory incomplete）、第22章関連度gapは保持。第2章へ飛ばさない。
