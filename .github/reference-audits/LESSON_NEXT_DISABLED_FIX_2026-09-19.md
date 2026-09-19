# 学習完了→問題演習ボタン無反応の修正 — 2026-09-19

## 原因

`fequestProtectedLessonRenderPendingV376()` は保護教材の読込中に `lessonNext.disabled = true` とする。
読込完了後は `renderLesson()` → `renderLessonLegacyV376()` で教材を再描画するが、従来は `lessonNext` の `disabled` を false に戻していなかった。
そのため、保護教材が一度「読み込み待ち」を通った場合、表示上は「学習完了 → 問題演習」に戻ってもボタンが disabled のまま残り、タップしても反応しなかった。

## 修正

- 保護教材を含む通常の教材描画が完了した時点で `lessonNext.disabled = false` を明示。
- `aria-disabled` も除去。
- 読込中・アクセスエラー時は従来どおり pending renderer 側で disabled にするため、安全側の挙動は維持。

## 回帰防止

公開検証CIで、教材描画時に `lessonNext` を再有効化するコードが存在することを確認する。
