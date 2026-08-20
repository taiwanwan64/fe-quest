from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'first-run-onboarding-discovery-(v(\d+))',b);req(m,'bad v326 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];names=sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js)))
    tail=r'''
const names=__NAMES__;
const safe=(thunk)=>{try{return {ok:true,value:thunk()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const direct={};
for(const n of ['buildTodayTasks','nextLessonChoice','nextBChoice','effectiveStudyMinutes','examDaysRemaining','taskAllocation','launchDailyTask','renderTodayPlan','renderHome']){try{const f=eval(n);direct[n]=typeof f==='function'?String(f):null}catch(e){direct[n]=null}}
const profileSnapshot=safe(()=>JSON.parse(JSON.stringify(profile)));
const calls={
 examDaysRemaining:safe(()=>examDaysRemaining()),
 effectiveStudyMinutes:safe(()=>effectiveStudyMinutes()),
 allocation:safe(()=>taskAllocation(effectiveStudyMinutes())),
 lesson:safe(()=>nextLessonChoice()),
 subjectB20:safe(()=>nextBChoice(20)),
 todayTasks:safe(()=>buildTodayTasks())
};
const firstRunHits=[];
for(const n of names){try{const f=eval(n);if(typeof f!=='function')continue;const s=String(f);const signals=['profile.settings','studyMinutes','examDate','localStorage','buildTodayTasks','nextLessonChoice','nextBChoice','onboard','firstRun','first run'].filter(x=>s.includes(x));if(signals.length)firstRunHits.push({name:n,signals,source:s.slice(0,9000)});}catch(e){}}
let storage={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);storage[k]=localStorage.getItem(k)}}catch(e){storage={error:String(e)}}
console.log('__V326__'+Buffer.from(JSON.stringify({v:APP_VERSION,direct,profileSnapshot,calls,firstRunHits,storage,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__NAMES__',json.dumps(names))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V326__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v326','v325'),'expects v326');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p325=Path('_regression/exam-taper-learner-route-audit-v325.fixture.json');req(p325.exists(),'v325 fixture missing');req(json.loads(p325.read_text()).get('result')=='PASS — TAPER LEARNER ROUTE USES CAPPED ALLOCATION CHAIN','v325 result')
expected={'.github/first-run-onboarding-discovery/validate_audit.py','.github/workflows/first-run-onboarding-discovery.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/first-run-onboarding-discovery-v326.fixture.json','audits/FIRST_RUN_ONBOARDING_DISCOVERY_v326.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v326' and par['v']=='v325','versions');req(cand['direct']==par['direct'],'audit-only first-run route drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
for n in ['buildTodayTasks','nextLessonChoice','nextBChoice','effectiveStudyMinutes','examDaysRemaining','taskAllocation']:req(cand['direct'].get(n),n+' missing')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
call_ok={k:v.get('ok') is True for k,v in cand['calls'].items()};tasks=cand['calls'].get('todayTasks',{}).get('value') if call_ok.get('todayTasks') else None
actionable=isinstance(tasks,list) and len(tasks)>0 and all(isinstance(x,dict) and (x.get('type') or x.get('title')) for x in tasks)
result='PASS — FRESH RUNTIME PRODUCES ACTIONABLE FIRST-DAY PLAN' if all(call_ok.values()) and actionable else 'FINDING — FIRST-RUN CALL CHAIN NEEDS FOLLOW-UP'
summary={'freshRuntimeProfile':cand['profileSnapshot'],'freshRuntimeCalls':cand['calls'],'actionableTodayTasks':actionable,'firstRunFunctionInventory':cand['firstRunHits'],'storageAfterRuntimeBoot':cand['storage'],'interpretation':'This discovery runs the production bundle against the release runtime with empty connector-side storage and records the zero-history/default profile, first lesson/Subject B choices, effective minutes, allocation and today-task chain. It does not infer a seven-day learning outcome; it establishes the exact first-run contract to simulate next.','decision':'SIMULATE THE OBSERVED FRESH-PROFILE CONTRACT ACROSS EARLY-DAY PROGRESS STATES' if result.startswith('PASS') else 'DIAGNOSE THE FAILING FIRST-RUN CALL BEFORE ADDING ONBOARDING UX'}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/first-run-onboarding-discovery-v326.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v326 — First-Run Onboarding Discovery\n===============================================\n\nResult\n------\n{result}\nPrevious release: v325\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nMove to the next learning-quality frontier after taper closure: discover the exact zero-history/default-profile route a new learner receives before changing onboarding UI. The audit executes the production first-day planning chain and inventories the functions that depend on profile settings, exam date, storage and next-learning choices.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior is unchanged from v325.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/FIRST_RUN_ONBOARDING_DISCOVERY_v326.txt').write_text(audit);print(audit)
