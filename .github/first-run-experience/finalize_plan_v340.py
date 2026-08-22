from pathlib import Path

p=Path('FE_QUEST_DEVELOPMENT_PLAN.md')
t=p.read_text()

t=t.replace('現行アプリ: **v339**','現行アプリ: **v340**',1)
t=t.replace('次の計画バージョン: **v340**','次の計画バージョン: **v341**',1)
t=t.replace('# v340 — 初回体験 + 日常利用UX完成度向上\n','# v340 — 初回体験 + 日常利用UX完成度向上 ✅ 完了（2026-08-22）\n',1)

marker='\n---\n\n# v341 — 配信構造・巨大HTMLの分割'
completion='''

### v340 完了結果

- fresh / zero-history / 受験予定日未設定のユーザーだけに、ホーム先頭で**「最初の30秒」設定カード**を表示する初回体験を追加。
- 初回入力は **受験予定日 + 1日の学習時間（30 / 45 / 60 / 90分）** の2項目に絞り、主CTAを「今日の計画を作る」に一本化。
- 設定後は新しい計画ロジックを作らず、既存の `ensureTodayPlanSnapshot(true)` / `buildTodayTasks()` / `effectiveStudyMinutes()` をそのまま使って今日の計画を再生成。
- 生成直後に、復習・教材・科目B・総合確認の各タスク、所要時間、既存 `desc` を使った「なぜこの学習なのか」をその場で表示し、**学習結果に合わせて翌日以降も計画が変わる**ことを明示。
- 試験日設定済み、またはXP・教材・問題・科目B・活動履歴のいずれかがある既存ユーザーには初回カードを出さず、日常導線を変更しない。
- profile schemaは変更せず、`refreshProfileUI` / `renderHome` への新しい恒久wrapperも追加しない。
- iPhone向けに720px以下でフォームを1列化し、主要操作は48〜52pxのタップ高を確保。固定ヘッダー・下部ナビを占有するmodal方式は採用せず、通常フロー内カードとした。
- 回帰検証で、科目A **710問**、QUESTION_BANK hash、科目B content hash、`buildTodayTasks()`、profile/settings key contract、Subject B semantic diagnosticsがv339と不変であることを確認。
- 詳細: `audits/FIRST_RUN_EXPERIENCE_v340.md`
- 回帰基準: `_regression/first-run-experience-v340.fixture.json`
'''
if '### v340 完了結果' not in t:
    if marker not in t:
        raise SystemExit('v341 marker not found')
    t=t.replace(marker,completion+marker,1)

head='## 10. 直近の次アクション'
pos=t.find(head)
if pos<0:
    raise SystemExit('next action section not found')
next_section='''## 10. 直近の次アクション

**次に着手する正式タスクは v341「配信構造・巨大HTMLの分割」。**

v338〜v340で実行経路の把握、runtime停止リスクの低減、初回価値伝達まで完了した。次は3.67MB級の単一完成HTMLを、**PWA・オフライン性・既存保存データを壊さず**段階的に分割する。

最初の順序:

1. v340完成版の最新サイズ内訳を再計測し、`base-stable` 内のCSS / app logic / 科目A問題 / 教材 / 科目Bデータの実境界を特定する
2. `index.html` をstatic shell化する際に最初に外へ出して安全な責務を1つ選び、小さな分割から始める
3. app schema versionとは別のcontent/asset versionとmanifestを設計する
4. Service Workerのprecache / runtime cache / update順序を、asset欠損時の復旧導線を含めて固定する
5. v340以前のprofileをそのまま読み、オンライン初回・オフライン再起動・更新直後の3経路を回帰する
6. 数値目標の1MB未満だけを追わず、起動速度・壊れにくさ・GitHub Pages互換性を優先して段階的に進める

`buildBFinal` と `subjectBHubRecommendation` の3段ラップは既知の内部負債として残っているが、v341では配信境界を明確にすることを主目的とし、無関係な大規模リファクタリングを同時に行わない。
'''
t=t[:pos]+next_section
p.write_text(t)
print('FE_QUEST_DEVELOPMENT_PLAN updated to current=v340 next=v341')
