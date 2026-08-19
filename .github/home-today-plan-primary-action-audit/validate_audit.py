from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'home-today-plan-primary-action-audit-(v(\d+))',b);req(m,'bad v288 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def candidate_names(path):
    js=scripts(path)
    names=set(re.findall(r'\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',js))|set(re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function\s*\(',js))
    pat=re.compile(r'(home|today|daily|plan|planner|focus|launch|continue)',re.I)
    return sorted(n for n in names if pat.search(n))

def runtime(path,names):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    names_json=json.dumps(names)
    tail=f'''
function sourceOf(name){{try{{const v=eval(name);return typeof v==='function'?String(v):null;}}catch(_){{return null;}}}}
const names={names_json};
const sources=Object.fromEntries(names.map(n=>[n,sourceOf(n)]));
console.log('__V288__'+Buffer.from(JSON.stringify({{v:APP_VERSION,sources,sem:validateSubjectBSemantics()}})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V288__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing')
        return json.loads(base64.b64decode(m.group(1)))

def calls(src):
    if not src:return []
    return sorted(set(re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',src)))-{'function','if','for','while','switch','catch'})

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v288','v287'),'expects v287')
source=Path('audits/DAILY_LEARNING_JOURNEY_ROUTE_v287.txt');req(source.exists() and 'PASS — ROUTE INVENTORY CAPTURED' in source.read_text(),'v287 evidence missing')
expected={'.github/home-today-plan-primary-action-audit/validate_audit.py','.github/workflows/home-today-plan-primary-action-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
names=candidate_names('_site/index.html');names_parent=candidate_names('_site_parent/index.html');req(names==names_parent,'candidate name drift')
cand,par=runtime('_site/index.html',names),runtime('_site_parent/index.html',names);req(cand['v']=='v288' and par['v']=='v287','versions');req(cand['sources']==par['sources'],'audit-only source drift');req(cand['sem'].get('ok') is True,'subject B semantics')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
s=cand['sources']
known=['buildTodayTasks','ensureTodayPlanSnapshot','nextUnfinishedDailyTask','launchDailyTask','renderDailyPlan','renderPlanFocus','renderPlannerScreen','renderHomeReviewCandidates','courseAContinueId']
present={k:bool(s.get(k)) for k in known}
for k in ['buildTodayTasks','nextUnfinishedDailyTask','launchDailyTask','renderDailyPlan','renderPlannerScreen']:req(present[k],f'missing {k}')
direct=[];launchers=[]
for n,src in s.items():
    if not src:continue
    if 'launchDailyTask' in src:launchers.append(n)
    if 'nextUnfinishedDailyTask' in src and 'launchDailyTask' in src:direct.append(n)
launcher_calls=calls(s.get('launchDailyTask'))
checks={
 'dailyPlanLaunchesTask':'launchDailyTask' in (s.get('renderDailyPlan') or ''),
 'dailyPlanFindsNext':'nextUnfinishedDailyTask' in (s.get('renderDailyPlan') or ''),
 'plannerRendersDailyPlan':'renderDailyPlan' in (s.get('renderPlannerScreen') or ''),
 'plannerRendersFocus':'renderPlanFocus' in (s.get('renderPlannerScreen') or ''),
 'directPrimaryFunctionCount':len(direct),
 'launchDailyTaskCalls':launcher_calls
}
# The audit is diagnostic: absence of a direct function is a finding, not a validator failure.
finding=None
if not checks['dailyPlanLaunchesTask'] or not checks['dailyPlanFindsNext']:
    finding='Daily-plan renderer does not both resolve and launch the next unfinished task directly.'
elif len(direct)==0:
    finding='No home/today/plan function combines next-unfinished resolution with direct launch; inspect for an extra-tap path.'
summary={'present':present,'checks':checks,'functionsCallingLaunchDailyTask':launchers,'directPrimaryFunctions':direct,'candidateFunctions':names,'finding':finding}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — PRIMARY-ACTION EVIDENCE CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/home-today-plan-primary-action-v288.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v288 — Home / Today / Plan Primary-Action Audit
=========================================================

Result
------
PASS — PRIMARY-ACTION EVIDENCE CAPTURED
Previous release: v287
Source main: {parent}
Learner-facing change in v288: none

Purpose
-------
v287 confirmed that FE QUEST already has reusable next-action routing. v288 narrows the question to the daily entry journey: whether the app's today/plan path can identify the highest-priority unfinished task and launch it through the existing daily-task launcher without introducing another dashboard.

Known function presence
-----------------------
{json.dumps(present,ensure_ascii=False,indent=2)}

Primary-action checks
---------------------
{json.dumps(checks,ensure_ascii=False,indent=2)}

Functions calling launchDailyTask
---------------------------------
{json.dumps(launchers,ensure_ascii=False,indent=2)}

Functions combining nextUnfinishedDailyTask + launchDailyTask
------------------------------------------------------------
{json.dumps(direct,ensure_ascii=False,indent=2)}

Diagnostic finding
------------------
{finding or 'None. The existing daily-plan path already resolves the next unfinished task and launches it through the shared launcher.'}

launchDailyTask call inventory
------------------------------
{json.dumps(launcher_calls,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing code changed.
All audited home/today/plan function sources are equivalent to v287.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If there is no finding, preserve the current entry architecture and move to result-screen return paths or content quality. If a finding exists, repair only the shortest concrete extra-tap/dead-end path while reusing nextUnfinishedDailyTask and launchDailyTask; do not add another learner-facing dashboard.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/HOME_TODAY_PLAN_PRIMARY_ACTION_v288.txt').write_text(audit);print(audit)
