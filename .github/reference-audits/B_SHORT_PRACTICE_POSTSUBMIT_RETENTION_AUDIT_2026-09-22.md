# 科目B 短時間実戦 post-submit protected data retention監査 — 2026-09-22

## 目的

科目Bの短い実戦モード3種について、採点後の問題文・回答・正解・解説が、即時レビューを越えて profile / localStorage / backup / recovery snapshotへ必要以上に永続化されていないかを監査する。

対象:

- アルゴリズム ミニ模試（`bMockHistory`）
- 複合問題（`bCompoundHistory`）
- セキュリティ ミニ模試（`securityMockHistory`）

総合実戦はv430で同じ方針へ移行済み。

## 発見した不整合

3モードとも、結果画面で使うfull detailをそのままhistoryへ保存していた。

### アルゴリズム ミニ模試

従来のdetail:

- `id`
- `exId`
- `title`
- `level`
- `q`
- `selected`
- `correct`
- `ok`
- `explain`

永続分析で必要なのは主に正誤で、format analyticsでは全問を「途中状態」として集計している。

### 複合問題

従来のdetail:

- `q`
- `selected`
- `correct`
- `ok`
- `exp`
- `kind`
- `qlevel`
- `point`
- `pitfall`

永続分析で必要なのは `kind / qlevel / ok`。履歴一覧ではattempt単位の `title / date / correct / rate / seconds` を使う。

### セキュリティ ミニ模試

従来のdetail:

- `scenarioId`
- `title`
- `level`
- `concept`
- `q`
- `selected`
- `correct`
- `ok`
- `explain`

format analyticsでは `scenarioId` からログ読解 / ケース判断を判別し、正誤 `ok` を集計する。

## v431 修正

### persisted historyをmetadata-onlyへ縮小

#### bMockHistory detail

保存する:

- `level`
- `ok`

保存しない:

- 問題ID / 演習ID
- タイトル
- 問題文
- ユーザー回答
- 正解
- 解説

#### bCompoundHistory detail

保存する:

- `kind`
- `qlevel`
- `ok`

保存しない:

- 問題文
- ユーザー回答
- 正解
- 解説
- 見るポイント
- 間違えやすい点

attempt単位の `id / title / level` は履歴一覧と安全な識別metadataとして保持する。

#### securityMockHistory detail

保存する:

- `scenarioId`
- `level`
- `ok`

保存しない:

- タイトル
- concept本文
- 問題文
- ユーザー回答
- 正解
- 解説

`scenarioId` はformat analyticsでログ読解 / ケース判断を判別するため保持する。

## profile schema 6 → 7

v430後のschema 6では、

- `bFinalHistory` はすでにmetadata-only
- `bMockHistory / bCompoundHistory / securityMockHistory` はfull detail

という状態だった。

現在のnormalizerをそのまま変更すると、既存schema 6 profileのchecksumを新規則で計算してしまい、正常データを破損扱いするため、schemaを **6 → 7** へ上げる。

### schema 6 checksum互換

`normalizeProfileDataV6ForChecksum()` と `profileIntegrityChecksumV6()` を追加。

schema 6のchecksum検証ではv430時点の規則をそのまま再現する。

- short practice 3履歴: full detailのまま
- bFinalHistory: v430 sanitizer適用済み

検証に成功した後、schema 7 normalizerでshort practice 3履歴もmetadata-onlyへ縮小する。

これにより、schema 6利用者の既存学習データを壊さず、古いfull review detailだけを移行時に取り除ける。

## 即時結果レビューとruntime cleanup

結果画面を表示している間は、採点直後のfull attempt / review DOMを使えるため、

- 自分の回答
- 正解
- 解説
- 復習ボタン

は従来どおり確認できる。

永続profileへ保存するのはsanitized copyだけ。

結果表示後は、再採点に不要なruntime配列を解放する。

- bMock items / answers / flags
- security mock items / answers / flags
- compound answers

結果画面を離れるときはreview DOMと即時review memoryも破棄する。

さらに `setBMode()` で別モードへ直接切り替える経路でも、表示中の

- bMock result
- compound result
- security mock result
- full final result

のreview memoryを解放する。

## 維持する学習機能

以下はmetadata-only historyで維持できる。

- 各モードの受験回数
- ベスト / 直近正答率
- readiness
- 科目Bの次学習推薦
- compound直近3回平均
- format別analytics
- 履歴一覧
- 日々の短時間学習割当

即時結果画面の詳細レビュー・復習ボタンは、永続historyではなく採点直後のfull detailから描画する。

## protected bank

変更なし。

- active protected question total: **1180**
- `b_exam_algo`: **50**
- provider version: 変更なし

## CI / Pages契約

publication CIで次を確認する。

- profile schema = 7
- schema 6 checksum compatibility
- short practice 3履歴がv431 sanitizerを通る
- full attemptをhistoryへ直接保存しない
- detail sanitizerへ問題文・回答・正解・解説等を含めない
- resultを離れる経路でreview memoryを解放する
- v430 full final retention契約を引き続き維持する

Pages deployでもschema 7 / v431 policy / schema 6 checksum互換 / 3履歴sanitizerを検証する。

## PWA

- cache contract: `fe-quest-v377-113`

## 結論

総合実戦だけでなく、短時間実戦3モードでも採点後のfull review detailがprofile・backup・recoveryへ長期保存されていた。

v431では、即時レビューの学習体験を維持しつつ、永続化する情報をreadiness・履歴・analyticsに必要なmetadataへ限定する。schema 7とschema 6専用checksum互換を組み合わせ、既存学習データを壊さず移行する。
