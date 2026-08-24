from pathlib import Path
import json,re

ROOT=Path('.')
checks=[]
blockers=[]
notes=[]

def check(name,ok,detail=''):
    checks.append({'name':name,'pass':bool(ok),'detail':detail})
    if not ok:
        raise AssertionError(f'{name}: {detail}')

def exists_any(paths):
    return [p for p in paths if (ROOT/p).exists()]

index=(ROOT/'index.html').read_text()
sw=(ROOT/'sw.js').read_text()
public=(ROOT/'cloud/public-config-v342.js').read_text()
sync_ui=(ROOT/'cloud/sync-ui-v342.js').read_text()
app=(ROOT/'assets/app-v345.js').read_text()

check('production root is v345','app/base-shell-v345.html' in index and 'app/base-shell-v346.html' not in index)
check('service worker is v345',"const APP_VERSION = 'v345';" in sw and "fe-quest-v345-1" in sw)
check('profile schema remains v5',"const PROFILE_SCHEMA_VERSION = 5;" in app and 'PROFILE_SCHEMA_VERSION = 6' not in app)
check('v345 exam pace feature is materialized','V345_EXAM_PACE_PRESENTATION_SPEC' in app and '合格確率ではありません' in app)
check('cloud config is explicitly enabled',re.search(r'\benabled\s*:\s*true\b',public) is not None)
check('cloud endpoint is https',re.search(r"\burl\s*:\s*'https://",public) is not None)
check('magic-link redirect is production https',"redirectTo:'https://taiwanwan64.github.io/fe-quest/'" in public)
check('browser config uses a publishable key',re.search(r"\bpublishableKey\s*:\s*'sb_publishable_",public) is not None)
check('browser config contains no service-role assignment',re.search(r'\b(serviceRoleKey|service_role_key|serviceRole)\s*:',public,re.I) is None)
check('cloud sync remains optional/local-first','ログインしなくても、これまで通りこの端末だけで学習できます。' in sync_ui)
check('account deletion is learner-facing','data-sync-action="delete-account"' in sync_ui and 'アカウントとクラウド上の学習データを削除しました' in sync_ui)
check('conflict choice remains explicit','新しい学習履歴を自動で上書きしません。どちらを残すか選んでください。' in sync_ui)

policy_files=exists_any(['privacy.html','privacy.md','PRIVACY.md','docs/privacy.md','terms.html','terms.md','TERMS.md','docs/terms.md'])
feedback_files=exists_any(['feedback.html','SUPPORT.md','BETA_FEEDBACK.md','docs/beta-feedback.md','.github/ISSUE_TEMPLATE/bug_report.md','.github/ISSUE_TEMPLATE/feedback.md'])

if not policy_files:
    blockers.append({
        'id':'public-policy',
        'severity':'must-fix-before-invite',
        'summary':'公開プライバシー方針／β利用条件が未整備',
        'reason':'メール認証とクラウド学習データを扱うため、外部β招待前に保存内容・利用目的・削除方法・問い合わせ先を明示する必要がある。'
    })
else:
    notes.append({'id':'public-policy','files':policy_files})

if not feedback_files:
    blockers.append({
        'id':'feedback-route',
        'severity':'must-fix-before-invite',
        'summary':'外部β利用者向けの明示的なフィードバック／不具合報告導線が未整備',
        'reason':'10〜30人規模のβでは、問題発生時に学習データを壊さず再現情報を回収できる窓口が必要。'
    })
else:
    notes.append({'id':'feedback-route','files':feedback_files})

# Roadmap asks for day 1/3/7/30 retention and daily-plan value checks. The current app
# intentionally has no third-party product analytics. Do not silently add tracking during
# this audit; record the decision point so consent/privacy can be designed first.
blockers.append({
    'id':'beta-measurement-plan',
    'severity':'design-before-invite',
    'summary':'β評価指標の収集方法が未確定',
    'reason':'継続率・今日の学習利用率・価値実感を、第三者トラッキングを勝手に追加せず、同意を含む方法で決める必要がある。'
})

report={
    'name':'v346-external-beta-readiness-audit',
    'result':'READY_FOR_PREP_NOT_INVITES',
    'productionVersion':'v345',
    'profileSchema':5,
    'checks':checks,
    'blockers':blockers,
    'notes':notes,
    'recommendedNext':[
        '公開プライバシー方針／β利用条件を用意する',
        'βフィードバック導線と非機微な再現情報の収集方法を用意する',
        '10〜30人βの評価指標を、同意と最小収集の原則で定義する'
    ]
}

fixture=ROOT/'_regression/v346-external-beta-readiness.fixture.json'
if not fixture.exists():
    raise AssertionError('v346 beta readiness fixture missing')
expected=json.loads(fixture.read_text())
if expected!=report:
    print('EXPECTED='+json.dumps(expected,ensure_ascii=False,sort_keys=True))
    print('ACTUAL='+json.dumps(report,ensure_ascii=False,sort_keys=True))
    raise AssertionError('v346 beta readiness fixture drifted from the audited repository state')
print(f"PASS — {len(checks)}/{len(checks)} BASELINE CHECKS; {len(blockers)} BETA-READINESS ITEMS RECORDED")
