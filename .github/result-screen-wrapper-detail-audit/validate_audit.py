from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'result-screen-wrapper-detail-audit-(v(\d+))',b);req(m,'bad v291 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def candidate_names(path):
    js=scripts(path);names=set(re.findall(r'\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',js))|set(re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function\s*\(',js))
    pat=re.compile(r'(result|review|handoff|next|inject|install|continue|recommend)',re.I);return sorted(n for n in names if pat.search(n))
def runtime(path,names):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=f'''
function sourceOf(name){{try{{const v=eval(name);return typeof v==='function'?String(v):null;}}catch(_){{return null;}}}}
const names={json.dumps(names)};const sources=Object.fromEntries(names.map(n=>[n,sourceOf(n)]));
console.log('__V291__'+Buffer.from(JSON.stringify({{v:APP_VERSION,sources,sem:validateSubjectBSemantics()}})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V291__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def markers(src):
    if not src:return []
    ms=['renderBMockResult','renderBFinalResult','continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','renderPracticeNextCard','renderBFinalReadiness','renderSecurityNextCard','renderTraceNextCard','startMockReview','injectBMockReview','injectFinalReview','installSubjectBFinalHandoffV273','showScreen','onclick']
    return [m for m in ms if m in src]
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v291','v290'),'expects v290')
source=Path('audits/RESULT_SCREEN_RETURN_PATH_v290.txt');req(source.exists() and 'PASS — RETURN-PATH INVENTORY CAPTURED' in source.read_text(),'v290 evidence missing')
expected={'.github/result-screen-wrapper-detail-audit/validate_audit.py','.github/workflows/result-screen-wrapper-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
names=candidate_names('_site/index.html');req(names==candidate_names('_site_parent/index.html'),'name drift');cand,par=runtime('_site/index.html',names),runtime('_site_parent/index.html',names);req(cand['v']=='v291' and par['v']=='v290','versions');req(cand['sources']==par['sources'],'audit-only source drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
s=cand['sources'];req(s.get('renderBMockResult') and s.get('renderBFinalResult'),'target renderers missing')
deps={}
for target in ['renderBMockResult','renderBFinalResult']:
    rows=[]
    for n,src in s.items():
        if src and n!=target and target in src:rows.append({'name':n,'markers':markers(src)})
    deps[target]=rows
related={n:{'markers':markers(src),'source':src} for n,src in s.items() if src and (n in ['renderBMockResult','renderBFinalResult','injectBMockReview','injectFinalReview','installSubjectBFinalHandoffV273','continueSubjectBFlow','renderPracticeNextCard','renderBFinalReadiness'] or 'renderBMockResult' in src or 'renderBFinalResult' in src)}
route_capable=[]
for target,rows in deps.items():
    for r in rows:
        if any(m in r['markers'] for m in ['continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','renderPracticeNextCard','renderBFinalReadiness','showScreen','onclick']):route_capable.append((target,r['name']))
summary={'dependencies':deps,'routeCapableDependents':route_capable,'relatedNames':sorted(related)}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — WRAPPER DETAIL CAPTURED','summary':summary,'related':related,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/result-screen-wrapper-detail-v291.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
sections=[]
for n in sorted(related):sections.append(f'Exact {n}\n'+('-'*(6+len(n)))+'\n'+related[n]['source'])
audit=f'''FE QUEST v291 — Result-Screen Wrapper / Composed Return-Path Detail Audit
=======================================================================

Result
------
PASS — WRAPPER DETAIL CAPTURED
Previous release: v290
Source main: {parent}
Learner-facing change in v291: none

Purpose
-------
v290 found that renderBMockResult and renderBFinalResult contain no inline guided-route markers. v291 inspects the functions that call or wrap those renderers and the known review/handoff installers so the final composed learner UI can be judged before any repair.

Dependencies by renderer
------------------------
{json.dumps(deps,ensure_ascii=False,indent=2)}

Route-capable dependents
------------------------
{json.dumps(route_capable,ensure_ascii=False,indent=2)}

Related source names
--------------------
{json.dumps(sorted(related),ensure_ascii=False,indent=2)}

'''+('\n\n'.join(sections))+f'''

Regression
----------
No learner-facing code changed.
All captured result/wrapper sources are equivalent to v290.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If the composed wrappers already inject one clear review/continue action for both mini mock and final, close the result-return sequence without UI changes. If either renderer has no route-capable dependent, perform one minimal repair at the existing wrapper/injection layer rather than redesigning the result screen.
''';Path('audits').mkdir(exist_ok=True);Path('audits/RESULT_SCREEN_WRAPPER_DETAIL_v291.txt').write_text(audit);print(audit)
