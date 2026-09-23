# 科目B アルゴリズム ミニ模試 runtime 監査 — 2026-09-23

## GitHub 基点

- main `6add2158acb1b48c44b8229e5c30ec93b9ac4650`（PR #219 merged）
- 作業ブランチ `b-mini-mock-protected-runtime-v438-20260923` は main から2コミット先で開始
- 開始時 open PR なし

## 発見と修正

main の legacy `buildBMock()` は redacted stub `bMockCandidateFromExercise()` から候補を作り、0問になり得た。作業ブランチで `B_EXERCISES` の protected ID を選び、bridgeから8問をhydrateして採点する経路へ戻した。

今回、提出中に回答ボタンを押すと、サーバーへ送った回答と結果画面で集計する回答が異なり得ることを確認した。提出時の回答を固定し、選択をロックし、8件すべてのID順・正答位置・判定を確認してから履歴やXPを更新する。画面離脱中に保留中の読み込み・採点が戻っても、旧セッションの結果を適用しない。bridgeの読み込みには世代番号を設け、キャンセル後のhydrateを棄却する。

## 維持する契約

- 8問 / 40分、基礎2・標準4・応用2
- 事前表示に正答位置・解説を含めない
- 未回答は正答位置が0でも不正解
- 受験履歴は分析用metadataのみ永続化し、復習本文は画面を離れたら解放
- profile schema 9、active protected total 1180、`b_exam_algo` 50は変更しない
- PWA cache `fe-quest-v377-120`

`.github/scripts/check-b-mini-mock-v438.mjs` で8問hydrate、未回答採点、結果解放、無効なセッション、読み込み中キャンセルを検証する。publication CIとPages deployで同じ検証を実行する。
