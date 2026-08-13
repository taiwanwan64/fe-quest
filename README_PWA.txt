FE QUEST PWA v19

v19: VARIANT REVIEW + ACTIVE RECALL

目的:
同じ問題文・同じ答えを覚えてしまう「見覚え正解」を減らし、
同じ論点を別条件でも解けるか確認する。

VARIANT REVIEW直接生成:
- 基数変換
- 16進数
- システム信頼性
- 画像データ量
- 財務（売上総利益）
- キュー
- スタック
- 条件分岐
- 集合
- スループット

生成できない問題:
1. 同じconceptの別FE QUESTオリジナル問題
2. 同じカテゴリの別FE QUESTオリジナル問題
3. 元問題
の順でフォールバック。

ACTIVE RECALL:
- VARIANT REVIEW時、選択肢を一旦隠す
- 答え・式・キーワードを短く入力
- 「選択肢を見る」を押してから4択へ進む
- 入力内容自体は厳密採点しない
- まず想起する行動を作ることが目的

RETRY:
- 今日の復習も、初回誤答で正解を即表示しない
- ヒントだけ表示し1回再挑戦
- 初回誤答は成績・翌日復習へ記録
- 再挑戦正解でもstabilityを大きく伸ばさない

記憶エンジン:
- variantにはsourceIdを持たせる
- 正誤・誤答理由・stability・dueは元問題へ反映
- 問題文を変えても同じ論点の記憶モデルが育つ

設定:
- 問題演習画面「類題を優先」ON/OFF
- OFFでは元問題をそのまま復習

コンテンツポリシー:
- 生成規則、問題、数値、選択肢、解説はFE QUESTオリジナル
- 添付参考書は章構成・重要テーマ・難易度感の参考に限定
- 参考書独自問題は転載しない

検証:
- node --check
- sw.js構文チェック
- Node VM起動
- HALF MOCK開始
- 直接生成対応問題から各8回variant生成しanswer index/sourceId検査
- review itemのsourceId検査
- adaptive memory / 7日予報継続
