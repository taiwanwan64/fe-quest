FE QUEST PWA v28

FIRST-PAGE UX AUDIT

共通ルール:
- レッスン1ページ目は「概要説明」
- 「現在」表示なし
- STEP表示なし
- 通過済み✓表示なし
- 進行中の発光なし
- 左下「← 戻る」なし
- 2ページ目以降で初めて進行状態と戻るボタンを表示

再監査:
全34レッスンの1ページ目を描画して検査。

v27で進行表示が残っていたレッスン:
- CPUの命令サイクル
- ファイルシステム
- 利益の計算
- OSとCPUスケジューリング
- システム開発の流れ
- テスト工程
- デジタル署名

対策:
個別修正だけでなく neutralizeFirstPageMarkup() を追加。
1ページ目の描画結果から
- flow-current
- flow-done
- flow-arrow-current
- step-position-note
などの進行表現を共通で除去。

さらにCSS側にも lesson-intro セーフティネットを追加。

戻るボタン:
- startLesson直後から非表示
- lessonStep===0 では常に非表示
- 2ページ目以降で表示
- 1ページ目へ戻ると再び非表示

既存機能:
- v27統合監査
- 76問品質監査
- HALF/FULL MOCK
- Adaptive Memory
- VARIANT REVIEW
- 科目B TRACE / SECURITY
を維持。
