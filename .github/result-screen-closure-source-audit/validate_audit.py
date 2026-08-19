from pathlib import Path
import hashlib,json,os,re,subprocess

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'result-screen-closure-source-audit-(v(\d+))',b);req(m,'bad v293 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def contexts(js,needle,radius=4500):
    out=[]
    for m in re.finditer(re.escape(needle),js):
        a=max(0,m.start()-radius);b=min(len(js),m.end()+radius);out.append(js[a:b])
    return out
def summarize(rows):
    terms=['function injectBMockReview','injectBMockReview =','injectBMockReview=','onclick','addEventListener','startBMiniMock','continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','renderPracticeNextCard','showScreen','復習','次','もう一度','ミニ模試']
    return [{'sha256':hashlib.sha256(x.encode()).hexdigest(),'markers':[t for t in terms if t in x],'length':len(x)} for x in rows]
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v293','v292'),'expects v292')
source=Path('audits/RESULT_SCREEN_DELEGATE_CHAIN_v292.txt');req(source.exists() and 'PASS — DELEGATE CHAIN CAPTURED' in source.read_text(),'v292 evidence missing')
expected={'.github/result-screen-closure-source-audit/validate_audit.py','.github/workflows/result-screen-closure-source-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cjs,pjs=scripts('_site/index.html'),scripts('_site_parent/index.html')
needle='injectBMockReview';crow=contexts(cjs,needle);prow=contexts(pjs,needle);req(len(crow)>=1 and len(crow)==len(prow),'injectBMockReview occurrence drift');req(crow==prow,'audit-only closure context drift')
# Also capture the older mini-mock renderer chain for direct comparison.
old='_renderBMockResultV230';cold=contexts(cjs,old,3000);pold=contexts(pjs,old,3000);req(cold==pold and cold,'older mini-mock renderer context missing/drift')
summary={'injectOccurrenceCount':len(crow),'injectContexts':summarize(crow),'oldRendererOccurrenceCount':len(cold),'oldRendererContexts':summarize(cold)}
alltext='\n'.join(crow)
route_terms=[t for t in ['onclick','addEventListener','startBMiniMock','continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','renderPracticeNextCard','showScreen'] if t in alltext]
copy_terms=[t for t in ['復習','次','もう一度','ミニ模試'] if t in alltext]
summary['routeTermsAcrossInjectContexts']=route_terms;summary['copyTermsAcrossInjectContexts']=copy_terms
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — CLOSURE SOURCE CAPTURED','summary':summary,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/result-screen-closure-source-v293.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
joined='\n\n===== injectBMockReview occurrence =====\n\n'.join(crow)
audit=f'''FE QUEST v293 — Result-Screen Closure Source Audit
=================================================

Result
------
PASS — CLOSURE SOURCE CAPTURED
Previous release: v292
Source main: {parent}
Learner-facing change in v293: none

Purpose
-------
v292 could follow the final-result delegate chain but could not eval the mini-mock helper injectBMockReview because it lives inside a closure. v293 therefore inspects the built production JavaScript text directly around every injectBMockReview occurrence, without changing runtime behavior.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Captured injectBMockReview contexts
-----------------------------------
{joined}

Regression
----------
No learner-facing code changed.
Every captured injectBMockReview and _renderBMockResultV230 context is byte-identical to v292.
Candidate/mechanical-reference six-file byte equality is enforced by the standard release validator.

Decision
--------
If the captured closure creates a clear review/continue/retry action, close the result-return UX sequence with no repair. If it only adds diagnostic detail and leaves no next action, make one minimal injection-layer repair that reuses the existing Subject B recommendation hub.
''';Path('audits').mkdir(exist_ok=True);Path('audits/RESULT_SCREEN_CLOSURE_SOURCE_v293.txt').write_text(audit);print(audit)
