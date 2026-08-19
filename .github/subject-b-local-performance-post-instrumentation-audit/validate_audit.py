from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    b=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-local-performance-post-instrumentation-audit-(v(\d+))',b)
    req(m,'bad v255 audit branch'); return m.group(1),f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function lifecycleProbe(){
 const oldPerf=globalThis.performance;let clock=100;globalThis.performance={now:()=>clock};
 try{
  profile.subjectBPerformanceV254={schema:1,events:[]};
  const ref=[{id:'q0'},{id:'q1'}];
  subjectBPerformanceResetV254('miniMock',ref);
  subjectBPerformanceBeforeRenderV254('miniMock',ref,'0|q0',null,{sourceId:'q0',level:'標準'});
  clock=400;subjectBPerformanceBeforeRenderV254('miniMock',ref,'1|q1',null,{sourceId:'q1',level:'応用'});
  clock=700;subjectBPerformanceBeforeRenderV254('miniMock',ref,'0|q0',null,{sourceId:'q0',level:'標準'});
  clock=900;subjectBPerformanceFreezeV254('miniMock','0|q0',1,1);
  const firstFrozen=subjectBPerformanceStateV254('miniMock').frozen['0|q0'];
  clock=1200;subjectBPerformanceFreezeV254('miniMock','0|q0',0,1);
  const secondFrozen=subjectBPerformanceStateV254('miniMock').frozen['0|q0'];
  clock=1500;subjectBPerformanceBeforeRenderV254('miniMock',ref,'1|q1',null,{sourceId:'q1',level:'応用'});
  clock=1600;subjectBPerformanceFreezeV254('miniMock','1|q1',0,1);
  const added=subjectBPerformanceFlushV254('miniMock'),again=subjectBPerformanceFlushV254('miniMock');
  const events=JSON.parse(JSON.stringify(subjectBPerformanceRootV254().events));
  const serialized=JSON.stringify({subjectBPerformanceV254:profile.subjectBPerformanceV254});
  const imported=JSON.parse(serialized);const normalized=normalizeProfileData({...profile,...imported});
  const roundTrip=JSON.stringify(normalized.subjectBPerformanceV254)===JSON.stringify(profile.subjectBPerformanceV254);
  profile.subjectBPerformanceV254={schema:99,events:'bad'};const healed=subjectBPerformanceRootV254();
  const ref2=[{id:'prefilled'}];subjectBPerformanceResetV254('miniMock',ref2);
  subjectBPerformanceBeforeRenderV254('miniMock',ref2,'0|prefilled',1,{sourceId:'prefilled',level:'標準'});
  clock=1900;subjectBPerformanceFreezeV254('miniMock','0|prefilled',1,1);const prefilledAdded=subjectBPerformanceFlushV254('miniMock');
  return {firstFrozen,secondFrozen,added,again,events,roundTrip,healed,prefilledAdded};
 }finally{globalThis.performance=oldPerf;}
}
const p=lifecycleProbe();
console.log('__V255__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,spec:SUBJECT_B_LOCAL_PERFORMANCE_V254_SPEC,probe:p,
 banks:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},
 contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed: '+z.stderr[-8000:])
        m=re.search(r'__V255__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing');return json.loads(base64.b64decode(m.group(1)))


version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v255','v254'),'v255 expects v254 parent')
source=Path('audits/SUBJECT_B_LOCAL_PERFORMANCE_TIMING_v254.txt');req(source.exists(),'v254 evidence missing')
st=source.read_text();req('PASS — NO FINDINGS' in st and 'subjectBPerformanceV254' in st and 'first committed answer' in st,'v254 evidence drift')
expected={'.github/subject-b-local-performance-post-instrumentation-audit/validate_audit.py','.github/workflows/subject-b-local-performance-post-instrumentation-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v255 audit-only source drift: '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v255' and par['v']=='v254','runtime versions')
req(cand['spec']==par['spec'] and cand['probe']==par['probe'],'audit-only instrumentation behavior drift')
req(cand['banks']==par['banks'],'audit-only bank drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift');req(cand['sem'].get('ok') is True,'semantic diagnostics failed')
p=cand['probe']
req(p['firstFrozen']==500 and p['secondFrozen']==500,'first-answer freeze or pause/resume accumulation failed')
req(p['added']==2 and p['again']==0,'flush single-count semantics failed')
req(len(p['events'])==2,'event count drift')
req(p['events'][0]['sourceId']=='q0' and p['events'][0]['elapsedMs']==500 and p['events'][0]['ok'] is True,'q0 event semantics failed')
req(p['events'][1]['sourceId']=='q1' and p['events'][1]['elapsedMs']==400 and p['events'][1]['ok'] is False,'q1 event semantics failed')
req(p['roundTrip'] is True,'save/import normalization round trip failed')
req(p['healed']=={'schema':1,'events':[]},'malformed optional field was not healed safely')
req(p['prefilledAdded']==0,'pre-existing answer was double-counted as a fresh response')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','pauseResumeMs':{'q0':500,'q1':400},'firstAnswerIdempotent':True,'flushSingleCount':True,'roundTripRetention':True,'malformedFieldHealing':True,'prefilledAnswerSkipped':True,'bankHashes':cand['banks'],'contract':cand['contract'],'semanticOK':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-local-performance-post-instrumentation-audit-v255.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v255 — Subject B Local Performance Post-Instrumentation Audit
========================================================================

Result
------
PASS — NO FINDINGS
Previous release: v254
Source main: {parent}
Learner-facing change in v255: none

Behavior audit
--------------
A deterministic two-question navigation probe confirmed active unanswered time accumulation: q0 accumulated 300 ms before leaving plus 200 ms after returning = 500 ms; q1 accumulated 300 ms before leaving plus 100 ms after returning = 400 ms. Re-answering q0 did not change its frozen first-answer time or correctness. Finishing recorded exactly two events; a second flush recorded zero. A pre-filled/already-answered question recorded zero fresh events.

Persistence audit
-----------------
The optional subjectBPerformanceV254 object survives JSON save/import plus normalizeProfileData unchanged. A malformed imported field (schema 99 / non-array events) is healed on access to schema 1 with an empty event list instead of throwing. The v254 bounded 240-event policy remains unchanged.

Regression
----------
Question / TRACE / compound / security / final-algorithm banks: unchanged from v254.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.

Decision
--------
Close the local timing instrumentation safety sequence. The evidence layer now has bounded storage, backward-compatible optional persistence, first-answer single-count behavior, navigation pause/resume semantics, and no exam-behavior changes. The next step may use learner-local summaries for recommendations, but only with minimum-evidence thresholds and conservative wording; published difficulty labels and scoring should remain authored/static.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_LOCAL_PERFORMANCE_POST_INSTRUMENTATION_AUDIT_v255.txt').write_text(audit);print(audit)
