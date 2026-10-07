# 第19章 ビジネスインダストリ 全章再監査（2026-10-07）

## 範囲と根拠
- 開始時 public main: 9374fbbb240d4a819cbd4587da0391e0331c8deb、private main: 11c79c0709e8dbd60f69190e7c684fe82204354a。双方open PR 0。
- 前回作業branchとmainの比較はfiles 0 / ahead 1 / behind 0。最新Pages 37572166133 success。
- 全4教材・27関連問題をlive protected DBから全フィールド取得して照合。
- 添付02参考PDF657〜684の全28ページ画像（印刷640〜666、章表紙を含む）、全21過去問と解説を確認。685は次章の表紙として境界を確認。
- IPA公式FEシラバス9.2印刷91〜95、ビジネス／エンジニアリング／e-ビジネス／民生・産業機器を確認。
- 原著の文章・図・選択肢は転載せず、独立した取引・資材計算・制御例を作成。

## 限定修正
全4教材を一つのarticleへ包み、既存IPA補足を維持。POS/ID-POSの情報範囲、電力網と計測・家庭制御、業務AIの人間確認、CAD/CAE/CAM、JITとかんばん、MRPの量と時期、工程依存関係、主体分類と店舗連携、決済順序、RFIDの条件、EDI規約、センサ/アクチュエータ、更新可能なファームウェアを整理。

13問のhint/説明/比較設問を修正。比較3問は教材テーマの対応として扱い、反転だけで重複する比較を別の業務シナリオへ変更。問題ID・選択肢・正答index・分類・extra・版・active・日時とユーザー履歴は維持。過去回答の再採点なし。

## 公開側の検証
本文・用語・カード・表を18pxへ統一。短い図のラベルは16px以上。狭幅ではグリッド一列化・表ラッパー横スクロールを維持。PWA cache176へ同期。
実選択関数100回で直接6/4/5/9、章末12unique・全4テーマ・比較設問保証を検証。保護差分のvalidatorは4教材・27監査ID・13限定修正と不変フィールドを検査。

## 受入状態
この実装PR時点ではCI・merge・DB反映・本番UI・演習・履歴の確認は未完了。更新済みと見なしてDB差分を再実行しないこと。以後の確定記録を参照する。
coverageはin-progress。第5〜19章の実スマホ・タッチ・縦横切替は未確認。IPA対応表43項目（37 in-progress / 6 verified-covered）は変更しない。

## 一次資料
- [IPA FE 9.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf)
- [GS1 RFIDと金属・水分](https://support.gs1.org/support/solutions/articles/43000734154-does-rfid-work-around-metal-and-water-)
- [Trusted Firmware-A FWU](https://trustedfirmware-a.readthedocs.io/en/latest/components/firmware-update.html)
