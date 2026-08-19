from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-b-final-exposure-lifecycle-audit-(v(\d+))',b);req(m,'bad v284 branch');return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function sig(){const rows=[];for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x284000+i)>>>0);rows.push(buildBFinal().map(x=>[x.kind,x.sourceId]));}return hashText(JSON.stringify(rows));}
const probe=B_EXAM_ALGO_ITEMS[0];profile.bFinalStats={[`algo:${probe.id}`]:{seen:7,lastSeen:'probe'}};
console.log('__V284__'+Buffer.from(JSON.stringify({v:APP_VERSION,seenProbe:bFinalAlgoSeen(probe),pickSource:String(pickFinalAlgoCandidate),seenSource:String(bFinalAlgoSeen),finishUnderlyingSource:String(__finishBFinalV254),finishCurrentSource:String(finishBFinal),buildSource:String(__buildBFinalBeforeV208),repairSource:String(bFinalRepairTraceFloorV208),selectionSig:sig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V284__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v284','v283'),'expects v283')
source=Path('audits/SUBJECT_B_FINAL_ROTATION_DETAIL_v283.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v283 evidence missing')
expected={'.github/subject-b-final-exposure-lifecycle-audit/validate_audit.py','.github/workflows/subject-b-final-exposure-lifecycle-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v284' and par['v']=='v283','versions')
for k in ['seenProbe','pickSource','seenSource','finishUnderlyingSource','finishCurrentSource','buildSource','repairSource','selectionSig','contract']:req(cand[k]==par[k],f'audit-only runtime drift {k}')
req(cand['seenProbe']==7,'namespaced exposure probe drift');req(cand['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
finish=cand['finishUnderlyingSource'];pick=cand['pickSource'];seen=cand['seenSource']
evidence={'namespacedAlgoKeyInSeen':('algo:' in seen),'finishMentionsBFinalStats':('bFinalStats' in finish),'finishMentionsAlgoNamespace':('algo:' in finish),'finishMentionsSeen':('seen' in finish),'finishMentionsLastSeen':('lastSeen' in finish),'pickMentionsBFinalAlgoSeen':('bFinalAlgoSeen' in pick),'pickMentionsSeen':('seen' in pick.lower()),'pickMentionsRandom':('Math.random' in pick),'pickMentionsDomain':('domain' in pick),'pickMentionsFormat':('format' in pick)}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','evidence':evidence,'seenProbe':cand['seenProbe'],'pickSource':pick,'seenSource':seen,'finishUnderlyingSource':finish,'buildSource':cand['buildSource'],'repairSource':cand['repairSource'],'selectionSignatureMatch2000':True,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-exposure-lifecycle-v284.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v284 — Subject B Final Exposure Lifecycle Detail Audit
=================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v283
Source main: {parent}
Learner-facing change in v284: none

Purpose
-------
v283 proved that bFinalAlgoSeen reads a namespaced profile key (algo:<id>) and that the v282 skew was measured under cold-start resets. v284 captures the exact candidate selector and the pre-v254 final-completion implementation so repeated-session behavior can be modeled from production semantics rather than guessed state mutations.

Namespaced exposure probe
-------------------------
profile.bFinalStats[`algo:<id>`].seen=7 -> bFinalAlgoSeen(item) = {cand['seenProbe']}

Lifecycle evidence
------------------
{json.dumps(evidence,ensure_ascii=False,indent=2)}

Exact candidate selector
------------------------
{pick}

Exact exposure reader
---------------------
{seen}

Exact pre-v254 finishBFinal
---------------------------
{finish}

Interpretation
--------------
The next audit must mirror only the fields and update timing demonstrated by the exact completion source above. It should then compare cold-start frequency with sequential completed-final frequency, cumulative coverage of all 43 algorithm items, and immediate-session overlap. No selector repair is justified until that lifecycle-faithful probe is complete.

Regression
----------
No learner-facing content or selector code changed.
2000 deterministic final selection/order signature is unchanged.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-TRACE 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_EXPOSURE_LIFECYCLE_v284.txt').write_text(audit);print(audit)
