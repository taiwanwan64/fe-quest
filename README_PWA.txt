FE QUEST PWA v47

⑤ PWAの仕上げ・安定化

追加・改善:
- Service Worker更新を updateViaCache:none で確認
- 新版検出時はアプリ内に「更新する」通知
- 更新ボタン -> SKIP_WAITING -> controllerchange -> 再読み込み
- Service Workerは更新時に自動skipWaitingしないため、学習中に突然ページを切り替えない
- FE QUEST由来の古いキャッシュだけを削除
- ナビゲーションはネットワーク優先 + 4秒でオフラインフォールバック
- 静的アセットは stale-while-revalidate
- オンライン復帰時に自動更新確認
- focus / visibility復帰時も一定間隔で更新確認
- オフライン状態表示を明確化
- 学習設定に「アプリ・データ」カード追加
  * バージョン
  * オンライン状態
  * ホーム画面アプリ / ブラウザ
  * Service Worker状態
  * ブラウザ保存領域
- 学習データJSON書き出し
- 学習データJSON読み込み
- localStorage保存失敗時に警告
- JSON破損時は元文字列を復旧用キーへ退避
- 別タブで学習データが更新された場合に再読み込みを案内
- runtime error / unhandled rejection時に再読み込み案内

文字サイズ:
v43以降の14px最小ルールを維持。

注意:
ブラウザのサイトデータ自体を削除すると学習データも消えるため、端末変更・初期化前はJSONバックアップ推奨。
