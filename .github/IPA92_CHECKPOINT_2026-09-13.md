# FE QUEST — IPA Ver.9.2 checkpoint — 2026-09-13

このファイルは `.github/IPA92_PROGRESS_LOG.md` より新しい現在地を残すチェックポイントです。再開時は、まず GitHub の現在の main / open PR / CI と Supabase の本番状態を確認し、GitHub/Supabase の実状態がこの文書より新しい場合はそちらを正とします。

## 2026-09-13 production import 検証結果

private repository `taiwanwan64/fe-quest-private-source` の main は `89d50789e5ca0776f53e977ae649f7f4e20c9aaa`。同 main から手動 `workflow_dispatch` された question v2 → v3 → v4 → v5 → v6 と protected lessons の最新6 workflow はすべて `success` を確認した。

### Question bank

Supabase `fequest_question_bank_private` の active 件数を本番DBで再集計し、次を確認済み。

- `v376-protected-final`: 904
- `ipa92-questions-v1`: 13
- `ipa92-questions-v2`: 14
- `ipa92-questions-v3`: 12
- `ipa92-questions-v4`: 12
- `ipa92-questions-v5`: 16
- `ipa92-questions-v6`: 16
- **合計: 987**

期待した 917 → 931 → 943 → 955 → 971 → 987 の import chain と一致する。

`fequest_question_imports_private` も v1〜v6 を確認した。v2〜v6 はすべて source commit `89d50789e5ca0776f53e977ae649f7f4e20c9aaa` から取り込まれている。

| batch | count | payload SHA-256 |
|---|---:|---|
| v2 | 14 | `b55280b5c9c904b54d4b502e328be9f68f17f52fa0986ab5918c0c68ff3a2034` |
| v3 | 12 | `b59cffdae4536526361192fb943b70fdeb1fff18c990c5b145488aa689b97556` |
| v4 | 12 | `648ad39cfda14278da4b2a06f59fe8127f96c0a8ed2318f958b0856ac5149484` |
| v5 | 16 | `51de1b1a3a94ec14540384d00e0da24b0302e1920b9ae4afc775d82b40f9e781` |
| v6 | 16 | `a299f38fa7ed528d5d7df10bc65a09b24d21af6694080a09bfba38d72077a303` |

### Protected lessons

`Import protected lessons` の最新 workflow も成功した。本番 `fequest_lesson_bank_private` は `v376-lessons-1` が active 130件。最新 import manifest は次のとおり。

- content version: `v376-lessons-1`
- total: 130
- payload SHA-256: `52257af7772349de44c936325f4be8ed5308b0d35a73e9fd9dbadb61c4f960fa`
- source commit: `89d50789e5ca0776f53e977ae649f7f4e20c9aaa`
- imported at: `2026-09-13 02:54:56 UTC`

重要: lesson の content version は新名称には変わらず `v376-lessons-1` のまま再materialize/importされた。workflow成功・130件・新しい payload hash/source commit は確認できているため、現時点ではこれを失敗扱いしない。将来 versioning contract を見直す場合は importer の意図を先に監査する。

## 公開アプリ側の状態

public repository `taiwanwan64/fe-quest` の、この作業開始時点の main は `2fe9d778972d82513f90db958a6165f583d3ce2c`。

本番DBには987問あるが、公開アプリの safe catalog / runtime metadata はまだ v1 の13問までしか取り込んでいない。`assets/protected-content-provider-v376.js` は baseline 904 + v1 13 = 917件を前提とし、`cloud/activation-loader-v342.js` も v1 のsafe metadata 13件だけを `QUESTION_BANK` に追加している。したがって、**DB import 完了 = 公開アプリで987問利用可能、ではない**。

v2〜v6 の問題本文・選択肢・正答・解説を公開せず、`id / sourcePool / cat / difficulty / concept / coreTopicId` 等の public-safe metadata のみを公開runtimeへ統合する工程を次に行う。

## IPA Ver.9.2 inventory

公式IPA Ver.9.2は23中分類・96小分類で構成される。現在の `.github/ipa92-coverage.json` は `inventory_state: partial-baseline` / `inventory_complete: false` のままであり、P0/P1追加項目がsource-ready/import済みになったことだけを理由に completion gate を上げない。

細目・用語例の公式監査は `.github/IPA92_OFFICIAL_INVENTORY_AUDIT_2026-09-13.md` に切り分けて進める。まず大分類1「基礎理論」から、既存904問 + v1〜v6 + protected lessons + interactive lab の証拠を照合し、「既存で十分」「薄い」「未登録」を区別する。単に coverage manifest に未登録という理由だけで `missing` とは判定しない。

## 残タスク順序

1. v2〜v6 の public-safe catalog/runtime metadata を公開アプリへ統合し、987件の catalog/runtime contract をCIで固定する。
2. 公式IPA Ver.9.2の96小分類より下の内容・用語例を順次監査し、partial inventory を拡張する。
3. UML/DFD/E-R、TLB/ページ置換、Venn、sort、graph を iPhone 相当の狭い画面で目視・タッチ・スクロール干渉QAする。
4. lesson/practice/interactive/history compatibility が検証できた項目だけ `verified-covered` へ上げる。
5. すべての公式項目登録・不足解消・QA・履歴互換が満たされた時だけ completion gate を完了扱いにする。

## 安全ルール

- GitHub/Supabase の現在状態を常に正とする。
- 問題・教材・課金ロジックは private/protected 境界を維持する。
- public repo へ問題本文・選択肢・正答・解説・hintを出さない。
- 著作物の独自問題・本文を転載しない。追加問題は原則オリジナルにする。
- 既存問題ID・正答・学習履歴・保存/復旧仕様を不用意に変更しない。
- Import の `private main + workflow_dispatch + GitHub OIDC` 境界を弱めない。
- 実装済み、import済み、公開runtime統合済み、`verified-covered` を明確に区別する。
