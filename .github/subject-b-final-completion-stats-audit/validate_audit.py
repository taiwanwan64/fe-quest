from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-b-final-completion-stats-audit-(v(\d+))',b);req(m,'bad v285 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function sig(){const rows=[];for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x285000+i)>>>0);rows.push(buildBFinal().map(x=>[x.kind,x.sourceId]));}return hashText(JSON.stringify(rows));}
const inner=String(_finishBFinalV65);
console.log('__V285__'+Buffer.from(JSON.stringify({v:APP_VERSION,innerFinishSource:inner,pre254Source:String(__finishBFinalV254),seenSource:String(bFinalAlgoSeen),pickSource:String(pickFinalAlgoCandidate),selectionSig:sig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V285__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v285','v284'),'expects v284')
source=Path('audits/SUBJECT_B_FINAL_EXPOSURE_LIFECYCLE_v284.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v284 evidence missing')
expected={'.github/subject-b-final-completion-stats-audit/validate_audit.py','.github/workflows/subject-b-final-completion-stats-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v285' and par['v']=='v284','versions')
for k in ['innerFinishSource','pre254Source','seenSource','pickSource','selectionSig','contract']:req(cand[k]==par[k],f'audit-only runtime drift {k}')
req(cand['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
inner=cand['innerFinishSource'];calls=sorted(set(re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',inner))-{'function','if','for','while','switch','catch'})
ev={'mentionsBFinalStats':'bFinalStats' in inner,'mentionsAlgoNamespace':'algo:' in inner,'mentionsSeen':'seen' in inner,'mentionsLastSeen':'lastSeen' in inner,'mentionsBFinalItems':'bFinalItems' in inner,'mentionsBFinalAnswers':'bFinalAnswers' in inner,'mentionsSaveProfile':'saveProfile' in inner,'calls':calls}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','evidence':ev,'innerFinishSource':inner,'selectionSignatureMatch2000':True,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-completion-stats-v285.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v285 — Subject B Final Completion / Exposure Stats Audit
=================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v284
Source main: {parent}
Learner-facing change in v285: none

Purpose
-------
v284 showed that the exposure-aware candidate selector reads profile.bFinalStats[`algo:<id>`].seen, while the visible finishBFinal layer delegates to _finishBFinalV65. v285 opens that exact inner completion implementation to identify the production exposure mutation before running any sequential-session simulation.

Inner completion evidence
-------------------------
{json.dumps(ev,ensure_ascii=False,indent=2)}

Exact _finishBFinalV65 source
-----------------------------
{inner}

Decision
--------
If this implementation directly updates the namespaced algorithm seen counter, v286 can reproduce that exact mutation in a deterministic sequential-completion probe. If it delegates again, follow only the named delegate one level deeper. Do not infer exposure behavior from field names alone.

Regression
----------
No learner-facing content or selector code changed.
2000 deterministic final selection/order signature is unchanged.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-TRACE 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_COMPLETION_STATS_v285.txt').write_text(audit);print(audit)
