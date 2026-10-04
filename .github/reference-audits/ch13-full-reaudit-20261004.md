# 第13章 全体再監査・本番UI検証（2026-10-04）

## 開始時のGitHub状態

- 公開main: `375bc49b0ceea38f205a3053d18ba7315ae40e7a`。公開Pages `37186135696` success。
- 非公開main: `f202698e5352b1105d44aa4dcf712c2927957a46`。protected CI `37171148170` success。
- 双方open PR 0をlive GitHubから確認。前回作業ブランチ `audit-ch12-ui-acceptance-20261004` / PR #315 はマージ済み。
- 今回の実装ブランチ: `audit-ch13-reaudit-20261004`。過去記録だけではなく最新コード・protected DBを照合。

## 資料と監査範囲

添付参考資料02のPDF 509〜520ページ（12ページ、書籍491〜502ページ）を画像化して本文・色付き強調・図表・過去問まで確認。第13章は13-01の1節構成。FE QUESTではIPA側の補足を含む4教材・30問全体を監査した。以前のprivate PR #111の変更が現行DBと一致することも確認した。

- 13-01 ソフトウェアの開発モデル
- 13-02 知的財産適用管理
- 13-03 開発環境管理
- 13-04 構成管理・変更管理

更新された実践説明を確認するため、[Scrum Guide 2020 日本語版](https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-Japanese.pdf)および[Open Source Definition](https://opensource.org/osd)を一次資料として参照。参考資料の文章・図は転載していない。

## 確認できた不足と修正

- スクラムの責任、バックログ、イベントの全体とスプリント内の内訳、デイリースクラムの目的・時間・形式を明確化。レビューとレトロスペクティブの判断軸を整理し、XPの初出説明を追加。
- 開発環境でそろえる版・依存関係と、分離する設定・データ・権限を具体例で説明。IaCとバージョン管理を区別。
- 構成管理の承認済み基準とバックアップ、変更判断と実施後の版記録、成果物ごとの版番号の対応を説明。
- 設問とずれたヒント・解説・誤答理由を修正。CI、IaC、構成管理を具体的に区別。SCMの略語が文脈により異なることを明確化。
- スクラム役割・マッシュアップ・説明カードの本文、スクラムイベント表・構成品目表を18pxへ統一。短い補助ラベル16px、表の横スクロール、既存狭幅レイアウトを維持。

## protected更新とDB照合

private [PR #118](https://github.com/taiwanwan64/fe-quest-private-source/pull/118) merged。head `7ada51e106050ca964742bc5ed573d5e74c1db4e`、merge `dc2c54a9072c047034bab63f45f863765af0a678`。protected CI [37192259297](https://github.com/taiwanwan64/fe-quest-private-source/actions/runs/37192259297) success。

guarded transactionで3教材・12問を更新。更新前の全対象フィールド一致、更新後の無関係行ダイジェスト・ID・分類・正解index・topic・版・active等の不変性を検査した。反映後の全4教材・30問を再取得し、変更フィールドと変更対象外のフィールドすべてが期待値と一致。

- active lesson 130 / active question 1180、13章4教材・30問を維持。
- 設問本文と正解位置・正解選択肢は全問維持。教材本文・問題データは非公開側に保持。
- import manifest: `ch13-import-manifest-20261004.json`。適用したsource commitと各content_versionを記録。

## 公開実装と本番配信

公開 [PR #316](https://github.com/taiwanwan64/fe-quest/pull/316) merged。head `03e71d81e7c0793eca2b72ca382daced6e146d94`、merge `502483c70223e03b244cc42e500cdf6b7a3e9bed`。

- publication CI [37192324323](https://github.com/taiwanwan64/fe-quest/actions/runs/37192324323) success。
- v35 CI [37192324320](https://github.com/taiwanwan64/fe-quest/actions/runs/37192324320) success。
- Pages [37192586593](https://github.com/taiwanwan64/fe-quest/actions/runs/37192586593) success。
- PWA cache `fe-quest-v377-167`。readability検査と3workflowのcache契約を同期。

## 本番Chrome desktopでの全件確認

本番サイトの新規ゲストで初回診断・計画確認を終え、配信後に再読込。全4教材の読込と追加文章、対象表セル・スクラム役割のcomputed font-size 18pxを確認した。

| 演習 | 問数 | 初回正解 | 意図的誤答・再回答 |
| --- | ---: | ---: | --- |
| 13-01 1回目 | 10 | 10 | なし |
| 13-02 | 4 | 4 | なし |
| 13-03 | 4 | 4 | なし |
| 13-04 | 4 | 3 | 1問を誤答し、ヒント後に正解 |
| 第13章全テーマ＋比較 | 12 | 12 | なし |
| 13-01 2回目 | 10 | 10 | なし |
| 13-01 3回目 | 10 | 10 | なし |
| 合計 | 54 | 53 | 再回答を含む55送信 |

全30 IDについて、正解判定・正解の根拠・3つの誤答理由・次問/結果遷移を確認。テーマ演習は10/4/4/4、章確認は12問。13-04では修正後のヒント、選択した誤答の無効化、再挑戦正解・初回正解率75%の集計を確認した。追加演習で未出題の問題を確認し、UI確認済みID集合と再取得したlive DBの13章ID集合が完全一致（未確認0）。新規実装不具合は認めなかった。

確認済みID（本文・選択肢・正答は公開しない）:

- `challenge_cmp_13_01`
- `challenge_v92_13_02`
- `challenge_v92_13_03`
- `challenge_v92_13_04`
- `chapterextra_13_01`
- `coreq_13_01_1`
- `coreq_13_01_2`
- `coreq_13_01_3`
- `coreq_13_02_1`
- `coreq_13_02_2`
- `coreq_13_02_3`
- `coreq_13_03_1`
- `coreq_13_03_2`
- `coreq_13_03_3`
- `coreq_13_04_1`
- `coreq_13_04_2`
- `coreq_13_04_3`
- `ipa92_a_devops_001`
- `ipa92_a_devsecops_001`
- `ipa92_a_kpt_001`
- `ipa92_a_low_code_001`
- `ipa92_a_mlops_001`
- `ipa92_a_mob_programming_001`
- `ipa92_a_mockup_prototype_001`
- `ipa92_a_no_code_001`
- `ipa92_a_pair_programming_001`
- `ipa92_a_prototype_001`
- `ipa92_a_sre_001`
- `ipa92_a_tdd_001`
- `ipa92_a_yagni_001`

本番確認画像 `fequest-ch13-reaudit-1791107140030.jpg` は別途保存。画像の教材進捗4/4・100%は教材完了の表示であり、定着2/4は間隔復習を含む別指標。全問の操作検証とは区別する。

## 残件と次章

実スマートフォンの狭幅・タッチ・横スクロール・縦横切替は未検証。静的readability CIやdesktop確認を実機確認とみなさず、IPA coverageのin-progressを維持する。内容再監査とdesktop全件検証は完了。次のデフォルトは第14章「プロジェクトマネジメント」の章全体再監査。
