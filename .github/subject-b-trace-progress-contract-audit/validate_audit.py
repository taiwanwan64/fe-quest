from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-trace-progress-contract-audit-(v(\d+))',b);req(m,'bad v330 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const safe=(f)=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const exact={};
for(const n of ['subjectBPerformanceRecordV254','subjectBPerformanceFlushV254','nextBChoice','markDailyTask','finishBExercise','_finishBV65']){
  try{const f=eval(n);exact[n]=typeof f==='function'?String(f).slice(0,9000):null}catch(e){exact[n]=null}
}
const item=B_EXERCISES[0];
const layers=['trace','compound','miniMock','securityMock','final'];const probes={};
for(const layer of layers){
  const before=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
  const r=safe(()=>subjectBPerformanceRecordV254({layer,sourceId:item.id,level:item.level||'基礎',ok:true,elapsedMs:30000,at:Date.now()}));
  const after=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
  probes[layer]={...r,grew:after>before};
}
const traceBefore=profile.bProgress?.[item.id]||0;const xpBefore=profile.xp||0;currentB=item;
const traceFinish=safe(()=>finishBExercise());
const traceAfter=profile.bProgress?.[item.id]||0;const xpAfter=profile.xp||0;
console.log('__V330__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,item:{id:item.id,level:item.level||null},exact,probes,
  traceCompletion:{call:traceFinish,before:traceBefore,after:traceAfter,xpBefore,xpAfter,grew:traceAfter>traceBefore},
  sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V330__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v330','v329'),'expects v330');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p329=Path('_regression/early-use-transition-simulation-v329.fixture.json');req(p329.exists(),'v329 fixture missing');req(json.loads(p329.read_text()).get('result')=='FINDING — EARLY-USE TRANSITION NEEDS ROUTE DETAIL','v329 result')
expected={'.github/subject-b-trace-progress-contract-audit/validate_audit.py','.github/workflows/subject-b-trace-progress-contract-audit.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-b-trace-progress-contract-audit-v330.fixture.json','audits/SUBJECT_B_TRACE_PROGRESS_CONTRACT_AUDIT_v330.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v330' and par['v']=='v329','versions');req(cand['exact']==par['exact'],'audit-only contract drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
traceRejected=cand['probes']['trace'].get('value') is False and not cand['probes']['trace'].get('grew')
accepted=[k for k,v in cand['probes'].items() if v.get('value') is True or v.get('grew')]
expectedLayers=['compound','miniMock','securityMock','final']
core=cand['exact'].get('_finishBV65') or '';wrapper=cand['exact'].get('finishBExercise') or ''
coreContract=('profile.bProgress[currentB.id]=100' in core and 'saveProfile()' in core)
wrapperContract=bool(re.search(r'_finishBV65\s*\(\s*\)',wrapper)) and all(t in wrapper for t in ['markDailyTask','subjectB','trace','idBefore'])
traceRun=cand['traceCompletion'];traceRunOK=traceRun.get('call',{}).get('ok') is True and traceRun.get('after')==100 and traceRun.get('grew') is True
parentRun=par['traceCompletion'];parentRunOK=parentRun.get('call',{}).get('ok') is True and parentRun.get('after')==100 and parentRun.get('grew') is True
req(accepted==expectedLayers,'unexpected v254 layer contract '+repr(accepted));req(traceRejected,'trace telemetry should be rejected');req(coreContract,'TRACE core completion contract missing');req(wrapperContract,'TRACE wrapper/daily-task contract missing');req(traceRunOK and parentRunOK,'TRACE completion runtime probe failed')
result='PASS — V329 TRACE TELEMETRY EXPECTATION WAS OUT OF CONTRACT'
summary={
  'traceItem':cand['item'],
  'performanceRecorderSource':cand['exact'].get('subjectBPerformanceRecordV254'),
  'performanceLayerProbes':cand['probes'],
  'acceptedPerformanceLayers':accepted,
  'tracePerformanceRejected':traceRejected,
  'traceCoreCompletionSource':cand['exact'].get('_finishBV65'),
  'traceCompletionWrapperSource':cand['exact'].get('finishBExercise'),
  'traceCoreContractResolved':coreContract,
  'traceWrapperContractResolved':wrapperContract,
  'traceCompletionRuntimeProbe':traceRun,
  'interpretation':'v329 used the v254 response-time/performance recorder as though a short TRACE exercise were one of its instrumented layers. Production rejects layer=trace by design. Short TRACE completion instead flows through finishBExercise -> _finishBV65, which writes profile.bProgress[currentB.id]=100, saves the profile, and then marks the matching daily Subject B trace task. The disposable runtime confirms the first TRACE item advances from 0 to 100 through that real completion chain.',
  'decision':'RE-RUN EARLY-USE SIMULATION AGAINST THE REAL FINISHBEXERCISE/BPROGRESS TRACE CONTRACT, NOT V254 PERFORMANCE TELEMETRY'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-trace-progress-contract-audit-v330.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v330 — Subject B TRACE Progress Contract Audit\n========================================================\n\nResult\n------\n{result}\nPrevious release: v329\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nResolve the sole v329 finding: determine whether the failed synthetic Subject B record indicates a product defect or an audit-harness mismatch between short TRACE progress and v254 performance telemetry.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior is unchanged from v329.\nCandidate and untouched v329 parent expose the same TRACE completion and v254 telemetry contracts.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_TRACE_PROGRESS_CONTRACT_AUDIT_v330.txt').write_text(audit);print(audit)
