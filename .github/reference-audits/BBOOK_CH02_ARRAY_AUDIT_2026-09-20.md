# 科目B専用参考書 第1部 第2章「一次元配列」監査 — 2026-09-20

## 基準

添付参考資料『情報処理教科書 出るとこだけ！基本情報技術者［科目B］第4版』第1部「擬似言語」第2章「一次元配列」を、章扉から練習問題2-1〜2-4・解説までページ画像で確認した。

参考書本文はPDF 98〜107ページ、練習問題・解説は108〜121ページに相当し、PDF 122ページから第3章「二次元配列」が始まることを視覚確認した。

IPAを試験仕様の正本として照合したところ、令和7年度 基本情報技術者試験 科目B 公開問題 問3、およびIPAの科目Bサンプル問題 問2はいずれも「配列の要素番号は1から始まる」と明記している。したがって、FE QUESTの科目B一次元配列問題も1始まりへ統一する。

## 参考資料で確認した主な内容

- データ構造の種類のうち一次元配列を扱う章
- 一次元配列は同じ型の値を横一列に複数格納する
- 要素数 / 要素 / 要素番号（Index / Idx）
- 配列の宣言と値の格納
- 宣言と同時に値を格納する書き方
- 可変長配列と末尾への要素追加
- 一次元配列図の描き方
- 配列を含むトレース
- 値が格納された要素だけを書き換える
- プログラム開始時・終了時には全要素を確認する
- 要素番号 i に対して i-1 は左隣、i+1 は右隣
- 要素番号が配列範囲外になるとエラー
- 練習問題: 2の累乗列、フィボナッチ数列、平均、配列の逆順化

## 既存FE QUESTで十分なところ

protected `b_exercise` には既に、一次元配列を使う次の演習がある。

- 配列の最大値
- 配列を逆順にする
- 偶数を数える
- 線形探索
- 二分探索
- バブルソート
- 選択ソート

`b_exam_algo` にも累積和、左回転、隣接差、反転、重複除去があり、`b_compound` には整列済み配列のマージと売上データ集計がある。

よって新規問題を大量追加するより、表記体系と読解の土台を揃える方が優先度が高い。

## 重大な不整合: 0始まりの配列添字

監査時点では、FE QUESTの科目B一次元配列問題の一部が `data[0]`、`for i ← 0 to ...` など0始まりで作られていた。

これは参考資料の第2章、およびIPAの公開・サンプル問題で明示されている1始まりの表記と一致しない。初学者が「本試験でも0から始まる」と学習する恐れがあるため、この章の対応で一次元配列の対象問題を1始まりへ統一する。

### 統一対象

- `b_exercise`: 14問
  - array_max
  - array_reverse
  - binary_search_b
  - bubble_sort_b
  - count_even
  - linear_search
  - selection_sort_b
- `b_exam_algo`: 5問
  - bexam_arr_01〜05
- `b_compound`: 6問
  - merge_sorted
  - sales_filter

合計25問。

二次元配列の0始まり表記は第3章監査でまとめて扱う。

## thin / missing

### 1. 要素数・要素・要素番号の区別

既存演習では配列を直接使うが、3語を明示して区別する導入が薄い。

### 2. 一次元配列図

参考資料は配列名、要素番号、値を箱で描き、頭の中だけで保持しないことを重視する。FE QUESTの状態表示と対応付ける説明が必要。

### 3. 可変長配列と末尾追加

既存問題には `out の末尾に ... を追加` がある一方、「要素数0から始めて末尾へ追加すると配列が伸びる」という概念説明が薄い。

### 4. トレース時の記録ルール

参考資料では、毎行すべてを書き直さず「値が変化した要素だけ書く」一方、開始時・終了時には全要素を確認するという手順を示す。

### 5. 隣接要素と範囲外

`i-1` / `i+1` を左隣 / 右隣と読む視点と、範囲外参照がエラーになることを独立して整理する必要がある。

## 反映

公開側の科目Bトレース画面に「一次元配列の読み方」を追加し、次を図解する。

- 要素番号は1から始まる
- 要素数 / 要素 / 要素番号
- 宣言・初期化・要素代入
- 可変長配列の末尾追加
- 一次元配列図
- i-1 / i / i+1
- 範囲外参照
- トレース時に値が変化した要素だけ記録する方法

protected question bankでは上記25問を1始まりへ統一し、stem / options / explanation / hint / render code / traceSegment / postSubmit traceTail の整合を同時に取る。

## スマートフォン対応

- 本文17px以上。
- 配列図は狭い画面でも5要素を認識できる最小幅を確保。
- 比較表は横スクロール。
- 通常は折りたたみで、演習開始の主導線を圧迫しない。

## PWA / CI

- 専用CSS: `assets/bbook-ch02-array-v405.css`
- PWA cache contract: `fe-quest-v377-86`
- publication / Pages CIでCSS、1始まりのガイド、PWA cache contractを検証する。


## 完了証跡

- protected question content version: `v376-bbook-ch02-array-v405-20260920`
- 対象問題数: 25
  - `b_exercise`: 14
  - `b_exam_algo`: 5
  - `b_compound`: 6
- active protected question total: 1173（件数増減なし）
- option数不整合: 0
- answer_index範囲外: 0
- `b_exercise` ordinal 2 の traceTail 欠落: 0
- 対象25問の一次元配列コードに `data[0]` / `sales[0]` / `prefix[0]` / `out[0]` / 0始まりループの残存: 0
- question payload SHA-256: `23bc8543a66fe360e706d7af94a04e4895a7ebdce2f47df7e4d1db8568e6b498`
- question import manifest source commit: `abb15f791212b99e6b1c51822d569b938f135dc7`
- PR: #166（merged）
- PR head CI:
  - Validate sanitized FE QUEST publication: run `35510933708` — success
  - Validate IPA 9.2 question v35 public activation: run `35510933696` — success
- production Pages deploy: run `35510969478` — success
- PWA cache contract: `fe-quest-v377-86`
