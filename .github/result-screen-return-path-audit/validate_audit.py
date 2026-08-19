from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'result-screen-return-path-audit-(v(\d+))',b);req(m,'bad v290 branch');return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def candidate_names(path):
    js=scripts(path);names=set(re.findall(r'\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',js))|set(re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function\s*\(',js))
    pat=re.compile(r'(result|finish|review)',re.I)
    return sorted(n for n in names if pat.search(n))

def runtime(path,names):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=f'''
function sourceOf(name){{try{{const v=eval(name);return typeof v==='function'?String(v):null;}}catch(_){{return null;}}}}
const names={json.dumps(names)};
const sources=Object.fromEntries(names.map(n=>[n,sourceOf(n)]));
console.log('__V290__'+Buffer.from(JSON.stringify({{v:APP_VERSION,sources,sem:validateSubjectBSemantics()}})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V290__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

def route_markers(src):
    if not src:return []
    markers=['launchDailyTask','continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','renderPracticeNextCard','renderAnalyticsNext','startMockReview','startJourneyAction','showScreen','renderPlannerScreen','renderSubjectBHub','renderBFinalReadiness','renderSecurityNextCard','renderTraceNextCard','onclick']
    return [m for m in markers if m in src]

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v290','v289'),'expects v289')
source=Path('audits/HOME_TODAY_PLAN_PRIMARY_ACTION_DETAIL_v289.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v289 evidence missing')
expected={'.github/result-screen-return-path-audit/validate_audit.py','.github/workflows/result-screen-return-path-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
names=candidate_names('_site/index.html');names_parent=candidate_names('_site_parent/index.html');req(names==names_parent,'candidate name drift')
cand,par=runtime('_site/index.html',names),runtime('_site_parent/index.html',names);req(cand['v']=='v290' and par['v']=='v289','versions');req(cand['sources']==par['sources'],'audit-only source drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
s=cand['sources']
major_names=['renderMockResult','renderBMockResult','renderBFinalResult','renderSecurityMockResult','renderCompoundResult','finishMock','finishBMiniMock','finishBFinal','finishSecurityMock','finishCompoundChallenge','finishMockReview']
major={n:{'present':bool(s.get(n)),'markers':route_markers(s.get(n))} for n in major_names}
result_renderers=[n for n in names if re.search(r'render.*Result',n,re.I) and s.get(n)]
renderer_routes={n:route_markers(s.get(n)) for n in result_renderers}
no_route=[n for n,m in renderer_routes.items() if not m]
# wrappers/injection helpers may supply actions outside the renderer, so no_route is diagnostic only.
checks={
 'aMockResultPresent':major['renderMockResult']['present'],
 'bMiniResultPresent':major['renderBMockResult']['present'],
 'bFinalResultPresent':major['renderBFinalResult']['present'],
 'allKnownFinishFunctionsPresent':all(major[n]['present'] for n in ['finishMock','finishBMiniMock','finishBFinal','finishSecurityMock','finishCompoundChallenge']),
 'resultRendererCount':len(result_renderers),
 'resultRenderersWithoutInlineRouteMarkers':no_route
}
req(checks['aMockResultPresent'] and checks['bMiniResultPresent'] and checks['bFinalResultPresent'] and checks['allKnownFinishFunctionsPresent'],'major result lifecycle missing')
summary={'checks':checks,'major':major,'rendererRoutes':renderer_routes,'candidateNames':names}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — RETURN-PATH INVENTORY CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/result-screen-return-path-v290.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v290 — Result-Screen Return-Path Audit
================================================

Result
------
PASS — RETURN-PATH INVENTORY CAPTURED
Previous release: v289
Source main: {parent}
Learner-facing change in v290: none

Purpose
-------
v289 closed the home/today/plan extra-tap concern: the visible daily-plan and plan-focus buttons already resolve the next unfinished task locally and launch it directly. v290 now audits what happens after learning: whether major result/review renderers expose or connect to an existing guided next action instead of leaving the learner at a dead end.

Major result lifecycle
----------------------
{json.dumps(major,ensure_ascii=False,indent=2)}

Result renderer route markers
-----------------------------
{json.dumps(renderer_routes,ensure_ascii=False,indent=2)}

Checks
------
{json.dumps(checks,ensure_ascii=False,indent=2)}

Interpretation boundary
-----------------------
A renderer with no inline route marker is not automatically a defect because later wrappers/injection helpers can add the learner-facing action. v290 therefore treats that list as a target for source-detail follow-up, not as a repair instruction.

Regression
----------
No learner-facing code changed.
All captured result/review sources are equivalent to v289.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Inspect only the major result renderers that lack an inline route marker and their installed wrappers. Repair a screen only if the final composed learner UI truly lacks a clear next action; otherwise close the result-return audit and move to learning-content quality.
''';Path('audits').mkdir(exist_ok=True);Path('audits/RESULT_SCREEN_RETURN_PATH_v290.txt').write_text(audit);print(audit)
