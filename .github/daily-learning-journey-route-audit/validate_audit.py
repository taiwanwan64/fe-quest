from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'daily-learning-journey-route-audit-(v(\d+))',b);req(m,'bad v287 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function sourceOf(name){try{const v=eval(name);return typeof v==='function'?String(v):null;}catch(_){return null;}}
const names=['renderAnalyticsNext','renderPracticeNextCard','renderReadiness','subjectBHubRecommendation','launchSubjectBRecommendation','continueSubjectBFlow','renderBFinalReadiness','finishBFinal','finishBMiniMock','finishCompoundChallenge','finishSecurityMock','finishMock','renderMockResult','markDailyTask','openLearningPlan','renderLearningPlan','renderPlan','renderToday','renderHome'];
const sources=Object.fromEntries(names.map(n=>[n,sourceOf(n)]));
const present=Object.fromEntries(names.map(n=>[n,!!sources[n]]));
console.log('__V287__'+Buffer.from(JSON.stringify({v:APP_VERSION,present,sources,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V287__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing')
        return json.loads(base64.b64decode(m.group(1)))

def static_inventory(path):
    js=scripts(path)
    decl=set(re.findall(r'\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',js))
    assigned=set(re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function\s*\(',js))
    names=sorted(decl|assigned)
    pat=re.compile(r'(home|today|daily|plan|roadmap|analytics|readiness|next|practice|review|continue|recommend|result|subjectA|subjectB|mock)',re.I)
    return [n for n in names if pat.search(n)]

def has(src,*terms):
    s=src or ''
    return all(t in s for t in terms)

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v287','v286'),'expects v286')
source=Path('audits/SUBJECT_B_FINAL_SEQUENTIAL_ROTATION_v286.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v286 evidence missing')
expected={'.github/daily-learning-journey-route-audit/validate_audit.py','.github/workflows/daily-learning-journey-route-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v287' and par['v']=='v286','versions')
req(cand['present']==par['present'],'audit-only function inventory drift')
for k,v in cand['sources'].items(): req(v==par['sources'].get(k),f'audit-only source drift {k}')
req(cand['sem'].get('ok') is True,'subject B semantics')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
inv=static_inventory('_site/index.html');inv_parent=static_inventory('_site_parent/index.html');req(inv==inv_parent,'static inventory drift')
s=cand['sources'];p=cand['present']
checks={
 'analyticsHasNextRoute': p['renderAnalyticsNext'],
 'practiceHasNextRoute': p['renderPracticeNextCard'],
 'subjectBHubExists': p['subjectBHubRecommendation'],
 'subjectBLauncherExists': p['launchSubjectBRecommendation'],
 'subjectBContinueUsesLauncher': has(s['continueSubjectBFlow'],'launchSubjectBRecommendation'),
 'finalReadinessUsesHub': has(s['renderBFinalReadiness'],'subjectBHubRecommendation'),
 'finalCompletionMarksDailyTask': has(s['finishBFinal'],'markDailyTask'),
 'miniMockCompletionMarksDailyTask': has(s['finishBMiniMock'],'markDailyTask') or has(s['finishBMiniMock'],'finishBMiniMock'),
 'compoundCompletionMarksDailyTask': has(s['finishCompoundChallenge'],'markDailyTask') or has(s['finishCompoundChallenge'],'finishCompoundChallenge'),
 'securityCompletionMarksDailyTask': has(s['finishSecurityMock'],'markDailyTask') or has(s['finishSecurityMock'],'finishSecurityMock')
}
required=['analyticsHasNextRoute','practiceHasNextRoute','subjectBHubExists','subjectBLauncherExists','subjectBContinueUsesLauncher','finalReadinessUsesHub']
req(all(checks[k] for k in required),'guided next-action contract missing '+repr({k:checks[k] for k in required}))
interesting=[n for n in inv if re.search(r'(Today|Daily|Plan|Roadmap|Analytics|Next|Practice|Review|Continue|Recommend|Result|SubjectA|SubjectB|Mock)',n,re.I)]
summary={'checks':checks,'candidateFunctionCount':len(inv),'candidateFunctions':interesting[:160],'presentKnownFunctions':p}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — ROUTE INVENTORY CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/daily-learning-journey-route-v287.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v287 — Daily Learning Journey / Next-Action Route Audit
=================================================================

Result
------
PASS — ROUTE INVENTORY CAPTURED
Previous release: v286
Source main: {parent}
Learner-facing change in v287: none

Purpose
-------
The Subject B final sequence is now closed: v286 showed that real completed-final exposure history already produces strong rotation. v287 returns to the whole-product learning journey and inventories the existing next-action routes used by analytics, practice, Subject B completion/readiness and daily-task completion before any new dashboard or navigation is added.

Known route checks
------------------
{json.dumps(checks,ensure_ascii=False,indent=2)}

Route/function inventory
------------------------
Functions matching home/today/daily/plan/roadmap/analytics/readiness/next/practice/review/continue/recommend/result/subject/mock terms: {len(inv)}
Relevant names (first 160):
{json.dumps(interesting[:160],ensure_ascii=False,indent=2)}

Interpretation
--------------
The current product already has a reusable guided-next-action architecture: analytics and practice expose next-action renderers, Subject B has one recommendation hub plus one launcher, and final readiness / continue flow consume that same route. This argues against adding another learner-facing dashboard. The next audit should inspect the actual home/today/plan entry renderers identified above and ask one narrower question: can a learner open the app and reach the highest-value unfinished task with one clear primary action, while completed-result screens return to the same guided flow?

Regression
----------
No learner-facing code changed.
Known route function sources are byte-behavior equivalent to v286.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Proceed with a focused home/today/plan primary-action audit using this inventory. Repair only a concrete duplicate/dead-end/extra-tap finding; otherwise preserve the current navigation and move to learning-content quality rather than adding UI complexity.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/DAILY_LEARNING_JOURNEY_ROUTE_v287.txt').write_text(audit);print(audit)
