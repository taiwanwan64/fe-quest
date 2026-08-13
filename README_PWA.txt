FE QUEST PWA v3

このフォルダは、そのままHTTPS対応のWebサーバーへアップロードできるPWA一式です。

重要:
- iPhoneの「ファイル」アプリから index.html を直接開く方式ではPWAにはなりません。
- Service Workerは file:// では動作しません。
- HTTPSで公開したURLをSafariで開いてください。

公開後のiPhone操作:
1. Safariで公開URLを開く
2. 共有
3. 「ホーム画面に追加」
4. 「追加」
5. ホーム画面のFE QUESTアイコンから起動

ファイル:
- index.html                アプリ本体
- manifest.webmanifest      PWA設定
- sw.js                     オフラインキャッシュ
- icon-192.png              PWAアイコン
- icon-512.png              PWAアイコン
- apple-touch-icon.png      iPhoneホーム画面用

現在のAI講師はモックです。OpenAI API接続は次の開発段階で追加できます。
