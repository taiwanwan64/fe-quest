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

## 受入の現状
実装・保護差分のローカル検査済み。PR CI・merge・DB適用・本番全45問と保存状態はまだ未確認。確認後にこの段落を確定実績へ置き換える。実スマホ受入は未確認。coverage in-progress、IPA対応43項目（37 in-progress / 6 verified-covered）は維持。

## 一次資料
- [IPA FE 9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)
- [国税庁 No.5410](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5410.htm)
- [ASBJ 純資産表示](https://www.asb-j.jp/jp/accounting_standards_system/details.html?topics_id=31)
- [MIT LPと頂点](https://courses.csail.mit.edu/6.854/19/Scribe/s12-duality/s12-duality.html)
