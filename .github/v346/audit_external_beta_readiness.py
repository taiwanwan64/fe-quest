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

index=(ROOT/'index.html').read_text()
sw=(ROOT/'sw.js').read_text()
public=(ROOT/'cloud/public-config-v342.js').read_text()
sync_ui=(ROOT/'cloud/sync-ui-v342.js').read_text()
app=(ROOT/'assets/app-v345.js').read_text()
privacy_path=ROOT/'privacy.html'
feedback_path=ROOT/'.github/ISSUE_TEMPLATE/beta-feedback.md'
measurement_path=ROOT/'docs/BETA_MEASUREMENT_PLAN_v346.md'

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

check('public privacy policy exists',privacy_path.exists())
privacy=privacy_path.read_text()
check('privacy policy reflects current v345 baseline','v345で公開中のローカルファースト学習・任意のクラウド同期・アカウント削除の実装を基準' in privacy)
check('privacy policy warns against sensitive public issue data','認証トークン' in privacy and 'JSONエクスポートの全文' in privacy and '公開Issue' in privacy)
check('privacy policy preserves no-third-party-analytics statement','第三者の行動分析SDKを組み込んでいません' in privacy)
notes.append({'id':'public-policy','files':['privacy.html'],'status':'current-v345-baseline'})

check('structured beta feedback template exists',feedback_path.exists())
feedback=feedback_path.read_text()
check('beta feedback avoids sensitive diagnostic dumps','認証トークン' in feedback and 'JSONエクスポート全文' in feedback and 'localStorage/IndexedDBの全文' in feedback)
check('beta feedback asks about learning-data impact','学習データへの影響' in feedback and 'クラウド同期' in feedback)
notes.append({'id':'feedback-route','files':['.github/ISSUE_TEMPLATE/beta-feedback.md'],'status':'structured-public-route'})

check('minimal beta measurement plan exists',measurement_path.exists())
measurement=measurement_path.read_text()
check('measurement plan avoids silent analytics','自動トラッキングを追加しない' in measurement and '第三者の行動分析SDK' in measurement)
check('measurement plan covers day 1 3 7 30','1日目' in measurement and '3日目' in measurement and '7日目' in measurement and '30日目' in measurement)
check('measurement plan tests FE QUEST core value','次に何を勉強するかを自分で考える負担が減ったか' in measurement)
check('measurement plan requires policy review before future analytics','privacy.html' in measurement and '実装より先に' in measurement)
notes.append({'id':'beta-measurement-plan','files':['docs/BETA_MEASUREMENT_PLAN_v346.md'],'status':'manual-minimal-consent-first'})

report={
    'name':'v346-external-beta-readiness-audit',
    'result':'BETA_PREP_GATES_CLEARED',
    'productionVersion':'v345',
    'profileSchema':5,
    'checks':checks,
    'blockers':blockers,
    'notes':notes,
    'recommendedNext':[
        '招待前にprivacy.htmlとβ運用文書を人が最終確認する',
        'βフィードバックIssueテンプレートを1件ドライランする',
        'production v345の既存回帰とクラウド同期を再確認してから10〜30人の小規模βを開始する'
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
print(f"PASS — {len(checks)}/{len(checks)} BETA-PREP CHECKS; {len(blockers)} OPEN BLOCKERS")
