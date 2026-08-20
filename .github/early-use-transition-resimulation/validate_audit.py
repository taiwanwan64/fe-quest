from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'early-use-transition-resimulation-(v(\d+))',b);req(m,'bad v331 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const safe=(fn)=>{try{return {ok:true,value:fn()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const compactTask=t=>t?({type:t.type||null,title:t.title||null,minutes:t.minutes||0,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null}):null;
const plan=()=>safe(()=>buildTodayTasks().map(compactTask));
const daily=()=>safe(()=>{const r=getDailyRecord();return {done:{...(r.done||{})},doneKeys:Object.keys(r.done||{}).filter(k=>r.done[k]),activityCount:(profile.activity||[]).length,sessionCount:(profile.sessions||[]).length,streak:profile.streak,lastStudyDate:profile.lastStudyDate}});
ensureQuestionProfile();
const freshPlan=plan();
const snapshot=safe(()=>ensureTodayPlanSnapshot());
const snapTasks=snapshot.ok&&Array.isArray(snapshot.value)?snapshot.value:[];
const snapCompact=snapTasks.map(compactTask);
const initialBTask=snapTasks.find(t=>t&&t.type==='subjectB')||null;
const initialBSlot=safe(()=>initialBTask?dailyTaskSlot(initialBTask):null);
const lesson=safe(()=>nextLessonChoice());
let lessonBefore=null,lessonAfter=null,lessonMutation={ok:false,error:'lesson unresolved'};
if(lesson.ok&&lesson.value&&lesson.value.id){
  lessonBefore=profile.lessonProgress?.[lesson.value.id]||0;
  try{activeLesson=lesson.value.id;_completeLessonV65();lessonMutation={ok:true,value:true}}catch(e){lessonMutation={ok:false,error:String(e&&e.stack||e)}}
  lessonAfter=profile.lessonProgress?.[lesson.value.id]||0;
}
const nextLesson=safe(()=>nextLessonChoice());
const reviewQ=safe(()=>trackedQuestionPool()[0]);
const reviewBefore=Object.keys(profile.reviewJourneys||{}).length;
const reviewMutation=reviewQ.ok&&reviewQ.value?safe(()=>registerReviewJourney(reviewQ.value,'v331-disposable-resim')):{ok:false,error:'question unresolved'};
const reviewAfter=Object.keys(profile.reviewJourneys||{}).length;
const reviewDaily=safe(()=>markDailyTask('review',{}));
const bChoice=safe(()=>nextBChoice(20));
const bItem=safe(()=>bChoice.ok&&bChoice.value&&bChoice.value.id?B_EXERCISES.find(x=>x.id===bChoice.value.id):null);
const bId=bItem.ok&&bItem.value?bItem.value.id:null;
const bBefore=bId?(profile.bProgress?.[bId]||0):null;
const bXpBefore=profile.xp||0;
const perfBefore=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
const dailyBefore=daily();
let bMutation={ok:false,error:'TRACE route unresolved'};
if(bId){try{currentB=bItem.value;finishBExercise();bMutation={ok:true,value:true}}catch(e){bMutation={ok:false,error:String(e&&e.stack||e)}}
const bAfter=bId?(profile.bProgress?.[bId]||0):null;
const bXpAfter=profile.xp||0;
const perfAfter=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
const dailyAfter=daily();
const postBChoice=safe(()=>nextBChoice(20));
const postPlan=plan();
const postBTask=postPlan.ok?(postPlan.value||[]).find(t=>t.type==='subjectB')||null:null;
const state={
  freshPlan,snapshot:{ok:snapshot.ok,tasks:snapCompact,bTask:compactTask(initialBTask),bSlot:initialBSlot},
  lesson:{choice:lesson,before:lessonBefore,mutation:lessonMutation,after:lessonAfter,next:nextLesson},
  review:{questionId:reviewQ.ok&&reviewQ.value?reviewQ.value.id:null,before:reviewBefore,mutation:reviewMutation,after:reviewAfter,daily:reviewDaily},
  subjectB:{choice:bChoice,id:bId,before:bBefore,mutation:bMutation,after:bAfter,xpBefore:bXpBefore,xpAfter:bXpAfter,perfBefore,perfAfter,dailyBefore,dailyAfter,postChoice:postBChoice,postTask:postBTask},
  postPlan,semantic:validateSubjectBSemantics()
};
console.log('__V331__'+Buffer.from(JSON.stringify({v:APP_VERSION,state})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V331__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v331','v330'),'expects v331');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p330=Path('_regression/subject-b-trace-progress-contract-audit-v330.fixture.json');req(p330.exists(),'v330 fixture missing');req(json.loads(p330.read_text()).get('result')=='PASS — V329 TRACE TELEMETRY EXPECTATION WAS OUT OF CONTRACT','v330 result')
expected={'.github/early-use-transition-resimulation/validate_audit.py','.github/workflows/early-use-transition-resimulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/early-use-transition-resimulation-v331.fixture.json','audits/EARLY_USE_TRANSITION_RESIMULATION_v331.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v331' and par['v']=='v330','versions');req(cand['state']['semantic'].get('ok') is True and par['state']['semantic'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
def outcome(x):
    s=x['state'];b=s['subjectB'];return {
      'freshPlan':s['freshPlan'],'snapshot':s['snapshot'],
      'lessonId':s['lesson']['choice'].get('value',{}).get('id') if s['lesson']['choice'].get('ok') else None,'lessonBefore':s['lesson']['before'],'lessonMutationOK':s['lesson']['mutation']['ok'],'lessonAfter':s['lesson']['after'],'nextLessonId':s['lesson']['next'].get('value',{}).get('id') if s['lesson']['next'].get('ok') else None,
      'reviewQuestionId':s['review']['questionId'],'reviewBefore':s['review']['before'],'reviewMutationOK':s['review']['mutation']['ok'],'reviewAfter':s['review']['after'],'reviewDailyValue':s['review']['daily'].get('value'),
      'bChoice':b['choice'],'bId':b['id'],'bBefore':b['before'],'bMutationOK':b['mutation']['ok'],'bAfter':b['after'],'bXpDelta':b['xpAfter']-b['xpBefore'],'traceTelemetryDelta':b['perfAfter']-b['perfBefore'],'dailyBefore':b['dailyBefore'],'dailyAfter':b['dailyAfter'],'postBChoice':b['postChoice'],'postBTask':b['postTask'],'postPlan':s['postPlan']}
co,po=outcome(cand),outcome(par);req(co==po,'audit-only disposable transition drift')
slot=co['snapshot']['bSlot'].get('value') if co['snapshot']['bSlot'].get('ok') else None
done_after=(co['dailyAfter'].get('value') or {}).get('done',{}) if co['dailyAfter'].get('ok') else {}
bchoice=(co['bChoice'].get('value') or {}) if co['bChoice'].get('ok') else {}
postchoice=(co['postBChoice'].get('value') or {}) if co['postBChoice'].get('ok') else {}
posttask=co['postBTask'] or {}
checks={
 'freshPlanActionable':co['freshPlan'].get('ok') is True and len(co['freshPlan'].get('value') or [])>0,
 'todaySnapshotActionable':co['snapshot']['ok'] is True and co['snapshot']['bTask'] is not None,
 'lessonReached100':co['lessonBefore']==0 and co['lessonMutationOK'] and co['lessonAfter']==100,
 'lessonAdvanced':bool(co['lessonId']) and bool(co['nextLessonId']) and co['lessonId']!=co['nextLessonId'],
 'reviewJourneyCreated':co['reviewMutationOK'] and co['reviewAfter']>co['reviewBefore'],
 'traceRouteResolved':bchoice.get('mode')=='trace' and bool(co['bId']),
 'traceReached100':co['bBefore']==0 and co['bMutationOK'] and co['bAfter']==100,
 'traceXpAwarded':co['bXpDelta']>0,
 'traceTelemetryRemainsSeparate':co['traceTelemetryDelta']==0,
 'subjectBDailyTaskMarked':bool(slot) and done_after.get(slot) is True,
 'nextSubjectBRouteAdvanced':bool(postchoice) and not (postchoice.get('mode')=='trace' and postchoice.get('id')==co['bId']),
 'postPlanActionable':co['postPlan'].get('ok') is True and len(co['postPlan'].get('value') or [])>0,
 'postPlanAvoidsCompletedTrace':not (posttask.get('bmode')=='trace' and posttask.get('bid')==co['bId'])
}
req(all(checks.values()),'early-use real TRACE route check failed '+json.dumps(checks,ensure_ascii=False))
result='PASS — EARLY-USE ROUTES COHERE THROUGH REAL TRACE COMPLETION'
summary={'checks':checks,'outcome':co,'interpretation':'The v329 disposable early-use sequence was re-run after v330 clarified the contracts. This time Subject B uses the learner-facing finishBExercise chain rather than v254 timing telemetry. The first TRACE exercise moves from 0 to 100, awards its normal XP, marks the matching today-plan Subject B slot, leaves v254 timing telemetry untouched, and the next Subject B recommendation no longer points at the completed TRACE item. Lesson and review transitions remain coherent. This is a route/state-continuity test only, not evidence of seven-day retention or exam readiness.','decision':'PROCEED TO NEXT-DAY / MULTI-SESSION CONTINUITY DISCOVERY WITHOUT FABRICATING RETENTION'}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/early-use-transition-resimulation-v331.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v331 — Early-Use Transition Re-simulation\n====================================================\n\nResult\n------\n{result}\nPrevious release: v330\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nRe-run the v329 early-use state transition with the real short-TRACE completion contract established by v330. The simulation uses production lesson, review, today-plan and finishBExercise routes and deliberately does not invent calendar retention or readiness gains.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nCandidate and untouched v330 parent produce the same sanitized disposable-transition outcome.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EARLY_USE_TRANSITION_RESIMULATION_v331.txt').write_text(audit);print(audit)
