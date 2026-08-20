from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-queue-simulation-(v(\d+))',b);req(m,'bad v315 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const RealDate=Date;let fakeNow='2026-05-01';
class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[fakeNow+'T12:00:00Z']));}static now(){return new RealDate(fakeNow+'T12:00:00Z').getTime();}}
globalThis.Date=FakeDate;const setNow=d=>{fakeNow=d;};
ensureQuestionProfile();profile.reviewJourneys={};
for(const q of QUESTION_BANK){const st=profile.qStats[q.id];Object.assign(st,{attempts:0,correct:0,streak:0,due:null,last:null,lastReason:null,stability:1,lapses:0,reviews:0,avgSeconds:0,timedAnswers:0,lastReviewDate:null,recovered:0,retryFailures:0});}
const seed=(q,due)=>{const st=profile.qStats[q.id];Object.assign(st,{attempts:1,correct:1,streak:1,due,last:'2026-04-28',stability:3,lapses:0,reviews:1,avgSeconds:60,timedAnswers:1,lastReviewDate:'2026-04-28',lastQuality:4});};
const today=QUESTION_BANK.slice(0,40),tomorrow=QUESTION_BANK.slice(40,48),future=QUESTION_BANK.slice(48,53);
const configuredIds=[...today,...tomorrow,...future].map(q=>q.id),configuredSet=new Set(configuredIds);
today.forEach(q=>seed(q,'2026-05-01'));tomorrow.forEach(q=>seed(q,'2026-05-02'));future.forEach(q=>seed(q,'2026-05-04'));
for(const q of today.slice(0,3))registerReviewJourney(q,'practice');
const configuredState=()=>configuredIds.map(id=>{const st=profile.qStats[id];return {id,due:st?.due||null,attempts:st?.attempts||0,isDue:isDue(st),active:questionHasActiveJourney(id)};});
const snapshot=()=>{
  const dueAll=dueQuestions().map(q=>q.id);
  return {
    date:localDateISO(0),
    active:activeReviewJourneys().map(j=>({id:j.id,stage:j.stage,due:j.due})),
    actionable:actionableReviewJourneys().map(j=>({id:j.id,stage:j.stage,due:j.due})),
    due:dueAll,
    configuredDue:dueAll.filter(id=>configuredSet.has(id)),
    configuredState:configuredState(),
    workload:reviewWorkloadCount(),
    forecast:reviewForecast(4),
    top:topReviewCandidates(3).map(q=>q.id),
    alloc60:taskAllocation(60),
    alloc90:taskAllocation(90)
  };
};
const day0=snapshot();
setNow('2026-05-02');const day1Before=snapshot();
const process=dueQuestions().filter(q=>configuredSet.has(q.id)).slice(0,10);
for(const q of process){const st=profile.qStats[q.id];st.attempts++;st.correct++;st.streak++;st.last=localDateISO(0);adaptiveMemoryUpdate(st,'correct',60,null,false);}
const day1After=snapshot();
const stateDueNow=configuredIds.filter(id=>{const st=profile.qStats[id];return st.attempts>0&&st.due&&st.due<=localDateISO(0);});
const sources={reviewWorkloadCount:String(reviewWorkloadCount),reviewForecast:String(reviewForecast),dueQuestions:String(dueQuestions),buildTodayTasks:String(buildTodayTasks),taskAllocation:String(taskAllocation),activeReviewJourneys:String(activeReviewJourneys),actionableReviewJourneys:String(actionableReviewJourneys),questionHasActiveJourney:String(questionHasActiveJourney),trackedQuestionPool:String(trackedQuestionPool)};
console.log('__V315__'+Buffer.from(JSON.stringify({v:APP_VERSION,configured:{today:today.map(q=>q.id),tomorrow:tomorrow.map(q=>q.id),future:future.map(q=>q.id)},day0,day1Before,processed:process.map(q=>q.id),day1After,stateDueNow,sources,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V315__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v315','v314'),'expects v315');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p314=Path('_regression/subject-a-review-queue-discovery-v314.fixture.json');req(p314.exists(),'v314 fixture missing');req(json.loads(p314.read_text()).get('result')=='PASS — SUBJECT A REVIEW QUEUE ROUTING DISCOVERED','v314 result')
expected={'.github/subject-a-review-queue-simulation/validate_audit.py','.github/workflows/subject-a-review-queue-simulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-queue-simulation-v315.fixture.json','audits/SUBJECT_A_REVIEW_QUEUE_SIMULATION_v315.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v315' and par['v']=='v314','versions');req({k:v for k,v in cand.items() if k not in ('v','sem')}=={k:v for k,v in par.items() if k not in ('v','sem')},'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
d0=cand['day0'];d1=cand['day1Before'];da=cand['day1After']
print('V315_DEBUG '+json.dumps({'day0ConfiguredDue':len(d0['configuredDue']),'day1ConfiguredDue':len(d1['configuredDue']),'day1AfterConfiguredDue':len(da['configuredDue']),'day0Active':d0['active'],'day1Active':d1['active'],'day1ConfiguredState':d1['configuredState'],'processed':cand['processed'],'stateDueNow':cand['stateDueNow'],'trackedQuestionPool':cand['sources']['trackedQuestionPool'],'questionHasActiveJourney':cand['sources']['questionHasActiveJourney']},ensure_ascii=False))
req(len(d0['active'])==3,'expected 3 active journeys');req(len(d0['configuredDue'])==37,'active journeys should be removed from configured generic due cohort');req(d0['workload']==len(d0['actionable'])+len(d0['due']),'workload formula mismatch');req([x['count'] for x in d0['forecast']][:4]==[40,8,0,5],'day0 forecast mismatch')
req(len(d1['configuredDue'])==45,f"controlled overdue count {len(d1['configuredDue'])}, expected 45");req(len(cand['processed'])==10,'processing sample');req(len(da['configuredDue'])==35,'processed controlled due items did not leave generic queue');req(len(cand['stateDueNow'])==38,'controlled underlying due-state count mismatch');req(len(set(d0['due']))==len(d0['due']) and len(set(d1['due']))==len(d1['due']),'duplicate generic due IDs');req(len(d0['top'])==3,'home candidate display should remain a 3-item preview')
req(d0['alloc60'].get('review')==10 and d0['alloc90'].get('review')==15,'expected normal-plan review allocations changed')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'configured':{'dueToday':40,'dueTomorrow':8,'dueDay3':5,'guidedJourneyOverlap':3},
 'day0':{'active':len(d0['active']),'actionable':len(d0['actionable']),'configuredGenericDue':len(d0['configuredDue']),'allGenericDue':len(d0['due']),'workload':d0['workload'],'forecast':d0['forecast'],'topPreview':d0['top'],'alloc60':d0['alloc60'],'alloc90':d0['alloc90']},
 'day1WithoutCompletion':{'configuredGenericDue':len(d1['configuredDue']),'allGenericDue':len(d1['due']),'workload':d1['workload']},
 'day1AfterTenCorrectReviews':{'processed':len(cand['processed']),'configuredGenericDue':len(da['configuredDue']),'allGenericDue':len(da['due']),'workload':da['workload'],'controlledUnderlyingDueStates':len(cand['stateDueNow'])},
 'interpretation':'For the controlled cohort, the queue preserves backlog instead of silently capping or dropping overdue items. Guided review journeys are excluded from the generic due list, so overlapping journey items do not appear twice in that queue. When a day is skipped, all controlled overdue work remains present on the next day; after 10 clean reviews, exactly those 10 leave the controlled current queue through their new future due dates. The home top-review list is only a 3-item preview, not a queue cap. The production profile may contain other tracked review items outside this seeded QUESTION_BANK cohort, so integrity assertions deliberately scope carryover to the controlled IDs while retaining total production workload metrics. One remaining design question is capacity: normal 60/90-minute plans allocate 10/15 minutes to review regardless of workload size. That is not itself a correctness bug, but it warrants inspection of the actual review-task launch size before changing allocation.',
 'decision':'CONTROLLED QUEUE INTEGRITY PASS — INSPECT REVIEW TASK CAPACITY BEFORE ANY ALLOCATION CHANGE'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW QUEUE INTEGRITY COHERENT','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-queue-simulation-v315.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v315 — Subject A Review Queue Multi-Day Simulation\n=============================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW QUEUE INTEGRITY COHERENT\nPrevious release: v314\nSource main: {parent}\nLearner-facing change: none\n\nMethod\n------\nSeed a controlled profile with 40 questions due today, 8 tomorrow, 5 three days later, and 3 guided review journeys overlapping today's due set. Observe generic due selection, workload aggregation, forecast, skipped-day carryover, and the result of completing 10 clean reviews. Assertions about carryover are scoped to the seeded IDs so unrelated tracked chapter-review items cannot distort the controlled cohort.\n\nSummary\n-------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nLearner-facing behavior and review queue functions are unchanged from v314.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nNo controlled-cohort queue-loss or duplicate-list repair is needed. Before deciding whether large backlogs deserve more of the daily study budget, inspect the production action launched by the review task and determine how many questions/minutes it actually consumes.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_QUEUE_SIMULATION_v315.txt').write_text(audit);print(audit)
