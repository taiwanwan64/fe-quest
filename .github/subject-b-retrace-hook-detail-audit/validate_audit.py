from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-retrace-hook-detail-audit-(v(\d+))',branch)
    req(m is not None,'bad v261 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function exSnapshot(id){const x=B_EXERCISES.find(e=>e.id===id);return {id:x?.id,title:x?.title,desc:x?.desc,code:x?.code,steps:x?.steps,hash:hashText(stable(x))};}
function startProbe(id,completed){
  profile.bProgress={...(profile.bProgress||{}),[id]:completed?100:0};
  const before=hashText(stable(B_EXERCISES));
  let error=null;
  try{startBExercise(id);}catch(e){error=String(e?.message||e);}
  const after=hashText(stable(B_EXERCISES));
  let current=null;
  try{current={id:currentB?.id||null,title:currentB?.title||null,desc:currentB?.desc||null,code:currentB?.code||null,steps:currentB?.steps||null,hash:currentB?hashText(stable(currentB)):null};}catch(e){current={error:String(e?.message||e)};}
  const vars={}; for(const name of ['currentStep','bStep','currentBStep','bCurrentStep']){try{vars[name]=eval(name);}catch(e){}}
  return {id,completed,error,beforeBankHash:before,afterBankHash:after,current,vars};
}
const ids=['loop_sum','count_even','matrix_sum'];
const probes={}; for(const id of ids){probes[id]={authored:exSnapshot(id),first:startProbe(id,false),repeat:startProbe(id,true)};}
const functionNames=['startBExercise','finishBExercise','renderBStep','renderBExercise','renderBGrid','predictionSource'];
const funcs={}; for(const name of functionNames){try{const f=eval(name);funcs[name]=typeof f==='function'?String(f):null;}catch(e){funcs[name]=null;}}
console.log('__V261__'+Buffer.from(JSON.stringify({v:APP_VERSION,ids,probes,funcs,contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V261__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v261','v260'),'v261 audit expects v260 parent')
source=Path('audits/SUBJECT_B_TRANSFER_RETRACE_DIAGNOSTIC_v260.txt'); req(source.exists(),'v260 transfer audit missing')
req('PASS — MEDIUM FINDING RECORDED' in source.read_text() and 'fixed_value_trace_repractice_limits_transfer' in source.read_text(),'v260 finding evidence drift')
expected={'.github/subject-b-retrace-hook-detail-audit/validate_audit.py','.github/workflows/subject-b-retrace-hook-detail-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v261 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v261' and par['v']=='v260','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
for id in cand['ids']:
    c,p=cand['probes'][id],par['probes'][id]
    req(c['authored']==p['authored'],'authored exercise drift '+id)
    req(c['first']['error'] is None and c['repeat']['error'] is None,'startBExercise probe failed '+id)
    req(c['first']['beforeBankHash']==c['first']['afterBankHash'] and c['repeat']['beforeBankHash']==c['repeat']['afterBankHash'],'startBExercise mutates B_EXERCISES '+id)
    req(c['first']['current']['hash']==c['authored']['hash'] and c['repeat']['current']['hash']==c['authored']['hash'],'currentB differs from authored fixed exercise '+id)
    req(c['first']==p['first'] and c['repeat']==p['repeat'],'audit-only start behavior drift '+id)
req(cand['funcs']==par['funcs'],'audit-only function source drift')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')

start_src=cand['funcs'].get('startBExercise') or ''
finish_src=cand['funcs'].get('finishBExercise') or ''
assignment=re.findall(r'currentB\s*=\s*[^;]+',start_src)
render_calls=re.findall(r'\b([A-Za-z_$][A-Za-z0-9_$]*render[A-Za-z0-9_$]*|render[A-Za-z0-9_$]*)\s*\(',start_src,re.I)
uses_find='B_EXERCISES.find' in start_src
uses_id=bool(re.search(r'B_EXERCISES\.find\([^\n]{0,160}id',start_src))
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','pilotIds':cand['ids'],'probes':cand['probes'],'startBExerciseSource':start_src,'finishBExerciseSource':finish_src,'currentBAssignments':assignment,'renderCalls':render_calls,'usesBExercisesFind':uses_find,'usesIdLookup':uses_id,'functionSources':cand['funcs'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-retrace-hook-detail-v261.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

def clip(s,n=2400):
    s=re.sub(r'\s+',' ',s).strip(); return s if len(s)<=n else s[:n]+'…'
audit=f'''FE QUEST v261 — Subject B Re-Trace Hook Detail Audit
=============================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v260
Source main: {parent}
Learner-facing change in v261: none

Purpose
-------
v260 recorded a Medium transfer-learning finding: focused TRACE repeats use the same authored values. Before introducing alternate-value re-tracing, v261 captures the exact exercise-start hook and proves whether a narrow wrapper can substitute one cloned exercise without mutating the shared B_EXERCISES bank.

Pilot candidates
----------------
loop_sum, count_even, matrix_sum
For all three, first-start and completed-repeat probes currently select a currentB object byte-equivalent to the authored B_EXERCISES entry. startBExercise itself leaves the B_EXERCISES bank hash unchanged.

startBExercise source evidence
------------------------------
Uses B_EXERCISES.find: {uses_find}
Uses id-oriented lookup near that find: {uses_id}
currentB assignment fragments: {json.dumps(assignment,ensure_ascii=False)}
Render-like calls detected: {json.dumps(render_calls,ensure_ascii=False)}
Source: {clip(start_src)}

finishBExercise source evidence
-------------------------------
{clip(finish_src)}

Repair guidance
---------------
A v262 repair should preserve the original first exposure and introduce a deterministic alternate only after the exercise is already complete. Because startBExercise currently resolves currentB from the shared bank and does not mutate that bank, the safest implementation is a tightly scoped start wrapper: temporarily substitute a deep-cloned pilot variant at the matching B_EXERCISES array slot only for the duration of the original startBExercise call, then restore the authored object in a finally block. The runtime currentB reference can retain the clone while the global bank returns immediately to its authored state. Validate this behavior explicitly before release.

Regression
----------
All three pilot exercises are unchanged from v260.
First and repeat starts are unchanged from v260.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_RETRACE_HOOK_DETAIL_AUDIT_v261.txt').write_text(audit); print(audit)
