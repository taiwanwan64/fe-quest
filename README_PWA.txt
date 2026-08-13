FE QUEST PWA v21

v21の主な変更

1. 図解レッスンのレイアウト安定化
- lesson-stage に横スクロール許可を追加
- 複雑な図解が狭い幅で崩れにくいよう調整
- 図解専用の diagram-scroll を追加

2. IoTレッスンの図解修正
- 4カード + 3矢印に対して不十分だったレイアウト定義を修正
- IoTの流れ専用に 7カラム構成へ作り直し
- センサ → ネットワーク → クラウド → アクチュエータ が1列で安定表示
- スマホ幅では縦並び表示へ切替
- カード高さを揃えて視認性を改善

3. 既存機能は継続
- EXAM AREA COVERAGE
- Adaptive Memory / 7日復習予報
- VARIANT REVIEW
- ACTIVE RECALL
- RETRY

検証
- index.html JavaScript構文チェック
- sw.js 構文チェック
- Node VM起動
- IoTレッスン描画
- startLesson('iot') で lessonStage へ .iot-flow / .iot-arrow が入ることを確認
- 既存の variant generator / memory engine 継続確認
