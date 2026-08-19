from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'home-today-plan-primary-action-detail-audit-(v(\d+))',b);req(m,'bad v289 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function sourceOf(name){try{const v=eval(name);return typeof v==='function'?String(v):null;}catch(_){return null;}}
const names=['buildTodayTasks','ensureTodayPlanSnapshot','nextUnfinishedDailyTask','launchDailyTask','renderDailyPlan','renderPlanFocus','renderPlannerScreen','renderHomeReviewCandidates','courseAContinueId'];
const sources=Object.fromEntries(names.map(n=>[n,sourceOf(n)]));
console.log('__V289__'+Buffer.from(JSON.stringify({v:APP_VERSION,sources,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V289__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v289','v288'),'expects v288')
source=Path('audits/HOME_TODAY_PLAN_PRIMARY_ACTION_v288.txt');req(source.exists() and 'PASS — PRIMARY-ACTION EVIDENCE CAPTURED' in source.read_text(),'v288 evidence missing')
expected={'.github/home-today-plan-primary-action-detail-audit/validate_audit.py','.github/workflows/home-today-plan-primary-action-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v289' and par['v']=='v288','versions');req(cand['sources']==par['sources'],'audit-only source drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
s=cand['sources'];req(all(s.values()),'known source missing')
observed={
 'nextReturnsTaskOrNull':'return' in s['nextUnfinishedDailyTask'],
 'dailyPlanUsesLaunchDailyTask':'launchDailyTask' in s['renderDailyPlan'],
 'planFocusUsesLaunchDailyTask':'launchDailyTask' in s['renderPlanFocus'],
 'dailyPlanUsesNextUnfinished':'nextUnfinishedDailyTask' in s['renderDailyPlan'],
 'planFocusUsesNextUnfinished':'nextUnfinishedDailyTask' in s['renderPlanFocus'],
 'plannerCallsDailyPlan':'renderDailyPlan' in s['renderPlannerScreen'],
 'plannerCallsPlanFocus':'renderPlanFocus' in s['renderPlannerScreen'],
 'homeReviewOnly':'review' in s['renderHomeReviewCandidates'].lower()
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','observed':observed,'sources':s,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/home-today-plan-primary-action-detail-v289.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
parts=[]
for name in ['nextUnfinishedDailyTask','launchDailyTask','renderDailyPlan','renderPlanFocus','renderPlannerScreen','buildTodayTasks','ensureTodayPlanSnapshot','courseAContinueId','renderHomeReviewCandidates']:
    parts.append(f'Exact {name}\n'+'-'*(6+len(name))+'\n'+s[name])
audit=f'''FE QUEST v289 — Home / Today / Plan Primary-Action Detail Audit
================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v288
Source main: {parent}
Learner-facing change in v289: none

Purpose
-------
v288 found that the audited daily-plan path does not combine nextUnfinishedDailyTask with launchDailyTask. v289 captures the exact production sources before deciding whether that is a real extra tap or simply a separation of responsibilities between renderers.

Observed source relationships
-----------------------------
{json.dumps(observed,ensure_ascii=False,indent=2)}

'''+('\n\n'.join(parts))+f'''

Regression
----------
No learner-facing code changed.
All captured sources are byte-behavior equivalent to v288.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the exact source above to identify the real learner-visible primary button and its task source. Only repair if the visible primary action requires an avoidable intermediate selection; otherwise close the entry-flow finding and move to result-screen return paths or learning-content quality.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/HOME_TODAY_PLAN_PRIMARY_ACTION_DETAIL_v289.txt').write_text(audit);print(audit)
