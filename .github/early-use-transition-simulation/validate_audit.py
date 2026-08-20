from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'early-use-transition-simulation-(v(\d+))',b);req(m,'bad v329 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const safe=(fn)=>{try{return {ok:true,value:fn()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const plan=()=>safe(()=>buildTodayTasks().map(t=>({type:t.type,title:t.title,minutes:t.minutes,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null})));
ensureQuestionProfile();
const freshPlan=plan();
const lesson=safe(()=>nextLessonChoice());
let lessonMutation={ok:false,error:'lesson unresolved'},lessonBefore=null,lessonAfter=null;
if(lesson.ok&&lesson.value&&lesson.value.id){
  lessonBefore=profile.lessonProgress?.[lesson.value.id]||0;
  try{activeLesson=lesson.value.id;_completeLessonV65();lessonMutation={ok:true,value:true}}catch(e){lessonMutation={ok:false,error:String(e&&e.stack||e)}}
  lessonAfter=profile.lessonProgress?.[lesson.value.id]||0;
}
const reviewQ=safe(()=>trackedQuestionPool()[0]);
const reviewBefore=Object.keys(profile.reviewJourneys||{}).length;
const reviewMutation=reviewQ.ok&&reviewQ.value?safe(()=>registerReviewJourney(reviewQ.value,'v329-disposable-sim')):{ok:false,error:'question unresolved'};
const reviewAfter=Object.keys(profile.reviewJourneys||{}).length;
const bItem=safe(()=>B_EXERCISES[0]);
const perfBefore=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
const subjectBMutation=bItem.ok&&bItem.value?safe(()=>subjectBPerformanceRecordV254({layer:'trace',sourceId:bItem.value.id,level:bItem.value.level||'基礎',ok:true,elapsedMs:30000,at:Date.now()})):{ok:false,error:'B exercise unresolved'};
const perfAfter=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
const snapshot=safe(()=>ensureTodayPlanSnapshot());
const dailyMutation=safe(()=>markDailyTask('review',{}));
const dailyRecord=safe(()=>{const r=getDailyRecord();return {doneCount:Object.values(r.done||{}).filter(Boolean).length,doneKeys:Object.keys(r.done||{}).filter(k=>r.done[k]),activityCount:(profile.activity||[]).length,sessionCount:(profile.sessions||[]).length,streak:profile.streak,lastStudyDate:profile.lastStudyDate}});
const postPlan=plan();
const state={freshPlan,lesson:{choice:lesson,before:lessonBefore,mutation:lessonMutation,after:lessonAfter},review:{questionId:reviewQ.ok&&reviewQ.value?reviewQ.value.id:null,before:reviewBefore,mutation:reviewMutation,after:reviewAfter},subjectB:{sourceId:bItem.ok&&bItem.value?bItem.value.id:null,beforeBytes:perfBefore,mutation:subjectBMutation,afterBytes:perfAfter},daily:{snapshotOk:snapshot.ok,mutation:dailyMutation,record:dailyRecord},postPlan,semantic:validateSubjectBSemantics()};
console.log('__V329__'+Buffer.from(JSON.stringify({v:APP_VERSION,state})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V329__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v329','v328'),'expects v329');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p328=Path('_regression/early-progress-mutation-detail-audit-v328.fixture.json');req(p328.exists(),'v328 fixture missing');req(json.loads(p328.read_text()).get('result')=='PASS — CONCRETE EARLY-PROGRESS MUTATION CONTRACTS RESOLVED','v328 result')
expected={'.github/early-use-transition-simulation/validate_audit.py','.github/workflows/early-use-transition-simulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/early-use-transition-simulation-v329.fixture.json','audits/EARLY_USE_TRANSITION_SIMULATION_v329.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v329' and par['v']=='v328','versions');req(cand['state']['semantic'].get('ok') is True and par['state']['semantic'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
def outcome(x):
    s=x['state'];return {'freshPlan':s['freshPlan'],'lessonChoice':s['lesson']['choice'],'lessonBefore':s['lesson']['before'],'lessonMutationOK':s['lesson']['mutation']['ok'],'lessonAfter':s['lesson']['after'],'reviewQuestionId':s['review']['questionId'],'reviewBefore':s['review']['before'],'reviewMutationOK':s['review']['mutation']['ok'],'reviewAfter':s['review']['after'],'bSourceId':s['subjectB']['sourceId'],'bMutationOK':s['subjectB']['mutation']['ok'],'bMutationValue':s['subjectB']['mutation'].get('value'),'perfGrew':s['subjectB']['afterBytes']>s['subjectB']['beforeBytes'],'dailySnapshotOK':s['daily']['snapshotOk'],'dailyMutationOK':s['daily']['mutation']['ok'],'dailyMutationValue':s['daily']['mutation'].get('value'),'dailyRecord':s['daily']['record'],'postPlan':s['postPlan']}
co,po=outcome(cand),outcome(par);req(co==po,'audit-only disposable transition drift')
checks={'freshPlanActionable':co['freshPlan'].get('ok') is True and len(co['freshPlan'].get('value') or [])>0,'lessonReached100':co['lessonAfter']==100,'reviewJourneyCreated':co['reviewAfter']>co['reviewBefore'],'subjectBPerformanceRecorded':co['bMutationOK'] and (co['bMutationValue'] is True or co['perfGrew']),'dailyReviewTaskMarked':co['dailyMutationOK'] and co['dailyMutationValue'] is True,'postPlanActionable':co['postPlan'].get('ok') is True and len(co['postPlan'].get('value') or [])>0}
result='PASS — DISPOSABLE EARLY-USE TRANSITIONS REMAIN ACTIONABLE' if all(checks.values()) else 'FINDING — EARLY-USE TRANSITION NEEDS ROUTE DETAIL'
summary={'checks':checks,'outcome':co,'interpretation':'A disposable runtime was advanced through real production state contracts: fresh today-plan generation, first lesson completion, review-journey creation, one local Subject B performance record, one daily review-task completion, then today-plan regeneration. This tests route continuity and state coherence only. It is not a model of seven calendar days, real retention, or readiness improvement.','decision':'PROCEED TO FIRST-WEEK ROUTE/FRICTION SIMULATION USING THESE VERIFIED TRANSITIONS' if all(checks.values()) else 'DETAIL THE FAILED TRANSITION BEFORE ANY FIRST-WEEK UX CHANGE'}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/early-use-transition-simulation-v329.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v329 — Early-Use Transition Simulation\n=================================================\n\nResult\n------\n{result}\nPrevious release: v328\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nExecute the concrete production state contracts resolved in v328 inside a disposable runtime and verify that an early learner can accumulate representative progress without breaking the next-plan route. This deliberately stops short of pretending that a synthetic sequence equals seven days of human learning.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nCandidate and untouched v328 parent produce the same sanitized disposable-transition outcome.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EARLY_USE_TRANSITION_SIMULATION_v329.txt').write_text(audit);print(audit)
