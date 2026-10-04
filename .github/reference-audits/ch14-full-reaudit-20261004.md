# 第14章 全体再監査（2026-10-04）

## 開始時のGitHub状態

- 公開main `a12313b25a5de31c9518b1b3d6b81aae078c9173`、Pages `37193401888` success。
- 非公開main `dc2c54a9072c047034bab63f45f863765af0a678`、protected CI `37192259297` success。
- 双方open PR 0。前回作業ブランチ `audit-ch13-ui-evidence-20261004` / 公開PR #317 はマージ済み。
- 今回の作業ブランチ `audit-ch14-reaudit-20261004`。GitHubの現在SHAとlive protected DBを起点に確認。

## 資料と全章の確認範囲

添付参考資料02のPDF 521〜552ページ（書籍503〜534ページ、32ページ）を画像化し、14-01〜14-04の本文・色付き強調・図表・過去問を目視確認。第15章のページは第14章の確認数に含めない。FE QUEST側はIPAの補足領域も含む全10教材・46問を確認した。

| 教材ID | 領域 |
| --- | --- |
| core_14_01 | プロジェクトマネジメント概要 |
| core_14_02 | スコープ・WBS |
| core_14_03 | 資源・工数 |
| core_14_04 | 日程・クリティカルパス |
| core_14_05 | コスト・EVM・見積り |
| core_14_06 | リスク |
| core_14_07 | 統合・変更 |
| core_14_08 | ステークホルダ・コミュニケーション |
| core_14_09 | 品質 |
| core_14_10 | 調達 |

一次資料は[IPAシラバス9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)、[NSF EVM Gold Card](https://www.nsf.gov/od/ori/evm-gold-card)、[PMI PMBOK](https://www.pmi.org/standards/pmbok)、[PMI Scheduling 101](https://www.pmi.org/learning/library/schedule-101-basic-best-practices-6701)、[QSMのPutnam本人による説明](https://www.qsm.com/blog/2016/roots-run-deep-journey-software-application-estimation-and-risk-management)を参照。教材文・図は転載せず、独自に構成した。

## 修正内容

- トレンド図を数値と軸が一致するSVGへ変更。同じ時点の上下比較と同じ進捗の左右比較、費用消化率との違いを説明。
- 工数・期間・人数、工数配分で重みを付ける進捗率、日程短縮後の最長経路再計算、EVM・FPの計算、欠陥密度、契約方式の費用負担を具体化。
- PMBOKと試験の10管理分野、5プロセス群、CCB・RAM/RACI・PDM依存関係、憲章・基準・等級・検収の初出説明を補足。リスクの脅威・機会と移転後の監視を明確化。
- 5教材の小確認問題の解説、15問のヒント・解説・誤答理由を設問に合わせて訂正。全問題の本文・選択肢・正解位置を維持。
- 全教材本文と表・説明カードは18px、短い補助ラベル16px。SVGは固定サイズと専用スクロールで文字縮小を防ぎ、広い表の横スクロールと狭幅のカード積み重ねを維持。

## protected更新とDB照合

- private [PR #119](https://github.com/taiwanwan64/fe-quest-private-source/pull/119) merged。head `579774387d42ba9d7dec55d5acf9d78955f23567`、merge `369594c2d78fdde98565501d251371cbdf408b5a`、protected CI [37194382890](https://github.com/taiwanwan64/fe-quest-private-source/actions/runs/37194382890) success。
- private [PR #120](https://github.com/taiwanwan64/fe-quest-private-source/pull/120) merged。head `4598efbe09d7a1b8a99463eecd444e310f36bfd5`、merge/main `51e01b500fc323f7ec1bdda76f9263fc47aebdbe`、protected CI [37195243074](https://github.com/taiwanwan64/fe-quest-private-source/actions/runs/37195243074) success。

最初のguarded transactionで10教材・15問、追補で14-08の1教材を更新。追補は残っていたリスクの旧定義と重複1文を修正した。両transactionで更新前の対象フィールド一致、更新件数、無関係行の全行ダイジェストを検査した。問題本文・選択肢・正解index・ID・分類・版・activeを維持。教材topicの変更は14-02〜14-06の小確認解説5件だけで、それ以外のtopic metadataは維持。

反映後の全10教材・46問を再取得し、変更フィールドと対象外のフィールドがすべて期待値に一致。active lesson 130 / active question 1180を維持。本文・問題データは非公開側に保持。source commitとcontent_versionの対応は `ch14-import-manifest-20261004.json` に記録した。

## 公開実装・本番配信

公開 [PR #318](https://github.com/taiwanwan64/fe-quest/pull/318) merged。head `23c31c15b30fb76ce6c4f95986a99a27c0b5eb8e`、merge `387afd8c37386995be570233f70aab58d398f3d8`。

- publication CI [37194486028](https://github.com/taiwanwan64/fe-quest/actions/runs/37194486028) success。
- v35 CI [37194486004](https://github.com/taiwanwan64/fe-quest/actions/runs/37194486004) success。
- Pages [37194543958](https://github.com/taiwanwan64/fe-quest/actions/runs/37194543958) success。
- PWA cache `fe-quest-v377-168`。readability検査・cache契約を同期。

## 本番Chrome desktopでの確認

第13章で作成した検証用ゲストを使用し、14章の開始時は教材0/10・定着0/10だった。全10教材の読込・修正文章、本文/表のcomputed font-size 18px、SVGの460×300px・文字16pxを確認。日程図を実画面で目視し、軸・点・予定線・実績線と説明の対応を確認した。追補後に再読込し、14-08の最新リスク定義も確認した。

| 演習 | 問数 | 初回正解 | 意図的誤答・再回答 |
| --- | ---: | ---: | --- |
| 14-01 | 4 | 4 | なし |
| 14-02 | 4 | 4 | なし |
| 14-03 | 3 | 3 | なし |
| 14-04 | 6 | 6 | なし |
| 14-05 | 5 | 5 | なし |
| 14-06 | 3 | 2 | 1問を誤答し、ヒント後に正解 |
| 14-07 | 5 | 5 | なし |
| 14-08 | 4 | 4 | なし |
| 14-09 | 4 | 4 | なし |
| 14-10 | 4 | 4 | なし |
| 第14章・章末確認 1〜3回目 | 36 | 36 | 各回12問・100% |
| 合計 | 78 | 77 | 再回答を含む79送信 |

テーマ演習42問と比較問題を含む章確認36問を完了。ランダム出題の比較問題4問を全て確認するため章確認を3回実施した。確認済み46 ID集合と、反映後live DBの14章46 ID集合が完全一致（未確認0）。全IDの正解判定、正解の根拠・他3選択肢の解説表示、次問/結果遷移を確認。14-06の修正済みヒント、選択誤答の無効化、再挑戦正解、初回正解率67%・初回正解2/不正解1/再挑戦正解1の集計を確認した。

本番UIの教材/問題の読込完了を待ち、操作後の状態を取得して確認。再読込直後や画面遷移中の操作が進まない場合は、現画面を取得してから操作し直し、完了まで確認した。未解決の読込・採点・遷移エラーは残っていない。

確認済みID（本文・選択肢・正答は公開しない）:

- `challenge_043`
- `challenge_044`
- `challenge_045`
- `challenge_046`
- `challenge_cmp_14_01`
- `challenge_cmp_14_02`
- `challenge_cmp_14_03`
- `challenge_cmp_14_06`
- `challenge_v92_14_07`
- `challenge_v92_14_08`
- `challenge_v92_14_09`
- `challenge_v92_14_10`
- `coreq_14_01_1`
- `coreq_14_01_2`
- `coreq_14_01_3`
- `coreq_14_02_1`
- `coreq_14_02_2`
- `coreq_14_02_3`
- `coreq_14_03_1`
- `coreq_14_03_2`
- `coreq_14_03_3`
- `coreq_14_04_1`
- `coreq_14_04_2`
- `coreq_14_04_3`
- `coreq_14_05_1`
- `coreq_14_05_2`
- `coreq_14_05_3`
- `coreq_14_06_1`
- `coreq_14_06_2`
- `coreq_14_06_3`
- `coreq_14_07_1`
- `coreq_14_07_2`
- `coreq_14_07_3`
- `coreq_14_08_1`
- `coreq_14_08_2`
- `coreq_14_08_3`
- `coreq_14_09_1`
- `coreq_14_09_2`
- `coreq_14_09_3`
- `coreq_14_10_1`
- `coreq_14_10_2`
- `coreq_14_10_3`
- `ipa92_a_ccb_001`
- `ipa92_a_cocomo_001`
- `ipa92_a_pmo_001`
- `ipa92_a_wbs_dictionary_001`

本番確認画像 `fequest-ch14-reaudit-1791110089681.jpg` を保存。画像の教材10/10・100%は教材完了を表し、定着2/10は間隔復習などを含む別指標。監査の全問操作確認とは区別する。

## 残件と次章

内容再監査・DB照合・desktop全46問の操作検証は完了。実スマートフォンの狭幅・タッチ・横スクロール・縦横切替は未検証であり、coverageのin-progressを維持する。次のデフォルトは第15章「サービスマネジメントとシステム監査」の章全体再監査。
