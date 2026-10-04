# 第12章 全54問の本番UI検証 — 2026-10-04

## 対象と最新状態

ユーザーの「続けてください」に従い、前回残っていた全件解答操作を実施。過去記録だけで判断せず、GitHub main・open PR・Actions と現行protected DBを再取得してから検証した。

- public main: `1700ceba2ec7cba6efcc392c547a532bd15e6e41`（PR #314 merge）
- private main: `f202698e5352b1105d44aa4dcf712c2927957a46`（PR #117 merge）
- 開始時open PR: public 0 / private 0
- 公開側の直近publication CI `37171606481`、Pages `37171647203`: success
- protected CI `37171148170`: success
- 前回作業ブランチ `docs-ch12-followup-evidence-20261004` はPR #314へmerge済み。
- 現行DBの第12章54問を再取得し、設問と正答indexをUI回答の照合に使用。
- 対象本番: https://taiwanwan64.github.io/fe-quest/ （v377、cache166）
- Chrome desktopの新規ゲスト。利用者の既存アカウントを使わず、端末内の検証用学習履歴のみ作成。

内容の再監査・guarded DB更新は前回完了済み。今回、新たな教材本文・問題本文・プログラム変更やDB更新はない。

## 全8テーマの受入れ結果

各教材を表示し、「学習完了 → 問題演習」からそのテーマの全問題へ進んだ。

| テーマID | 実出題 | 初回正解 | 初回不正解 | 再挑戦で正解 |
| --- | ---: | ---: | ---: | ---: |
| core_12_01 | 3 | 3 | 0 | 0 |
| core_12_02 | 7 | 7 | 0 | 0 |
| core_12_03 | 7 | 7 | 0 | 0 |
| core_12_04 | 8 | 8 | 0 | 0 |
| core_12_05 | 7 | 7 | 0 | 0 |
| core_12_06 | 6 | 6 | 0 | 0 |
| core_12_07 | 4 | 3 | 1 | 1 |
| core_12_08 | 7 | 7 | 0 | 0 |
| 合計 | 49 | 48 | 1 | 1 |

core_12_07の1件は誤答経路を確認するため意図的に誤答したもの。残る5問は章末専用の比較問題で、テーマ演習には含まれない。

## 章末演習と54問の網羅

章末ボタンから12問の演習を4回完了した。各回の結果は初回正解12・初回不正解0・100%。ランダム選出を繰り返し、比較5問すべてを実際に解答した。

- テーマ演習49問＋章末演習48問＝延べ97問の出題を完了。
- 1件の意図的誤答の再回答を含め、回答送信は98回。
- 全54の問題IDについて、正答判定・正解の根拠・他の選択肢の解説表示を確認。
- 各問から次問、最終問から結果画面への遷移を確認。
- UIで確認した54 ID集合は、今回再取得したlive DBの第12章54 ID集合と完全一致。
- 新規不具合は検出せず。

確認済みID（問題本文・選択肢は公開リポジトリへ複製しない）:

```text
challenge_cmp_12_01
challenge_cmp_12_02
challenge_cmp_12_03
challenge_cmp_12_04
challenge_cmp_12_05
challenge_v92_12_06
challenge_v92_12_07
challenge_v92_12_08
coreq_12_01_1
coreq_12_01_2
coreq_12_01_3
coreq_12_02_1
coreq_12_02_2
coreq_12_02_3
coreq_12_03_1
coreq_12_03_2
coreq_12_03_3
coreq_12_04_1
coreq_12_04_2
coreq_12_04_3
coreq_12_05_1
coreq_12_05_2
coreq_12_05_3
coreq_12_06_1
coreq_12_06_2
coreq_12_06_3
coreq_12_07_1
coreq_12_07_2
coreq_12_07_3
coreq_12_08_1
coreq_12_08_2
coreq_12_08_3
ipa92_a_abstract_data_type_001
ipa92_a_coding_standard_001
ipa92_a_condition_coverage_001
ipa92_a_ddd_001
ipa92_a_dfd_001
ipa92_a_inspection_001
ipa92_a_mockup_001
ipa92_a_mvc_001
ipa92_a_override_overload_001
ipa92_a_refactor_001
ipa92_a_review_001
ipa92_a_solid_001
ipa92_a_static_analysis_001
ipa92_a_stub_001
ipa92_a_sysml_001
ipa92_a_sysml_002
ipa92_a_test_driver_001
ipa92_a_test_driver_002
ipa92_a_uml_001
ipa92_a_usecase_001
ipa92_a_user_story_001
ipa92_a_user_story_002
```

## 誤答・ヒント・再回答

`challenge_v92_12_07` で意図的に誤答し、以下を確認した。

1. 初回誤答でヒントを表示。
2. 選んだ誤答だけが無効化され、他の選択肢は選択可能。
3. 「もう一度回答する」で正答を再送信できる。
4. 再挑戦後に正答根拠と誤答選択肢の説明を表示し、次問へ進む。
5. 4問完了後の結果は75%、初回正解3・初回不正解1・再挑戦で正解1。再挑戦正解を初回正解に混ぜない。
6. 要復習1件として復習導線を表示。

## 残件と完了の範囲

内容再監査およびdesktopでの全54問の解答操作は完了した。
実スマートフォンでの狭幅表示・タッチ・表の横スクロール・縦横切替は、この環境で実行できていない。
desktop検証を実機検証と扱わず、実機を含むcoverageはin-progressを維持する。

ユーザーの第12章指定を継続優先し、この検証では第13章以降の新規監査へ進んでいない。
