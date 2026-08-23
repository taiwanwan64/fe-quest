from pathlib import Path
import re

p=Path('FE_QUEST_DEVELOPMENT_PLAN.md')
text=p.read_text()

old_header="""最終更新: 2026-08-22  
現行アプリ: **v341**  
リポジトリ: `taiwanwan64/fe-quest`  
次の計画バージョン: **v342**"""
new_header="""最終更新: 2026-08-23  
現行アプリ: **v343**  
リポジトリ: `taiwanwan64/fe-quest`  
次の計画バージョン: **v344**"""
assert old_header in text
text=text.replace(old_header,new_header,1)

# Mark v342 complete and append the production result immediately before the next section.
text=text.replace('# v342 — アカウント / クラウド同期 基盤\n','# v342 — アカウント / クラウド同期 基盤 ✅ 完了（2026-08-23）\n',1)
marker='\n---\n\n## 5. v343以降の候補'
assert marker in text
v342_result="""

### v342 完了結果

- Supabase を用いたメールMagic Link + PKCE認証、RLS、CAS更新RPCを実装し、ブラウザにservice role等の秘密情報を置かない構成にした。
- ローカルファーストを維持し、未ログイン・クラウド停止時でも従来どおり学習可能。同期は明示的に有効化し、競合時はローカル/クラウドのどちらを使うか利用者が選ぶ。
- 初回クラウド取り込み、端末間継続、オフライン→再接続、競合解決、ログアウト、アカウント削除、JSONエクスポート/復旧センターの共存を確認した。
- production は versioned split assets + 15個の同一originクラウドruntimeをService Workerで保持し、v342として公開。
- profile schema v5、710問、科目B意味契約、保存/復旧契約を維持した。
- v343以降もクラウドruntimeを自動継承するrelease toolingを追加した。
"""
text=text.replace(marker,v342_result+marker,1)

# Update v343 status while preserving the original candidate bullets as historical intent.
old_v343='### v343 — 適応学習の精度向上\n'
assert old_v343 in text
text=text.replace(old_v343,'### v343 — 適応学習の精度向上 ✅ 第1段階完了（2026-08-23）\n',1)

v344_marker='\n### v344 — 学習成果の見せ方'
assert v344_marker in text
v343_result="""

#### v343 第1段階完了結果

- 既存の `qStats` / `mockMistakeStats` に保存済みの誤答理由・回答時間・反復誤答を棚卸しし、新しいprofile項目を増やさず精度向上できることを確認。
- 誤答理由1件だけで「計算ミス」「読み違い」等の専用処方へ飛ばさず、複数問題かつ最近の同理由がある場合にのみ理由別処方を採用するようにした。
- `時間不足` は、単発申告なら実測回答時間と弱い正答率が一致した場合だけ速度練習へ進める。実測が速い場合は自己申告だけで速度練習へ固定しない。
- 「遅いが正解できている」学習者を回答時間だけで速度不足と判定しない。
- 理由の根拠が弱くても反復誤答が続く場合は、反復復習を優先する。
- `recommendedPrescription()` を追加wrapperで包まず、v343 release生成時に単一の名前付き実装として置換し、技術的負債を増やさない構造にした。
- v343 release validation: 710問、正答位置 178/178/177/177、認知レベル 166/323/221、current contract 71/71、Browser UI contract 23、Subject B semantics、runtime failures 0、fresh first-run、Safari日付入力補正、クラウドruntime継承をPASS。
- profile schemaはv5のまま。productionをv343へ更新済み。

残るv343候補は「週次の伸び・減速を自動調整へ利用」の検討。精度改善が明確でない場合は無理に追加せず、v344へ進む。
"""
text=text.replace(v344_marker,v343_result+v344_marker,1)

# Replace the stale next-action section (it is the final section of the document).
pattern=r'## 10\. 直近の次アクション\n[\s\S]*\Z'
assert re.search(pattern,text)
next_action="""## 10. 直近の次アクション

**現行productionは v343。次の正式候補は v343の残り精度改善を小さく検証し、その価値が薄ければ v344「学習成果の見せ方」へ進む。**

優先順:

1. 直近7日とその前7日の学習実績から、十分なサンプルがある場合だけ「伸び / 減速」を安定して判定できるかauditする
2. 週次トレンドを自動計画へ入れる場合も、既存の弱点・忘却・試験日・科目B進捗を上書きせず、小さな補正に限定する
3. サンプル不足やノイズが大きい場合はv343へ追加せず、現在のevidence-confidence guardを完成形とする
4. v344では週次レポート、今週伸びた分野、次に伸ばす分野、必要ペース変化を「合格確率」と誤認させない形で設計する
5. v343/v344でも710問、profile schema v5互換、クラウド同期、復旧センター、JSONエクスポート、オフライン起動を回帰保護する

既知の内部負債 `buildBFinal` / `subjectBHubRecommendation` の残るwrapperは追跡を続けるが、学習価値に直結する改善と回帰安全性を優先する。
"""
text=re.sub(pattern,next_action,text,count=1)

p.write_text(text)
print('FE_QUEST_DEVELOPMENT_PLAN refreshed for production v343')
