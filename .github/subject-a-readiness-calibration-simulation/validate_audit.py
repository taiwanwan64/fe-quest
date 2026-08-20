from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-readiness-calibration-simulation-(v(\d+))',b);req(m,'bad v320 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const RealDate=Date;let fakeNow='2026-07-01';
class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[fakeNow+'T12:00:00Z']));}static now(){return new RealDate(fakeNow+'T12:00:00Z').getTime();}}
globalThis.Date=FakeDate;
const cats=[...new Set(QUESTION_BANK.map(q=>q.cat))];
const blank=()=>({attempts:0,correct:0,streak:0,due:null,last:null,lastReason:null,stability:1,lapses:0,reviews:0,avgSeconds:0,timedAnswers:0,lastQuality:null,lastReviewDate:null,recovered:0,retryFailures:0,memoryVersion:2});
const reset=()=>{
  profile.lessonProgress={};profile.skills=Object.fromEntries(cats.map(c=>[c,50]));profile.sessions=[];profile.mockHistory=[];profile.bProgress={};profile.securityBProgress={};profile.bFinalHistory=[];profile.mockMistakeStats={};profile.reviewJourneys={};
  ensureQuestionProfile();for(const q of trackedQuestionPool())profile.qStats[q.id]=blank();
};
const completeLessons=()=>{for(const t of CORE_A_CURRICULUM)profile.lessonProgress[t.id]=100;};
const seedA=(last='2026-07-01',stability=12)=>{
  for(const q of QUESTION_BANK)Object.assign(profile.qStats[q.id],{attempts:1,correct:1,streak:2,due:last==='2026-07-01'?'2026-07-13':'2026-04-04',last,stability,lapses:0,reviews:2,avgSeconds:60,timedAnswers:1,lastReviewDate:last,lastQuality:4});
  profile.skills=Object.fromEntries(cats.map(c=>[c,90]));
  profile.sessions=[1,2,3].map(i=>({date:'2026-07-0'+i,mode:'random',total:10,correct:9,rate:90}));
  profile.mockHistory=[1,2,3].map(i=>({date:'2026-06-'+String(20+i).padStart(2,'0'),mode:'full',total:60,correct:51,rate:85}));
};
const seedB=()=>{
  profile.bProgress=Object.fromEntries(B_EXERCISES.map(x=>[x.id,true]));
  profile.securityBProgress=Object.fromEntries(SECURITY_SCENARIOS.map(x=>[x.id,true]));
  profile.bFinalHistory=[1,2,3].map(i=>({date:'2026-06-'+String(24+i).padStart(2,'0'),total:20,correct:16,rate:80}));
};
const snap=name=>{const c=readinessComponents(),m=memoryHealth();return {name,score:calcReadiness(),components:c,memory:m,cognitive:subjectACognitiveEvidence()};};
reset();const fresh=snap('fresh');
reset();completeLessons();const lessonOnly=snap('lessonOnly');
reset();completeLessons();profile.skills=Object.fromEntries(cats.map(c=>[c,90]));const lessonSkillOnly=snap('lessonSkillOnly');
reset();completeLessons();seedA();const strongA=snap('strongA');
seedB();const fullStrong=snap('fullStrong');
for(const q of QUESTION_BANK)Object.assign(profile.qStats[q.id],{last:'2026-04-01',lastReviewDate:'2026-04-01',due:'2026-04-04',stability:3});const staleFull=snap('staleFull');
const scenarios=[fresh,lessonOnly,lessonSkillOnly,strongA,fullStrong,staleFull];
const sources={calcReadiness:String(calcReadiness),readinessComponents:String(readinessComponents),subjectACognitiveEvidence:String(subjectACognitiveEvidence),memoryHealth:String(memoryHealth),renderReadiness:String(renderReadiness),lessonCompletionAverage:String(lessonCompletionAverage),recentQuizRate:String(recentQuizRate),recentAverageRate:String(recentAverageRate),objectCompletion:String(objectCompletion)};
console.log('__V320__'+Buffer.from(JSON.stringify({v:APP_VERSION,scenarios,bCounts:{algo:B_EXERCISES.length,security:SECURITY_SCENARIOS.length},sources,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V320__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v320','v319'),'expects v320');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p319=Path('_regression/subject-a-readiness-evidence-discovery-v319.fixture.json');req(p319.exists(),'v319 fixture missing');req(json.loads(p319.read_text()).get('result')=='PASS — SUBJECT A READINESS EVIDENCE STACK DISCOVERED','v319 result')
expected={'.github/subject-a-readiness-calibration-simulation/validate_audit.py','.github/workflows/subject-a-readiness-calibration-simulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-readiness-calibration-simulation-v320.fixture.json','audits/SUBJECT_A_READINESS_CALIBRATION_SIMULATION_v320.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v320' and par['v']=='v319','versions');req({k:v for k,v in cand.items() if k not in ('v','sem')}=={k:v for k,v in par.items() if k not in ('v','sem')},'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
print('V320_DEBUG '+json.dumps({'scenarios':cand['scenarios'],'bCounts':cand['bCounts'],'helpers':{k:cand['sources'][k] for k in ['lessonCompletionAverage','recentQuizRate','recentAverageRate','objectCompletion']}},ensure_ascii=False))
by={x['name']:x for x in cand['scenarios']};
req(by['fresh']['score']<25,'fresh profile readiness too high');req(by['lessonOnly']['score']<45,'lesson-only profile reached practice/ready territory');req(by['lessonSkillOnly']['score']<45,'lesson+inflated-skill profile too high without answer evidence');req(55<=by['strongA']['score']<80,'strong Subject A-only profile should be substantial but not full readiness');req(by['fullStrong']['score']>=80,'strong cross-subject evidence does not reach finishing stage');req(by['fullStrong']['score']>by['strongA']['score']>by['lessonSkillOnly']['score']>=by['lessonOnly']['score']>by['fresh']['score'],'readiness evidence ordering broken');req(by['fullStrong']['components']['bTraining']==100,'B training seed did not resolve to full completion');req(by['fullStrong']['components']['bExam']>=75,'B exam evidence seed too weak');req(by['strongA']['components']['cognitive']>=90,'strong A cognitive evidence unexpectedly low');req(by['staleFull']['memory']['avg']<80 and by['staleFull']['score']<by['fullStrong']['score'],'stale memory does not reduce readiness evidence')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'scenarios':cand['scenarios'],
 'interpretation':'The readiness percentage is evidence-gated in the intended direction. Completing all Subject A lessons alone stays below the 45% practical-strength threshold, and even artificially high category skills without question evidence remain below it. Strong Subject A evidence raises readiness substantially but remains below the 80% finishing-stage threshold because Subject B is still absent. Adding strong Subject B training/final evidence moves the score into the finishing stage. Making the previously strong Subject A memory evidence stale lowers both cognitive/memory components and the total score. This supports the current weighted design and shows the indicator is not simply a lesson-completion percentage.',
 'decision':'KEEP READINESS WEIGHTS — NO OVERCONFIDENCE REPAIR WARRANTED IN CONTROLLED PROFILES'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A READINESS CALIBRATION CONSERVATIVE','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-readiness-calibration-simulation-v320.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v320 — Subject A Readiness Calibration Simulation\n===========================================================\n\nResult\n------\nPASS — SUBJECT A READINESS CALIBRATION CONSERVATIVE\nPrevious release: v319\nSource main: {parent}\nLearner-facing change: none\n\nMethod\n------\nRun the production readiness formula on controlled fresh, lesson-only, lesson+high-skill/no-answer, strong Subject A-only, strong cross-subject, and stale-memory profiles. This checks evidence ordering and overconfidence without changing any readiness weights.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and readiness functions are unchanged from v319.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nKeep the current readiness weights. The score remains conservative when only lessons or nominal skill values are high, requires actual Subject A answer evidence for a meaningful rise, requires Subject B evidence to enter the 80% finishing stage, and responds downward when memory becomes stale. Next, inspect the stricter course-mastery gate presentation against the readiness percentage so the two user-facing signals cannot contradict each other.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_READINESS_CALIBRATION_SIMULATION_v320.txt').write_text(audit);print(audit)
