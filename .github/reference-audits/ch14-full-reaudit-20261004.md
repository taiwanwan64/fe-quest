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

## 検証状況

ローカルprivate validatorと公開readability validator成功。protected CI・guarded DB反映・公開CI・Pages配信・本番desktopでの画面操作は実行後に追記する。

実スマートフォンの狭幅・タッチ・横スクロール・縦横切替は未検証。静的CSS検査やdesktop検証を実機確認とみなさず、coverageのin-progressを維持する。
