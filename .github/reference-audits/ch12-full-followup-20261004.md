# 第12章・全体監査の追加確認（2026-10-04）

## 現行ソースと範囲

- 公開main `e4efcedd8852225814b19e1d3451bb06350ae0fa`、非公開main `5cb04a770a94e9ddb2dc85c94f5be2afb1e2f589`をGitHubから読み取り。公開311/312、非公開116はマージ済み。
- 現行DBの教材8件・問題54件を、本文、選択肢、正答、解説、ヒント、選択肢別解説まで確認。
- 添付教科書の第12章、PDF 465–508ページ（44ページ）の画像を確認。既存監査の修正2教材・9問はDBの全変更フィールドが一致した。

## 概念対応と判断

|教材ID|主な確認対象|判断と追加差分|
|---|---|---|
|core_12_01|ライフサイクル、共通フレーム、工程・成果物|covered。追跡可能性の問題の正答文を具体化|
|core_12_02|機能・非機能要件、SysML、ユーザーストーリー|thin。SysMLの版を明示、ストーリーと受入条件の具体例|
|core_12_03|設計粒度、モジュール結合度、DFD|covered。現行階層・図解・比較表を保持|
|core_12_04|クラス・実体、継承、多態性、UML等|covered。汎化の向きと白抜き三角形を確認|
|core_12_05|V字、網羅基準、インタフェース、スタブ・ドライバ|thin。論理式の前提と実行時の短絡評価を区別|
|core_12_06|規約、静的解析、CI、再現性|thin。CI/CDの段階・具体例と設問別ヒント|
|core_12_07|移行方式、データ照合、受入れ、切戻し|thin。比較例、照合の限界、受入れ解説の判断軸を修正|
|core_12_08|保守分類、回帰テスト、レビュー、廃棄|thin。変更理由の具体例、廃棄問題のヒントを修正|

非公開のguarded deltaは5教材・12問。教材topic全体、ID、正答index、catalog、extra、版、activeを維持する。参考書の文章・図版は転載せず、教材本文・問題本文は公開GitHubへ置かない。

## 技術上の確認元

- SysML v1のUML基盤：[OMG v1仕様概要](https://www.omg.org/sysml/sysmlv1/)。v2の別基盤：[OMG v2仕様概要](https://www.omg.org/sysml/sysmlv2/)。
- 短絡評価：[MozillaのJavaScript AND演算子](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND)。真理値表の入力値と、実際に評価された条件を同一視しない。
- CI/CD：[AWS公式説明](https://docs.aws.amazon.com/whitepapers/latest/practicing-continuous-integration-continuous-delivery/what-is-continuous-integration-and-continuous-deliverydeployment.html)。

## 検証・公開状況

- private PR [117](https://github.com/taiwanwan64/fe-quest-private-source/pull/117) merged。head `551f9d5810e1419cc2afe2255989da1c7848b382`、CI `37171148170` success、merge `f202698e5352b1105d44aa4dcf712c2927957a46`。
- 変更前の全対象行をguardで確認してDB反映。全5教材・12問の変更後フィールドと保護メタデータを再取得して一致確認。無関係行・教材topic全体のdigestが不変、active 130教材・1180問、12章8教材・54問を維持。
- public PR [313](https://github.com/taiwanwan64/fe-quest/pull/313) merged。初回CIはPWAキャッシュの検証値が165のまま残ったため失敗。公開・配信の検証値を166へ揃え、head `e30baf5a09ba3744e48ff53c4c246683b6916b89`のpublication `37171247930`、v35 `37171247961`がsuccess。
- public merge `2315d27019921579dad0ef25d6d7688daf819d91`、production Pages `37171301526` success。PWAキャッシュ166、既存教材CSSを保持。公開regression 20本、保護delta validator、service worker構文確認が成功。
- 本番desktopで全8教材を表示・読込完了確認。5教材の追加文、設計階層と汎化、対象の章専用本文・箇条書き・表のcomputed font 18pxを確認。網羅表・カード・短絡評価の補足を画面で視認。
- 12-07の全4問を本番で解答・採点・次問・完了まで確認。受入れ確認問題で意図的な誤答→更新ヒント→再回答→更新済み正答理由と選択肢別解説を確認。テスト用ゲスト進捗は3問初回正答、1問再挑戦正答。

実スマートフォンのタッチ・表の横スクロール・縦横切替、および54問すべての解答操作は未検証。内容監査と実機受入れの完了を分け、未検証項目を完了扱いにしない。
