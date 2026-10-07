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

## 受入の現状（内容・デスクトップ確認完了、実スマホは未確認）

- 非公開[PR #128](https://github.com/taiwanwan64/fe-quest-private-source/pull/128)、head `219db4ae0b78ab3af30208a7187376130ba049af`、保護CI `37604772322` success。private main `f877616b37a897e1c5b88de745047e4b6324fc88`。
- 公開[PR #338](https://github.com/taiwanwan64/fe-quest/pull/338)、head `765ab13e33b9a1150a9f5649badd311681c1f3ff`、publication `37604791709` / v35 `37604791576` success後merge。記録[PR #339](https://github.com/taiwanwan64/fe-quest/pull/339)後の再開時main `0e37897d2be0613c7cf47fd9472d394f43ca536a`、Pages `37608813823` success、双方open PR 0。実装branchとmainの差分は記録3ファイルだけで実装一致。
- immutable差分と期待値を照合したguarded transactionは前回1回だけ適用。7教材・24問題、全52行readback期待値一致。130教材1180問、対象外行・metadata・ID・選択肢・正答index・版・active・日時を維持、過去履歴再採点なし。今回は現行DBを読み取って通常UI確認を継続し、**DB差分を再実行していない。**
- 前回ゲストで20-01〜04の4/3/7/6問、20種類・21操作を確認。20-01は意図的誤答1件、hint・誤答無効化・再挑戦成功、初回3/4・75%・+37XP。他は100%。最後は517XP・教材4/130。20-05開始以降のCUAとlocal transport障害で中断し、その未応答操作の効果は不明のまま履歴として保持する。
- 今回は別の新規ゲストで初期診断12/12・120XPから開始。20-05の9問・20-06の5問・20-07の8問は全初回正解。章末12問×3回を12/12・100%で完走し、各回12unique・全7テーマ、比較3種類を全確認。通常UIで各問の正解根拠・3誤答理由・次問・結果を確認。今回58問・58操作・39種類、前回との累計**全45種類・78問・79操作**。IDと章末構成はmanifestに記録。
- 前回20-01〜05はarticle各1個、58/66/110/45/132要素（計411）18px、1348px desktop横溢れなし。今回20-06/07はp/li/td/thの41/49要素18px、article各1個、viewport1363px・document scrollWidth1348pxで横溢れなし。selectorが異なるため前回要素数へ合算しない。20-03の線形計画法・20-04の損益分岐点SVGを画面画像で目視し、軸・凡例・数値を確認。
- 今回ゲストは850XP・教材3/130、第20章3/7・定着1/7。初期診断120＋教材150＋直接220＋章末360。別ゲストの前回517XP・4/130から進捗が減った意味ではない。過去ゲストの進捗消去・復旧・統合を主張しない。
- 通常再読込前後の直近4履歴（章末12/12×3、20-07 8/8、各100%・2026-10-07）が文字列一致、850XP・教材3/130保持。再読込後「進捗・設定の詳細」で記憶39件（安定39・そろそろ0・要復習0）を確認。周辺UI込みの履歴画像証拠 `fequest-ch20-history-1791373791194.jpg` を保存。教材・問題・解説の画像は公開GitHubへ置かない。
- 第20章の内容・デスクトップ受入完了。第5〜20章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応43項目（37 in-progress / 6 verified-covered）を維持。次の内容監査は第21章「法務」全6教材・全関連問題・章末演習。
- 機械可読記録：`ch20-import-manifest-20261007.json`。今回の完了記録PR後のmain/CI/Pagesはlive再確認する。

## 一次資料
- [IPA FE 9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)
- [国税庁 No.5410](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5410.htm)
- [ASBJ 純資産表示](https://www.asb-j.jp/jp/accounting_standards_system/details.html?topics_id=31)
- [MIT LPと頂点](https://courses.csail.mit.edu/6.854/19/Scribe/s12-duality/s12-duality.html)
