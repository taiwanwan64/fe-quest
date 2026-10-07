# 第21章「法務」全章再監査 — 2026-10-08
## 範囲と現状
GitHub liveを正として公開main `1bbbecbc992e146cbfffd1e23c6bc47315120181`、非公開main `f877616b37a897e1c5b88de745047e4b6324fc88`、旧作業branch、双方open PR 0、直近CI/Pages successを再確認して開始。
全6教材・関連38問題（直接35＋比較3）をlive DBから全フィールド読み取り。02参考PDF733〜752の20ページを画像で確認（章末11問・全解説を含む）。第22章開始の753ページで境界を確認。IPA9.2印刷102〜108も照合。
## 限定変更
非公開PR #129に6教材・13問題のexpected/replace差分とimmutable検査を保管。小テスト解説2件、契約・著作権帰属の要点1件を補正。本文は各1 article内へ集約し、既存IPA拡張を保持。権利の対象と利用条件、職務著作・特約、アクセスの行為要件、個人情報・第三者提供、規格と組織の区別を独立例で補強。
比較3問は本教材のテーマ名を問うことを明確化し、二つの学習内容を具体化。選択肢・正答index・IDは変更しない。ヒントと選択肢別理由を設問に対応させた。
公開変更はCSS・検査・キャッシュのみ。本文・問題文・選択肢・解説・参考書画像を公開GitHubへ置かない。本文/用語/カード/表18px、補助16px、狭幅gridと局所横スクロールを検査する。選択関数100回の全6テーマ/12unique/比較保証と直接5/3/10/7/4/6をCIへ追加。
## 本番受入のゲート
本記録作成時はDB適用・CI/Pages・全38種類の通常UI受入・履歴再読込は未完了。CI成功後、完全期待値guard transactionを一度だけ適用し、対象19行、対象外行、130教材/1180問、metadata/版/日時をreadbackする。適用済み差分は再実行しない。
第5〜21章の実スマホ狭幅・タッチ・横スクロール・縦横切替は未確認。coverage in-progress、IPA対応43項目（37 in-progress / 6 verified-covered）を維持。未確認事項を完了へ繰り上げない。
## 確認した一次資料
- [IPA FEシラバス9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)
- [文化庁 著作権テキスト](https://www.bunka.go.jp/seisaku/chosakuken/seidokaisetsu/pdf/94388701_01.pdf)
- [個人情報保護委員会 通則編](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)
- [警察庁 不正アクセス禁止法Q&A](https://www.npa.go.jp/bureau/cyber/pdf/6_QA.pdf)
- [公正取引委員会 取適法](https://www.jftc.go.jp/toriteki/index.html)
- [特許庁 意匠の保護対象拡充](https://www.jpo.go.jp/system/laws/rule/guideline/design/kaisei_hogo.html)
- [RFC Editor 文書シリーズ](https://www.rfc-editor.org/series/rfc/)
