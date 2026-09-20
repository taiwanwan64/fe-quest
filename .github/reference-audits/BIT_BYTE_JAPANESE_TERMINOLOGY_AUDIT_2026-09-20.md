# bit / byte 日本語表記統一監査 — 2026-09-20

## 背景

教材画面に英字の `bit` / `byte` が残っていたため、ユーザー向け表示では原則として「ビット」「バイト」へ統一する。

対象例:
- `8bit` → `8ビット`
- `24bit` → `24ビット`
- `1.41Mbit` → `1.41Mビット`
- `1,440,000byte` → `1,440,000バイト`
- 用語見出し `bit` / `byte` → 「ビット」/「バイト」

## protected lesson bank

表示テキストと topic 内のユーザー向け文字列を監査し、10レッスンを更新した。

対象:
- `core_04_04`
- `core_04_06`
- `core_07_01`
- `core_07_02`
- `core_08_03`
- `core_10_01`
- `core_10_03`
- `core_10_04`
- `core_10_09`
- `core_18_08`

content version:
`v376-lessons-bit-byte-jp-v385-20260920`

payload SHA-256:
`92d0f4ea676bac6f50b06e5dc8f9335b5460144c676940eb8cfa7f77ef7a2c66`

### HTML保護

articleHtml はタグ・属性を直接一括置換せず、HTMLタグ外のテキスト部分だけを変換した。
このため、既存CSSで使用している `bit-byte-visual-v378` や `bit-cell-v378` などのclass名は保持している。

監査後、lesson bank の表示テキスト / topic における対象 `bit` / `byte` の残存行は 0。

## 表示レイヤーの再発防止

`assets/first-impression-ux-v377.js` を v9 に更新し、動的に生成されるユーザー向けテキストにも表記正規化をかける。

- テキストノードの `bit` / `Bit` → 「ビット」
- `byte` / `Byte` → 「バイト」
- K/M/G/T 接頭辞付きも保持して日本語化
- aria-label / title / placeholder / alt も対象
- script / style / pre / code / kbd / samp / 入力欄などは対象外
- ブランド名 `BIT先生` は変換しない

これにより、protected question bank などに旧表記が残る場合でも、通常の画面表示では日本語表記に統一される。

## PWA / CI

- PWA cache contract: `fe-quest-v377-66`
- first impression UX contract: `v377-first-impression-ux-9`
- publication / Pages / v35 validation を新contractへ同期
