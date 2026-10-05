# 第17章全体再監査 — 2026-10-06

## live再開
公開main `17a255848bd1f07c3161d944787c2955eca02cff`、非公開main `423f94465f047592b4b660e52b8f7baabc903ab1`をGitHubから取得。双方open PR 0。直前branchはmainよりmerge1件behind、ファイル差分0。公開Pages37288852090・publication37288779571、保護CI37285337927はsuccess。第16章の適用済み更新は再実行していない。

## 全章照合
全2教材と全12関連問題（直接3/5、章末比較1・章末追加3）をlive DBから取得。130教材/1180問。添付02 PDF605–622（章表紙・印刷588–604）、18ページの本文・図表・11過去問と解説を画像で確認。623は第18章表紙。添付01の抽出文字を関連語で補助検索したが一致なし（未照合ページを読了扱いしない）。
[IPA FE9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)印刷83–85頁のシステム化計画・要求分析・要件定義・調達と照合。

| 節 | 既存の内容 | 修正・補強 |
|---|---|---|
|17-01 企画と要件定義|経営/利用者/ベンダ、構想と計画、ROI、投資ポートフォリオ、プライバシーバイデザイン、機能/非機能|独立した予約業務例、ROIの利益/期間/百分率、検証可能な性能・移行要件、要求分析・調査・合意承認、BABOK/SoR/SoE/SoI/Fit to Standard。小テスト解説を設問に対応|
|17-02 調達計画・実施|RFI/RFP、提案依頼書と提案書、比較基準、CSR/グリーン/CFP|RFQと発注の区別、RFI省略もある基本順序、内外作・入札・資産/供給連鎖・契約確認、ISO14001組織認証と製品性能の区別。小テスト解説|

全12問の設問・4選択肢・正答・hint・正解根拠・選択肢別理由を個別確認。6問のhint/理由のみ修正。RFP設問の無関係な契約ヒントと汎用誤答文、章末追加2問の改訂済み選択肢と古い誤答解説のずれを解消。ID・stem・options・answer_index・catalog・source_pool・version・active・datesは維持、過去履歴再採点なし。

## 実装・検査
保護PR [#124](https://github.com/taiwanwan64/fe-quest-private-source/pull/124)は完全expected/replaceの2教材・6問差分と専用validator。公開はCSS、可読性検査、実選択関数100回の回帰検査、cache174、概念レベルの監査のみ。保護本文・設問・正答を公開repoへ追加しない。
1つのarticleに全補足を収め、本文/用語/カード/表18px、短い図ラベル16px以上、横長表は枠内スクロール。ローカル保護validator・可読性・実選択（章末12unique/全2節/比較/追加3、直接3/5）・diff検査PASS。

## 本番受入
CI・merge・DB完全期待値transaction・readback・通常UI・再読込による履歴確認は後続確定記録へ追加する。現時点では未完了として扱う。実スマホ狭幅・タッチ・横スクロール・縦横切替は未検証、coverage in-progress、IPA対応表43項目（37 in-progress/6 verified-covered）は維持する。

