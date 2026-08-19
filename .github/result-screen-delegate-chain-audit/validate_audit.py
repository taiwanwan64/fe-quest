from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'result-screen-delegate-chain-audit-(v(\d+))',b);req(m,'bad v292 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function sourceOf(name){try{const v=eval(name);return typeof v==='function'?String(v):null;}catch(_){return null;}}
function callees(src){if(!src)return [];const out=[...src.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)].map(m=>m[1]);const skip=new Set(['function','if','for','while','switch','catch','map','filter','forEach','find','some','every','reduce','slice','join','includes','querySelector','querySelectorAll','getElementById','String','Number','Boolean','Object','Array','Set','Map','Date','Math','JSON','Promise','parseInt','parseFloat','setTimeout','clearTimeout']);return [...new Set(out.filter(x=>!skip.has(x)))];}
function crawl(seeds,maxDepth){const rows={},q=seeds.map(n=>[n,0]);while(q.length&&Object.keys(rows).length<120){const [n,d]=q.shift();if(rows[n])continue;const src=sourceOf(n);if(!src)continue;const cs=callees(src);rows[n]={depth:d,source:src,callees:cs};if(d<maxDepth)cs.forEach(c=>q.push([c,d+1]));}return rows;}
const mock=crawl(['renderBMockResult','injectBMockReview','_renderBMockResultV230'],4);
const final=crawl(['renderBFinalResult','__renderBFinalResultBeforeV245','continueSubjectBFlow','renderBFinalReadiness'],4);
console.log('__V292__'+Buffer.from(JSON.stringify({v:APP_VERSION,mock,final,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V292__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def markers(src):
    terms=['onclick','addEventListener','continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','renderPracticeNextCard','renderBFinalReadiness','startMockReview','startBMiniMock','startBFinal','showScreen','injectBMockReview','injectFinalReview','bMockReview','bFinalReview','次','復習','総合実戦','ミニ模試']
    return [t for t in terms if t in (src or '')]
def summarize(graph):
    return {n:{'depth':r['depth'],'callees':r['callees'],'markers':markers(r['source'])} for n,r in graph.items()}
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v292','v291'),'expects v291')
source=Path('audits/RESULT_SCREEN_WRAPPER_DETAIL_v291.txt');req(source.exists() and 'PASS — WRAPPER DETAIL CAPTURED' in source.read_text(),'v291 evidence missing')
expected={'.github/result-screen-delegate-chain-audit/validate_audit.py','.github/workflows/result-screen-delegate-chain-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v292' and par['v']=='v291','versions');req(cand['mock']==par['mock'] and cand['final']==par['final'],'audit-only source drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
req('renderBMockResult' in cand['mock'] and 'renderBFinalResult' in cand['final'],'root renderers missing')
mock_summary=summarize(cand['mock']);final_summary=summarize(cand['final'])
mock_route=[n for n,r in mock_summary.items() if any(m in r['markers'] for m in ['onclick','addEventListener','continueSubjectBFlow','launchSubjectBRecommendation','renderPracticeNextCard','startMockReview','startBMiniMock','showScreen'])]
final_route=[n for n,r in final_summary.items() if any(m in r['markers'] for m in ['onclick','addEventListener','continueSubjectBFlow','launchSubjectBRecommendation','renderBFinalReadiness','startBFinal','showScreen'])]
summary={'mock':mock_summary,'final':final_summary,'mockRouteCapable':mock_route,'finalRouteCapable':final_route}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DELEGATE CHAIN CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/result-screen-delegate-chain-v292.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
def excerpts(graph,names):
    out=[]
    for n in names:
        if n in graph:out.append(f'Exact {n}\n'+('-'*(6+len(n)))+'\n'+graph[n]['source'])
    return '\n\n'.join(out)
mock_interest=[n for n in cand['mock'] if n in mock_route or n in ['renderBMockResult','injectBMockReview','_renderBMockResultV230']]
final_interest=[n for n in cand['final'] if n in final_route or n in ['renderBFinalResult','__renderBFinalResultBeforeV245','continueSubjectBFlow','renderBFinalReadiness']]
audit=f'''FE QUEST v292 — Result-Screen Delegate Chain Audit
===================================================

Result
------
PASS — DELEGATE CHAIN CAPTURED
Previous release: v291
Source main: {parent}
Learner-facing change in v292: none

Purpose
-------
v291 showed that the visible mini-mock renderer delegates to injectBMockReview and that the final renderer wraps an earlier implementation. v292 recursively follows those production delegates so route actions supplied by arrow functions, older wrappers or injection helpers are not missed by static declaration-name discovery.

Mini-mock delegate graph
------------------------
{json.dumps(mock_summary,ensure_ascii=False,indent=2)}

Mini-mock route-capable functions
---------------------------------
{json.dumps(mock_route,ensure_ascii=False,indent=2)}

Final delegate graph
--------------------
{json.dumps(final_summary,ensure_ascii=False,indent=2)}

Final route-capable functions
-----------------------------
{json.dumps(final_route,ensure_ascii=False,indent=2)}

Selected mini-mock sources
--------------------------
{excerpts(cand['mock'],mock_interest)}

Selected final sources
----------------------
{excerpts(cand['final'],final_interest)}

Regression
----------
No learner-facing code changed.
Delegate graphs and sources are equivalent to v291.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If both graphs contain an existing learner-facing route-capable helper attached to the result lifecycle, close this UX sequence without repair. If one graph has no such helper, make one minimal change at that existing injection/wrapper boundary and preserve the established Subject B recommendation hub.
''';Path('audits').mkdir(exist_ok=True);Path('audits/RESULT_SCREEN_DELEGATE_CHAIN_v292.txt').write_text(audit);print(audit)
