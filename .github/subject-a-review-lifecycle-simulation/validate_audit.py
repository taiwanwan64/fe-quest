from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-lifecycle-simulation-(v(\d+))',b)
    req(m,'bad v313 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const RealDate=Date;let fakeNow='2026-01-01';
class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[fakeNow+'T12:00:00Z']));}static now(){return new RealDate(fakeNow+'T12:00:00Z').getTime();}}
globalThis.Date=FakeDate;
const setNow=d=>{fakeNow=d;};
const blank=()=>({attempts:0,correct:0,streak:0,due:null,last:null,lastReason:null,stability:1,lapses:0,reviews:0,avgSeconds:0,timedAnswers:0,lastReviewDate:null,recovered:0,retryFailures:0});
const snap=s=>({attempts:s.attempts,correct:s.correct,streak:s.streak,due:s.due,last:s.last,stability:s.stability,lapses:s.lapses,reviews:s.reviews,avgSeconds:s.avgSeconds,timedAnswers:s.timedAnswers,lastReviewDate:s.lastReviewDate,lastQuality:s.lastQuality,recovered:s.recovered});

setNow('2026-01-01');
const c=blank();c.attempts=1;c.correct=1;c.streak=1;c.last=localDateISO(0);const c1=adaptiveMemoryUpdate(c,'correct',60,null,false);const correctDay0={interval:c1,stat:snap(c),retention:memoryRetention(c),due:isDue(c)};
setNow('2026-01-03');const correctDay2={retention:memoryRetention(c),due:isDue(c)};
setNow('2026-01-04');const correctDay3={retention:memoryRetention(c),due:isDue(c)};
c.attempts++;c.correct++;c.streak++;c.last=localDateISO(0);const c2=adaptiveMemoryUpdate(c,'correct',60,null,false);const correctSecond={interval:c2,stat:snap(c)};
setNow(c.due);c.attempts++;c.correct++;c.streak++;c.last=localDateISO(0);const c3=adaptiveMemoryUpdate(c,'correct',60,null,false);const correctThird={interval:c3,stat:snap(c)};

setNow('2026-02-01');
const w=blank();w.attempts=1;w.streak=0;w.last=localDateISO(0);const wi=adaptiveMemoryUpdate(w,'wrong',70,'知識不足',false);const afterWrong=snap(w);w.recovered++;const wr=adaptiveMemoryUpdate(w,'recovered',70,'知識不足',true);const afterRecovered=snap(w);
setNow('2026-02-02');const recoveredNextDay={due:isDue(w),retention:memoryRetention(w)};w.attempts++;w.correct++;w.streak=1;w.last=localDateISO(0);const wci=adaptiveMemoryUpdate(w,'correct',60,null,false);const afterRelearnCorrect={interval:wci,stat:snap(w)};

setNow('2026-03-01');
const base=()=>({attempts:5,correct:4,streak:2,due:null,last:localDateISO(0),lastReason:null,stability:10,lapses:0,reviews:4,avgSeconds:60,timedAnswers:4,lastReviewDate:localDateISO(0)});
const plain=base(),hes=base(),late=base(),fast=base(),slow=base();
const ip=adaptiveMemoryUpdate(plain,'correct',60,null,false);const ih=adaptiveMemoryUpdate(hes,'correct',60,'2択で迷った',false);const il=adaptiveMemoryUpdate(late,'correct',60,'時間不足',false);const iff=adaptiveMemoryUpdate(fast,'correct',30,null,false);const isl=adaptiveMemoryUpdate(slow,'correct',180,null,false);
const modifiers={plain:{interval:ip,stability:plain.stability},hesitation:{interval:ih,stability:hes.stability},timeShort:{interval:il,stability:late.stability},fast:{interval:iff,stability:fast.stability},slow:{interval:isl,stability:slow.stability}};

setNow('2026-04-01');ensureQuestionProfile();const q=QUESTION_BANK[0];const qs=profile.qStats[q.id];Object.assign(qs,{attempts:1,correct:1,streak:1,stability:3,lapses:0,reviews:1,lastReviewDate:'2026-03-29',last:'2026-03-29',due:'2026-04-01'});
let preJourneyDue=dueQuestions().some(x=>x.id===q.id),journeyError=null,journey=null,active=false,activeCount=null,withJourneyDue=null;
try{profile.reviewJourneys=[];registerReviewJourney(q,'practice');journey=journeyFor(q.id);active=questionHasActiveJourney(q.id);activeCount=activeReviewJourneys().length;withJourneyDue=dueQuestions().some(x=>x.id===q.id);}catch(e){journeyError=String(e&&e.stack||e);}
const savedRandom=Math.random;Math.random=()=>0.123456;const reviewItem=buildReviewItem(q);Math.random=savedRandom;
const handoff={baseId:q.id,itemId:reviewItem?.id||null,sourceId:reviewItem?.sourceId||null,variant:!!reviewItem?.variant,sameObjectId:(reviewItem?.id===q.id)};

const sources={gradeCurrentQuestion:String(gradeCurrentQuestion),adaptiveMemoryUpdate:String(adaptiveMemoryUpdate),isDue:String(isDue),reviewUrgency:String(reviewUrgency),dueQuestions:String(dueQuestions),buildReviewItem:String(buildReviewItem),registerReviewJourney:String(registerReviewJourney),activeReviewJourneys:String(activeReviewJourneys),journeyFor:String(journeyFor)};
const out={v:APP_VERSION,scenarios:{correctDay0,correctDay2,correctDay3,correctSecond,correctThird,wrong:{interval:wi,afterWrong,recoveredInterval:wr,afterRecovered,recoveredNextDay,afterRelearnCorrect},modifiers,route:{questionId:q.id,preJourneyDue,journeyError,journey,active,activeCount,withJourneyDue,handoff}},sources,sem:validateSubjectBSemantics()};
console.log('__V313__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-12000:])
        m=re.search(r'__V313__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker')
        return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v313','v312'),'expects v313')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p312=Path('_regression/subject-a-review-lifecycle-discovery-v312.fixture.json');req(p312.exists(),'v312 fixture missing');req(json.loads(p312.read_text()).get('result')=='PASS — SUBJECT A REVIEW LIFECYCLE DISCOVERED','v312 result')
expected={'.github/subject-a-review-lifecycle-simulation/validate_audit.py','.github/workflows/subject-a-review-lifecycle-simulation.yml'}
generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-lifecycle-simulation-v313.fixture.json','audits/SUBJECT_A_REVIEW_LIFECYCLE_SIMULATION_v313.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v313' and par['v']=='v312','versions');req(cand['scenarios']==par['scenarios'] and cand['sources']==par['sources'],'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
s=cand['scenarios'];req(s['correctDay0']['interval']==3,'first correct interval should be 3 days');req(s['correctDay0']['due'] is False and s['correctDay2']['due'] is False and s['correctDay3']['due'] is True,'first correct due timing');req(s['correctSecond']['interval']>s['correctDay0']['interval'] and s['correctThird']['interval']>s['correctSecond']['interval'],'correct intervals do not grow')
w=s['wrong'];req(w['interval']==1 and w['recoveredInterval']==1,'wrong/recovered should stay 1-day');req(w['afterWrong']['lapses']==1,'wrong lapse not recorded');req(w['afterRecovered']['reviews']==w['afterWrong']['reviews'],'same-session recovery double-counted a review');req(w['afterRecovered']['stability']>=1.5,'recovery stability too low');req(w['recoveredNextDay']['due'] is True,'recovered item not due next day');req(w['afterRelearnCorrect']['interval']>=3,'relearned correct did not expand interval')
m=s['modifiers'];req(m['fast']['stability']>=m['plain']['stability']>m['slow']['stability'],'speed modifier ordering');req(m['plain']['stability']>m['hesitation']['stability']>m['timeShort']['stability'],'reason modifier ordering')
r=s['route'];req(r['preJourneyDue'] is True,'due queue did not contain due item');req(r['journeyError'] is None,'journey simulation failed '+str(r['journeyError']));req(r['active'] is True and (r['activeCount'] or 0)>=1,'wrong-item journey not active');req(r['withJourneyDue'] is False,'active journey item leaked into generic due queue');req(r['handoff']['itemId'] is not None,'review handoff missing')
src=cand['sources'];req("adaptiveMemoryUpdate(st,'wrong'" in src['gradeCurrentQuestion'] and "adaptiveMemoryUpdate(st,'correct'" in src['gradeCurrentQuestion'] and "adaptiveMemoryUpdate(st,'recovered'" in src['gradeCurrentQuestion'],'grade lifecycle outcomes missing');req('registerReviewJourney' in src['gradeCurrentQuestion'],'wrong path no review journey registration');req('questionHasActiveJourney' in src['dueQuestions'],'due queue no active-journey exclusion')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'firstCorrect':s['correctDay0'],
 'secondCorrect':s['correctSecond'],
 'thirdCorrect':s['correctThird'],
 'wrongRecovery':w,
 'modifiers':m,
 'route':r,
 'interpretation':'The current Subject A memory policy behaves coherently across representative sequences. A first clean correct answer schedules a 3-day review; repeated correct answers expand intervals; a wrong answer creates a 1-day lapse and same-session recovery does not erase that gap or double-count a review; hesitation/time-shortage and slow responses conservatively reduce stability growth. Due items enter the generic due queue, while an active review journey intentionally removes the same item from that queue so it is handled by the guided recovery route instead of being duplicated. buildReviewItem remains the variant/sibling handoff for later review exposure.',
 'decision':'KEEP CURRENT SPACING POLICY — NO REPAIR WARRANTED FROM REPRESENTATIVE SEQUENCES'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW LIFECYCLE SEQUENCES COHERENT','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-lifecycle-simulation-v313.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v313 — Subject A Review Lifecycle Sequential Simulation\n================================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW LIFECYCLE SEQUENCES COHERENT\nPrevious release: v312\nSource main: {parent}\nLearner-facing change: none\n\nMethod\n------\nRun the production memory functions under a controlled clock for clean-correct, repeated-correct, wrong→same-session recovery→next-day relearning, response-speed/reason modifiers, generic due-queue entry, active-review-journey exclusion, and review-item handoff.\n\nSummary\n-------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nLearner-facing code and Subject A scheduling functions are unchanged from v312.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nDo not change spacing constants from these representative sequences. The lifecycle is internally coherent and deliberately separates guided recovery journeys from generic spaced-review due items. The next useful frontier is workload/queue behavior across many questions over time, where individually sound intervals could still create review spikes or starvation.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_LIFECYCLE_SIMULATION_v313.txt').write_text(audit);print(audit)
