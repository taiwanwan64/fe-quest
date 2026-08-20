from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-task-capacity-simulation-(v(\d+))',b);req(m,'bad v317 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const RealDate=Date;let fakeNow='2026-06-01';
class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[fakeNow+'T12:00:00Z']));}static now(){return new RealDate(fakeNow+'T12:00:00Z').getTime();}}
globalThis.Date=FakeDate;
ensureQuestionProfile();
profile.settings=profile.settings||{};profile.settings.variantReview=false;
const blankStat=()=>({attempts:0,correct:0,streak:0,due:null,last:null,lastReason:null,stability:1,lapses:0,reviews:0,avgSeconds:0,timedAnswers:0,lastQuality:null,lastReviewDate:null,recovered:0,retryFailures:0,memoryVersion:2});
const reset=()=>{
  ensureQuestionProfile();profile.reviewJourneys={};
  for(const q of trackedQuestionPool())profile.qStats[q.id]=blankStat();
  quizItems=[];quizIndex=0;quizMode='random';
};
const seedDue=n=>{
  const picked=QUESTION_BANK.slice(0,n);
  for(const q of picked)Object.assign(profile.qStats[q.id],{attempts:1,correct:1,streak:1,due:'2026-06-01',last:'2026-05-29',stability:3,reviews:1,avgSeconds:60,timedAnswers:1,lastReviewDate:'2026-05-29',lastQuality:4});
  return picked;
};
const runReview=n=>{
  reset();seedDue(n);const before=dueQuestions().length;startQuiz('review');
  return {backlog:n,dueBefore:before,launched:quizItems.length,mode:quizMode,ids:quizItems.map(q=>q.sourceId||q.id)};
};
const reviewRuns=[0,3,10,25,40].map(runReview);
reset();const taperDue=seedDue(25);startQuiz('taperreview');const taper={dueBefore:dueQuestions().length,launched:quizItems.length,ids:quizItems.map(q=>q.sourceId||q.id)};

reset();const due25=seedDue(25);const journeyQuestion=due25[0];registerReviewJourney(journeyQuestion,'practice');
const journeySnapshot={active:activeReviewJourneys().length,actionable:actionableReviewJourneys().length,genericDue:dueQuestions().length,id:journeyQuestion.id};
const realStartJourneyAction=startJourneyAction,realStartQuiz=startQuiz;let routed=[];
startJourneyAction=function(id){routed.push({kind:'journey',id});};startQuiz=function(mode){routed.push({kind:'quiz',mode});};
launchDailyTask({type:'review'});startJourneyAction=realStartJourneyAction;startQuiz=realStartQuiz;
const journeyRoute=routed.slice();realStartQuiz('journey:'+journeyQuestion.id);const journeyLaunch={launched:quizItems.length,mode:quizMode,ids:quizItems.map(q=>q.sourceId||q.id)};

reset();seedDue(25);routed=[];startJourneyAction=function(id){routed.push({kind:'journey',id});};startQuiz=function(mode){routed.push({kind:'quiz',mode});};launchDailyTask({type:'review'});startJourneyAction=realStartJourneyAction;startQuiz=realStartQuiz;const genericRoute=routed.slice();
const allocations={m60:taskAllocation(60),m90:taskAllocation(90)};
const sources={launchDailyTask:String(launchDailyTask),startQuiz:String(realStartQuiz),taskAllocation:String(taskAllocation),actionableReviewJourneys:String(actionableReviewJourneys),dueQuestions:String(dueQuestions)};
console.log('__V317__'+Buffer.from(JSON.stringify({v:APP_VERSION,reviewRuns,taper,journeySnapshot,journeyRoute,journeyLaunch,genericRoute,allocations,sources,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V317__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v317','v316'),'expects v317');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p316=Path('_regression/subject-a-review-task-capacity-discovery-v316.fixture.json');req(p316.exists(),'v316 fixture missing');req(json.loads(p316.read_text()).get('result')=='PASS — SUBJECT A REVIEW TASK CAPACITY PATH DISCOVERED','v316 result')
expected={'.github/subject-a-review-task-capacity-simulation/validate_audit.py','.github/workflows/subject-a-review-task-capacity-simulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-task-capacity-simulation-v317.fixture.json','audits/SUBJECT_A_REVIEW_TASK_CAPACITY_SIMULATION_v317.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v317' and par['v']=='v316','versions');req({k:v for k,v in cand.items() if k not in ('v','sem')}=={k:v for k,v in par.items() if k not in ('v','sem')},'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
runs=cand['reviewRuns'];req([x['backlog'] for x in runs]==[0,3,10,25,40],'scenario order');req([x['launched'] for x in runs]==[5,3,10,10,10],'review launch sizes changed');req([x['dueBefore'] for x in runs]==[0,3,10,25,40],'seeded due counts');req(all(x['mode']=='review' for x in runs),'review mode mismatch');req(cand['taper']['launched']==5 and cand['taper']['dueBefore']==25,'taper review capacity');jsnap=cand['journeySnapshot'];req(jsnap['active']>=1 and jsnap['actionable']>=1 and jsnap['genericDue']==24,'journey should preempt one generic due item');req(cand['journeyRoute']==[{'kind':'journey','id':jsnap['id']}],'daily review did not route first actionable journey');req(cand['journeyLaunch']['launched']==1 and cand['journeyLaunch']['mode']=='journey:'+jsnap['id'],'journey quiz capacity');req(cand['genericRoute']==[{'kind':'quiz','mode':'review'}],'generic review route mismatch');req(cand['allocations']['m60'].get('review')==10 and cand['allocations']['m90'].get('review')==15,'review minute allocations changed')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'normalReviewLaunches':runs,
 'taperReview':cand['taper'],
 'guidedJourney':{'before':jsnap,'dailyTaskRoute':cand['journeyRoute'],'journeyQuiz':cand['journeyLaunch']},
 'genericDailyTaskRoute':cand['genericRoute'],
 'plannerReviewMinutes':cand['allocations'],
 'interpretation':'Normal review launch capacity is question-count based, not minute-budget based: with due work it launches every due item only while the queue is below 10, then caps the session at 10; with no due item it deliberately falls back to 5 weak questions. Taper review is fixed at 5. If an actionable guided recovery journey exists, the daily review task routes to the first journey instead of starting the generic due session, and the journey quiz itself contains one review item. The 60- and 90-minute planners still reserve 10 and 15 minutes respectively, but those minutes do not change the generic 10-question cap.',
 'decision':'LAUNCH CAPACITY CHARACTERIZED — INSPECT TIME-BUDGET ALIGNMENT BEFORE CHANGING THE 10-QUESTION CAP'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW TASK LAUNCH CAPACITY CHARACTERIZED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-task-capacity-simulation-v317.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n')
summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v317 — Subject A Review Task Launch Capacity Simulation\n================================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW TASK LAUNCH CAPACITY CHARACTERIZED\nPrevious release: v316\nSource main: {parent}\nLearner-facing change: none\n\nMethod\n------\nExecute the production review launcher against controlled due backlogs of 0, 3, 10, 25 and 40 questions, then verify taper review and guided-journey routing/capacity. Variant review is disabled only inside the audit runtime so base IDs remain directly comparable; the production selection count is unchanged.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and review/task functions are unchanged from v316.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nDo not change the 10-question review cap yet. First compare the measured/recorded per-question time model with the planner's 10- and 15-minute review budgets, because a fixed question cap can be appropriate even when backlog size is much larger.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_TASK_CAPACITY_SIMULATION_v317.txt').write_text(audit);print(audit)
