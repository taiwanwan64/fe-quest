# FE QUEST — Beta Feedback Log Template

> **テンプレートだけを公開リポジトリに置く。実際のテスター名・メールアドレス・連絡先を記入した管理表をGitHubへコミットしない。**

このテンプレートは `docs/BETA_MEASUREMENT_PLAN_v346.md` と `docs/EXTERNAL_BETA_ROLLOUT_PLAYBOOK.md` の手動評価を補助する。必要なら公開リポジトリ外の安全な管理場所へコピーして使う。

## Cohort summary

```text
Beta start date:
Production version: v345 / other
Invited: __
Started first learning: __
Physical-device gate before invite: PASS / FAIL
P0 count: __
P1 count: __
P2 count: __
P3 count: __
```

## Minimal tester log

テスターは `B01` のようなコードで扱う。公開版の記録に氏名・メールアドレス・SNS IDなどを入れない。

| Tester code | Invited | Started from 今日の学習 | Decision burden reduced | D1 | D3 | D7 | D30 | Highest severity | Short friction note | Issue ref |
|---|---|---|---|---|---|---|---|---|---|---|
| B01 | YYYY-MM-DD | yes / no / unknown | yes / neutral / no / unknown | yes / no / unconfirmed | yes / no / unconfirmed | yes / no / unconfirmed | yes / no / unconfirmed | none / P0 / P1 / P2 / P3 | 1行だけ | #123 / none |

## Allowed notes

短い学習体験メモだけを残す。

例:

- 「初回設定後、次に診断を押すか今日の学習を押すか迷った」
- 「今日の学習を押せば進めるので、教材を選ぶ必要がなく楽だった」
- 「科目Bの次の行動が分かりにくかった」
- 「再読み込み後も進捗は残った」

## Do not record here

- 氏名
- メールアドレス
- 電話番号
- SNSアカウント
- Magic Link
- 認証トークン / session
- Supabase session情報
- JSONエクスポート全文
- localStorage / IndexedDB全量
- 問題ごとの全正誤履歴
- 不具合再現に不要な個人情報

## End-of-cohort summary

```text
Invited: __
D1: yes __ / no __ / unconfirmed __
D3: yes __ / no __ / unconfirmed __
D7: yes __ / no __ / unconfirmed __
D30: yes __ / no __ / unconfirmed __

Started from 今日の学習: yes __ / no __ / unknown __
Decision burden reduced: yes __ / neutral __ / no __ / unknown __

P0: __
P1: __
P2: __
P3: __

Top value:
Top friction:
Recommended next action: continue beta / fix and resume / pause / other
```

数値だけで結論を作らず、10〜30人という小規模サンプルであることを前提に、代表的な摩擦と中心価値の回答を一緒に読む。
