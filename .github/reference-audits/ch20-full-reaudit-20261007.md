# 第20章 企業活動 全章再監査（2026-10-07）

## 範囲と根拠
- 開始時public main `ad85fc94f36973b1910d3572fada1591fb5758da`、private main `1dd812580ede476dadf573b7b38e6fa769921260`。双方open PR 0、Pages `37602366204` success、作業開始時local mainはclean。
- live保護DBの全7教材・45関連問題を全フィールド取得。130教材1180問。
- 添付02参考PDF685〜732の全48ページ（章表紙を含む、印刷668〜714）、全21過去問・解説を目視照合。733は次章表紙。20-07はIPAの補足教材。
- IPA FEシラバス9.2印刷96〜101の企業活動、OR・IE、業務分析、会計・財務を照合。国税庁の定率法、ASBJの純資産区分、MITのLP解と頂点を一次資料で確認。
- 原著の図・文章・選択肢は転載せず、独立した企業場面・数値例・SVGを作成。

## 修正と検証
全7教材を一つのarticleへ包み、既存IPA拡張を維持。6教材の確認クイズ解説の誤対応、OR/IE導入、純資産と自己資本、資産分類、定率法、土地の説明を修正。理念とPDCA、組織・教育、ABC、LPの頂点比較・最適点が交点にならない反例、重みと期待値、損益分岐点の数量と金額、P/Lの利益段階、利益と現金、FIFOの複数払出、帳簿価額と売却損益、欠損・移動平均・四分位数・割合集計を独立例で補足。

24問のhint/説明/設問を限定修正。比較3問を本教材テーマ名の業務シナリオとして区別し、LPは一次式条件と変数を明示。問題ID・選択肢・正答index・catalog・extra・版・active・日時を維持。ユーザー履歴を変更・再採点しない。

本文・用語・カード・表を18pxへ統一、短い図ラベル16px以上、SVGは18px。狭幅グリッド一列化・表/SVGラッパー横スクロールを維持。PWA cache179を3workflowと同期。実選択関数100回で直接4/3/7/6/9/5/8、章末12unique・全7テーマ・比較保証を確認。保護validatorは7教材・45監査ID・24限定修正、不変フィールドと独立数値例を検査。

## 受入の現状（本番反映済み・画面受入は未完了）
- 非公開[PR #128](https://github.com/taiwanwan64/fe-quest-private-source/pull/128)、head `219db4ae0b78ab3af30208a7187376130ba049af`、保護CI `37604772322` success。private main `f877616b37a897e1c5b88de745047e4b6324fc88`。
- 公開[PR #338](https://github.com/taiwanwan64/fe-quest/pull/338)、head `765ab13e33b9a1150a9f5649badd311681c1f3ff`、publication `37604791709` / v35 `37604791576` success後merge。public main `33e7a4524d01e032826d9470c70f3be64b137c92`、同head Pages `37604968565` success。
- immutable差分と期待値を照合してguarded transactionを1回だけ適用。7教材・24問題を更新し、全7教材45問の52行readbackが全フィールド期待値一致。130教材1180問、対象外行・metadata・ID・選択肢・正答index・版・active・日時を維持。過去履歴の再採点なし。**適用済みDB差分を再実行しない。**
- 新規確認用ゲストで初期診断12/12・120XPから開始。20-01〜04の直接4/3/7/6問、20種類・21採点操作を通常UIで確認。各問の正解根拠と3誤答理由を表示。20-01は意図的誤答1件のhint→誤答選択肢無効化→再挑戦成功、初回3/4・75%・+37XP。他は3/3・7/7・6/6・100%。前回ゲストの進捗消去・復旧・保持は主張しない。
- 20-01〜05の教材表示は読取済み。各article1個、本文・用語・カード・表は58/66/110/45/132要素（計411）が18px。1348pxデスクトップでページ横溢れなし。20-06/07の本番教材表示は未確認。SVGラベルの静的検査は18pxだが、画像としての目視検証は未完了。
- 最後に応答した画面は20-05教材、517XP・教材4/130。20-05の演習開始/回答操作、その後のDOM読取、接続resetが各300秒でtimeout。開始/回答操作の実行結果は返らず、効果は不明。続いてlocal exec-serverもtransport disconnected。アプリの不具合と断定しない。再開時は実画面を確認してから続行する。
- 残る本番25種類は20-05の9問・20-06の5問・20-07の8問・比較3問。章末12問、再読込後の保存状態・履歴・記憶件数、画面証拠は未確認。**第20章の全45問受入完了とは呼ばず、第21章へ進む前にこの残件を完了する。**
- 第5〜20章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応43項目（37 in-progress / 6 verified-covered）は維持。
- 機械可読記録：`ch20-import-manifest-20261007.json`。記録PR後のmain/CI/Pagesはlive再確認する。

## 一次資料
- [IPA FE 9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)
- [国税庁 No.5410](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5410.htm)
- [ASBJ 純資産表示](https://www.asb-j.jp/jp/accounting_standards_system/details.html?topics_id=31)
- [MIT LPと頂点](https://courses.csail.mit.edu/6.854/19/Scribe/s12-duality/s12-duality.html)
