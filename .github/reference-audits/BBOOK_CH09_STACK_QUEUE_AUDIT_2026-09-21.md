# 科目B専用参考書 第1部 第9章「スタック・キュー」監査 — 2026-09-21

## 基準

添付参考資料『情報処理教科書 出るとこだけ！基本情報技術者［科目B］第4版』第1部「擬似言語」第9章「スタック・キュー」を、章扉から確認問題・練習問題9-1・解説までページ画像で確認した。

PDF 243〜252ページ（紙面241〜250ページ）を視覚確認した。PDF 253ページから第10章「ビット列」が始まる。

参考書本文・図版・問題文は転載せず、スタック・キューを科目Bでトレースするための操作規則と状態記録だけをFE QUEST独自の説明へ再構成する。

## 参考資料で確認した主な内容

- スタックは最初に入れた値が最後に取り出される構造
- FILO（First In, Last Out）とLIFO（Last In, First Out）は同じスタックの性質を別方向から表す
- pushはスタックへ値を追加する
- popはスタック最上部の値を取り出し、その値をスタックから削除する
- peekはスタック最上部の値だけを返し、スタックから削除しない
- キューは最初に入れた値が最初に取り出されるFIFO（First In, First Out）
- enqueueはキュー末尾へ値を追加する
- dequeueはキュー先頭の値を取り出し、その値をキューから削除する
- queueのpeekは先頭の値だけを返し、キューから削除しない
- PUSH / POP、ENQ / DEQの列を一操作ずつ図に書き換えて追う
- 練習問題では優先度付きキューを扱う
- その練習問題では小さい優先度値ほど高優先度で、最高優先度が複数ある場合はその中で先に追加された要素を取り出す
- 優先度付きキューは通常のFIFOだけで判断せず、問題文の優先度規則と同優先度時の規則を先に読む

## 既存FE QUESTでcovered

protected question bankにはスタック・キューを直接または応用として扱う科目B問題が十分にある。

- `b_exercise`
  - スタック操作 2問
  - キュー操作 2問
- `b_compound`
  - 受付キューの処理 3問
  - 逆ポーランド記法の評価 3問
  - 幅優先探索とキュー 3問
- `b_exam_algo`
  - スタック・キュー4問
  - 木構造の幅優先探索でキューを使う2問

基本のPUSH / POP、ENQUEUE / DEQUEUE、LIFO / FIFO、途中状態更新、逆ポーランド記法、BFSでのキュー利用はcovered。

科目A教材 `core_03_01` にも、スタックとキューを同じ追加順で比較し、TOP / FRONT / REARと取り出し順を図で整理する説明がある。逆ポーランド記法は `core_02_03` でスタックによる評価手順まで扱っている。

## thin / missing

### 1. pop / dequeue と peek の違い

protected question bankには `peek` を直接使う問題がない。値を読むだけなのか、取り出して構造を変えるのかを同じ図で比較する共通ガイドが必要。

### 2. スタックのFILO / LIFOを同じ動作として結ぶ説明

既存問題はLIFOを中心に扱う。参考資料ではFILOも併記されるため、「最初に入れた値から見ると最後に出る」「最後に入れた値から見ると最初に出る」という同一動作の二つの表現として整理する。

### 3. キューの先頭・末尾を固定して追う手順

図の左右や縦横だけで覚えると向きを取り違えやすい。FRONT / REARを明記し、enqueueはREAR、dequeue / peekはFRONTという操作端を固定して追う必要がある。

### 4. 返り値と構造本体を同時に更新するトレース

pop / dequeueは「変数へ返す値」と「取り出し後に残る構造」の二つが同時に変化する。既存問題では実践できるが、共通手順として明示すると誤答を減らせる。

### 5. 優先度付きキュー

protected question bankには「優先度付きキュー」を直接扱う問題がなく、この章の練習問題で使う考え方が薄い。まず公開ガイドで、通常のFIFOとの違い、優先度の大小、同優先度時の規則を問題文から読み取る手順を補強する。

## FE QUESTへ反映する内容

科目Bトレース選択画面に、公開の解法ガイド「スタック・キュー：出し入れする端を固定して追う」を追加する。

- スタック = LIFO / FILO、push / pop / peek
- キュー = FIFO、enqueue / dequeue / peek
- TOP / FRONT / REARを明示した図
- pop / dequeueは返り値と構造を両方更新
- peekは値だけ返し構造を変えない
- 操作列は1行ずつ状態を書き換える
- 優先度付きキューでは優先度規則を先に確認
- 同じ優先度の要素の取り出し順も問題文で確認
- 科目B用のトレースチェック手順

protected question bankは変更しない。既存の基本・応用問題群を維持し、直接問題がないpeekと優先度付きキューはまず共通ガイドで補強する。

## 公開側の契約

- 専用CSS: `assets/bbook-ch09-stackqueue-v412.css`
- PWA cache contract: `fe-quest-v377-93`
- publication / Pages / IPA v35 CIでCSS、ガイド見出し、PWA cache contractを検証する。


## 完了証跡

- protected question bank: 変更なし
- active protected question total: 1173
- PR: #180（merged）
- PR head: `75ce9de180707c6b9fe7871d5a9a75984124173f`
- PR CI:
  - Validate sanitized FE QUEST publication: run `35556268414` — success
  - Validate IPA 9.2 question v35 public activation: run `35556268407` — success
- merge commit: `fad1b8ce7eeae160b2c8529bc9089e0c53eb780d`
- production Pages deploy: run `35556294519` — success
- PWA cache contract: `fe-quest-v377-93`
