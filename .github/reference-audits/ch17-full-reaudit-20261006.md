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
- 保護PR #124: head `bf8a8737a8c55fc4e3dc0e9140f92d2e63f7cb3e`、CI `37382487145` success、merge `daca2f6d65fd2de5318b487cce6102dfea58112e`。immutable差分を再取得し完全一致を確認して2教材・6問を1回適用。単一transaction内で全行の対象外/metadata保持を検査し、別SQLの全2教材12問題readbackが期待値と一致。
- 通常UIで追加用語の正式名省略を確認した追補PR [#125](https://github.com/taiwanwan64/fe-quest-private-source/pull/125): head `58f9746cd38983a08de5df79b79256de5681494c`、CI `37383431027` success、merge/private main `890bb3976f1ad0adcb9d907accf6cae1f35932f9`。17-01の2文だけにDFD/UML/DOA/BABOK/SoR/SoE/SoIの英語正式名を展開。現在DB行の完全期待値で1教材のみ1回適用し、全14行を再照合。PR124を再実行せず、全問題不変。追補の通常UI表示も確認。
- 公開PR [#330](https://github.com/taiwanwan64/fe-quest/pull/330): head `55e558f71ec011182faf877a5e3cc90bcde5afb0`、publication `37382762957` / v35 `37382763225` success、merge/配信確認main `efffaab7695acd7710e4517a0a4a2980a017163c`、Pages `37382870641` success、cache174。
- 通常UIで両教材→直接3問/5問、章末12問を完走。全12 unique IDの正解根拠と各3誤答理由を確認。章末は両テーマ・比較1・追加3を含む12uniqueで12/12・100%。延べ20問・21採点送信（意図的誤答1→再挑戦1）。17-01初回2/3・67%・再挑戦正解1、17-02初回5/5・100%。修正済みRFPヒントと汎用説明の置換、追加2問の改訂選択肢に合う理由を確認。
- 今回ブラウザは初回設定画面から始まったため、通常UIで新規確認用ゲストを開始。初回診断の12回答は第17章20問に含めない。120 XPから教材2件+100、演習+27/+50/+120で417 XP。前回ゲストの進捗を削除・復旧・保持したとは主張しない。
- 通常再読込前後で直近3履歴の全文一致（章末12/12、調達5/5、企画2/3）と417 XP、教材2/130、第17章2/2、定着1/2、バンク979問を確認。保存競合通知なし、安全機構変更なし。UI履歴の日付表示はUTCの2026-10-05、記録日はJST2026-10-06。
- 両教材132要素（77/55）の本文/用語/表/手掛かり18px、各article1個、document/viewport1348px一致を測定。表は専用overflow:autoの枠に収まり、狭幅CSS回帰検査とは区別する。再読込後の確認画像 `fequest-ch17-history-1791240004011.jpg` は公開repoに置かず保存。実スマホ狭幅・タッチ・横スクロール・縦横切替は未検証、coverage in-progress、IPA対応表43項目（37 in-progress/6 verified-covered）は維持する。


## 確定状態と次の対象
内容監査・デスクトップ12/12受入は完了。第5〜17章の実スマホ残件を保持し、次は第18章「経営戦略マネジメント」全8教材・全関連問題・章末演習。第18章は今回未監査。再開時は本記録の後続PRを含めGitHub main/branch/open PR/CI/Pagesをlive再読し、適用済み差分や全12種類の再操作を反復しない。
