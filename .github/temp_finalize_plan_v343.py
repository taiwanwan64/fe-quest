from pathlib import Path
import re
p=Path('FE_QUEST_DEVELOPMENT_PLAN.md')
text=p.read_text()
text=text.replace('v342で商用基盤が安定した後に着手する。','v342の商用基盤がproductionで安定したため、以下へ進む。',1)
old='### v343 — 適応学習の精度向上 ✅ 第1段階完了（2026-08-23）'
assert old in text
text=text.replace(old,'### v343 — 適応学習の精度向上 ✅ 完了（2026-08-23）',1)
old_tail='残るv343候補は「週次の伸び・減速を自動調整へ利用」の検討。精度改善が明確でない場合は無理に追加せず、v344へ進む。'
assert old_tail in text
new_tail='週次トレンド候補は追加監査を実施した結果、通常runtimeがquiz session 20件・各session log 10件・mock history 10件へ履歴を制限しており、活発な学習者では「直近7日 vs その前7日」の前半windowが欠け得ると判明した。`qStats` の集計値から欠損した日別履歴は復元できないため、**不完全な週次データを今日の学習重みに使う変更はv343では見送った。** これによりv343はevidence-confidence guardを完成形として終了し、v344へ進む。詳細: `audits/V343_WEEKLY_TREND_AUDIT.md`。'
text=text.replace(old_tail,new_tail,1)
pattern=r'## 10\. 直近の次アクション\n[\s\S]*\Z'
assert re.search(pattern,text)
next_action="""## 10. 直近の次アクション

**現行productionは v343。次の正式タスクは v344「学習成果の見せ方」。**

優先順:

1. 既存データだけで安全に表示できる「最近の学習結果」を棚卸しし、週次レポートの根拠と欠損条件を先に定義する
2. 「今週伸びた分野」「次に伸ばす分野」「必要ペース変化」を、記録範囲が不足する場合は断定せず表示できる設計にする
3. v343監査で判明した履歴capを無視して7日対7日の完全比較を装わない。必要なら「最近記録された学習」など実データ範囲に一致する表現を使う
4. readinessは引き続きFE QUEST独自の準備度として扱い、合格確率とは表示しない
5. 710問、profile schema v5互換、クラウド同期、復旧センター、JSONエクスポート、オフライン起動、Subject B semanticsを回帰保護する

既知の内部負債 `buildBFinal` / `subjectBHubRecommendation` の残るwrapperは追跡を続けるが、v344ではまず学習成果の見せ方とデータ根拠の整合性を優先する。
"""
text=re.sub(pattern,next_action,text,count=1)
p.write_text(text)
print('FE_QUEST_DEVELOPMENT_PLAN finalized for completed v343')
