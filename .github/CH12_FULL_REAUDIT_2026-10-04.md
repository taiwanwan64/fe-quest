# 第12章・章単位再監査（2026-10-04）

ユーザー指示により、第11章に続いて第12章「システム開発」を、過去の完了記録ではなく live GitHub / protected DB と添付参考資料を基準に再監査した。

## 対象と基準

- 添付参考資料の第12章（PDF 465〜508ページ、44ページ）を本文・図表まで確認。
- 節構成は 12-01 システム開発技術、12-02 システム要件定義、12-03 システム設計、12-04 プログラミングとオブジェクト指向、12-05 テスト。
- protected DB の第12章全54問と教材を live で照合し、既存の第1回監査で実装済みの内容を再利用しつつ不足だけ補った。
- 参考資料の文章・図版は複製せず、FE QUEST独自の説明・表・図解として再構成した。

## 再監査で確認・補強した点

- システムから命令まで、設計対象が細分化する階層を明示。
- 結合テストで確認する「インタフェース」を、引数・戻り値・データ形式・呼出し順序の受渡しとして説明。
- AかつBを例に、条件網羅、判定条件/条件網羅、複数条件網羅、命令網羅・分岐網羅の違いを具体的な真理値の組合せで補強。
- ホワイトボックス/ブラックボックスは、単なる定義だけでなく、それぞれ何を確認しやすく、何をそれだけでは保証できないかも説明。
- V字モデルを直接判断する演習を追加し、設計工程と対応するテスト工程を確認できるようにした。
- UMLの汎化を示す白抜き三角形、ブラックボックスの判断、共通フレーム/設計工程などを章内比較問題にも反映。
- テンプレート的・設問とずれた説明/ヒントが残っていた直接問題を修正し、正答理由を先に説明する形へ整理。

## protected変更

- private PR #116: 2教材・9問題の guarded delta。
- head `3c2fa60cf47cb47f225a06e6822abbdbec891981`、protected CI `37170183635` success。
- private merge `5cb04a770a94e9ddb2dc85c94f5be2afb1e2f589`。
- lesson / question ID、正答index、catalog metadata、content_version、active flagを維持し、既存学習履歴との対応を変えない。
- guarded transactionでDBへ反映し、反映後に2教材と9問題の全対象フィールドがdeltaのreplace後状態と一致することを再照合。
- active lesson `130`、active question `1180`、第12章 `54` 問を維持。
- 詳細な教材本文・問題本文・選択肢・正答は公開リポジトリへ置かない。

## 公開readability

第12章専用CSSでは、説明として読む文章を18pxへ統一する。

- helper・カード本文・SLCP説明・ライフサイクル/設計カード説明・DFD説明・OOP説明: 18px。
- 工程表・結合度表・UML表・網羅表の本文: 18px。
- 矢印、短いフローラベル、図形内ラベルなどは16px以上を維持。
- 横長表の横スクロールと既存の820 / 680 / 480pxレスポンシブ規則を保持。

## 公開CI / production

- public PR #311 `audit: Chapter 12 full re-audit and readability` merged。
- head `7189201070aa308bce619a4bbd7f974748bbf438`。
- `Validate sanitized FE QUEST publication` run `37170398143`: success。
- `Validate IPA 9.2 question v35 public activation` run `37170398183`: success。
- public merge `d68e1351c269ca632b70ba01abd88be0bcb9c2a3`。
- production Pages run `37170423353`: success。
- PWA cache: `fe-quest-v377-165`。

## 残件

実スマートフォンでのタッチ、横スクロール、縦横切替は静的CIとは別の残件として扱う。第12章の内容・protected DB・公開readability・CI・Pagesは2回目の再監査分まで反映済み。次の内容再監査対象は第13章「ソフトウェア開発手法」全体。
