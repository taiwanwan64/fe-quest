# FE QUEST v356 — Subnet network/host boundary diagram

## Result

PASS — `サブネットマスク`の本文内に、ネットワーク部26bitとホスト部6bitの境界を3段で追う図解を追加した。

## Learner-facing change

- 対象は `core_10_04`「サブネットマスク」のみ
- `192.168.1.130/26`を32bitの構造へ分け、先頭26bitと残り6bitを色分け
- IPアドレス、サブネットマスク、ネットワークアドレスで境界位置を統一
- `/26`が`255.255.255.192`に対応することを表示
- ホスト部を全0にして`192.168.1.128`を得る流れを表示
- PCでもスマートフォンでも32bit境界は横方向に維持し、説明ラベルだけを狭い画面で上段へ移動
- 図解は静的な補助説明で、学習完了のための操作を要求しない

## Accuracy boundary

- IPv4は32bit、`32 - 26 = 6`を明示
- マスクの2進表現は、先頭26bitを1、残り6bitを0として表示
- ネットワークアドレスはホスト部を0にする操作として説明
- ブロックサイズや利用可能ホスト数は今回の境界図へ詰め込まない

## Safety boundary

- profile schema: v5のまま
- 問題数・問題文・正解・解説: 変更なし
- 既存カリキュラム本文: 変更なし
- 学習計画・適応ロジック・保存・復旧: 変更なし
- cloud runtime: v342のまま
- v355アセット: 上書きなし

## Verification

- versioned split release static contract: PASS
- JavaScript syntax: PASS
- desktop Chromium 1366px: 3段の境界位置一致、overflowなし
- mobile WebKit 390px: 26:6のbit帯を維持、overflowなし
- 対象外レッスンへの誤表示: 0
- asset recovery UI: 非表示
- uncaught page error: 0

## Decision

まずCIDRの数字を「左から何bitまでがネットワーク部か」という視覚的な境界へ変換する。IP、マスク、計算結果で境界を動かさず、ホスト部だけを0にする操作を同じ位置で追えるようにする。
