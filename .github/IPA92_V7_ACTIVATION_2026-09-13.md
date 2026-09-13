# FE QUEST — IPA Ver.9.2 question v7 activation checkpoint — 2026-09-13

この文書は question batch v7 の本番 import と public-safe runtime 統合の証跡です。再開時は GitHub / Supabase の実状態を正とします。

## 本番 import 検証

private repository の v7 実装は main `c7ed16e435b75a3c45b384fcd215319aab52dd1b` から手動 `workflow_dispatch` で import された。

Supabase 本番で確認した値:

- `ipa92-questions-v7`: active **16**
- 全 active question: **1003**
- import manifest total: **16**
- source commit: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- payload SHA-256: `f391fc2de17d851a1270ff8120e9076ab99dbada0e0fde991908a88aa26c74c5`
- imported at: `2026-09-13 04:07:03.154+00`
- v7 staging rows after finalize: **0**

本番 active chain は次のとおり。

`904 baseline + 13 v1 + 14 v2 + 12 v3 + 12 v4 + 16 v5 + 16 v6 + 16 v7 = 1003`

## Public-safe activation

この public 統合では次だけを公開する。

- question ID
- source pool
- category
- difficulty
- concept
- core topic ID
- quality audit tag

問題文、選択肢、正答、解説、hint、choice explanations は公開しない。

v7 は既存 v1-v6 83件に16件を追加し、IPA Ver.9.2 extension safe metadata は合計99件、本番 protected catalog は baseline 904件を含めて1003件となる。

互換性のため既存 v1-v6 provider/catalog は残し、v7 provider を same-origin の public config から追加ロードする。v7 metadata は v7 provider のロード成功後だけ `QUESTION_BANK` に追加するため、v7 が画面上で選択可能なのに protected provider が未準備という状態を避ける。

PWA は既存 cache name `fe-quest-v377-12` を維持するが、`sw.js` 自体の更新によって新しい Service Worker が install され、v7 provider と v7 safe catalog を app shell に追加する。

## Coverage status

v7 が production-imported / public-runtime-active になっても、それだけでは `verified-covered` としない。公式 Ver.9.2 fine-grained inventory、mobile visual/touch QA、lesson/practice evidence、学習履歴互換性の completion gate は別に検証する。
