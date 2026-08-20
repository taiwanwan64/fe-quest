from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-time-budget-discovery-(v(\d+))',b);req(m,'bad v318 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const names=['speedFactorForMemory','adaptiveMemoryUpdate','gradeCurrentQuestion','startQuiz','taskAllocation','chooseTaperReviewQuestions'];const exact={};
for(const name of names){try{const v=eval(name);exact[name]=typeof v==='function'?String(v):v;}catch(e){exact[name]=null;}}
const timingTerms=['attemptSeconds','avgSeconds','timedAnswers','speedFactorForMemory','quizQuestionEnteredAt','questionPacer','QuestionPacer'];
const timingSnippets={};for(const term of timingTerms){const occ=[];let i=0;while((i=__WHOLE__.indexOf(term,i))>=0&&occ.length<20){occ.push(__WHOLE__.slice(Math.max(0,i-220),i+420).replace(/\s+/g,' '));i+=term.length;}timingSnippets[term]=occ;}
console.log('__V318__'+Buffer.from(JSON.stringify({v:APP_VERSION,exact,timingSnippets,alloc60:taskAllocation(60),alloc90:taskAllocation(90),sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__WHOLE__',json.dumps(js,ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V318__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v318','v317'),'expects v318');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p317=Path('_regression/subject-a-review-task-capacity-simulation-v317.fixture.json');req(p317.exists(),'v317 fixture missing');req(json.loads(p317.read_text()).get('result')=='PASS — SUBJECT A REVIEW TASK LAUNCH CAPACITY CHARACTERIZED','v317 result')
expected={'.github/subject-a-review-time-budget-alignment/validate_audit.py','.github/workflows/subject-a-review-time-budget-alignment.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-time-budget-alignment-v318.fixture.json','audits/SUBJECT_A_REVIEW_TIME_BUDGET_ALIGNMENT_v318.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v318' and par['v']=='v317','versions');req({k:v for k,v in cand.items() if k not in ('v','sem')}=={k:v for k,v in par.items() if k not in ('v','sem')},'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
exact=cand['exact'];missing=[n for n,v in exact.items() if not v];req(not missing,'missing timing functions '+repr(missing))
start=exact['startQuiz'];speed=exact['speedFactorForMemory'];adaptive=exact['adaptiveMemoryUpdate'];grade=exact['gradeCurrentQuestion']
req("due.slice(0,10)" in start and "chooseWeakQuestions(5)" in start,'review capacity contract changed');req('seconds<=45' in speed and 'seconds<=90' in speed and 'seconds<=150' in speed,'memory speed thresholds changed');req('avgSeconds' in adaptive and 'timedAnswers' in adaptive,'per-question timing aggregation missing');req('attemptSeconds' in grade and "adaptiveMemoryUpdate(st,'wrong',attemptSeconds" in grade and "adaptiveMemoryUpdate(st,'correct',attemptSeconds" in grade,'answer timing not propagated to memory model')
alloc60,alloc90=cand['alloc60'],cand['alloc90'];req(alloc60.get('review')==10 and alloc90.get('review')==15,'planner review minutes changed')
cap=10;sec60=alloc60['review']*60/cap;sec90=alloc90['review']*60/cap
req(sec60==60 and sec90==90,'unexpected time-per-review calculation');req(45<sec60<=90 and 45<sec90<=90,'planner per-question targets no longer fit neutral speed band')
req(len(cand['timingSnippets']['attemptSeconds'])>=1 and len(cand['timingSnippets']['avgSeconds'])>=1,'timing instrumentation evidence missing')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'genericReviewQuestionCap':cap,
 'noDueFallbackQuestions':5,
 'planner':{'60min':{'reviewMinutes':alloc60['review'],'secondsPerQuestionAtCap':sec60},'90min':{'reviewMinutes':alloc90['review'],'secondsPerQuestionAtCap':sec90}},
 'memoryTimingModel':{'fastSecondsMax':45,'neutralSecondsMax':90,'slowBandSecondsMax':150,'verySlowAbove':150},
 'timingInstrumentation':{'answerAttemptSecondsPropagated':True,'avgSecondsTracked':True,'timedAnswersTracked':True},
 'interpretation':'The fixed 10-question generic review cap is internally aligned with the planner rather than arbitrary. A 60-minute daily plan reserves 10 review minutes, which equals 60 seconds per question at the 10-question cap; a 90-minute plan reserves 15 minutes, which equals 90 seconds per question. Both fall inside the memory model\'s neutral 46-90 second response band. The app also records actual first-attempt seconds into per-question avgSeconds/timedAnswers, so slower or hesitant answers already influence memory stability without requiring the daily planner to rush the learner. The planner minutes are therefore best treated as an estimate, not a hard deadline. A dynamic question cap based on response speed would add complexity and could punish slower reasoning without evidence of a queue-integrity problem.',
 'decision':'KEEP 10-QUESTION CAP AND 10/15-MINUTE ALLOCATIONS — REVIEW CAPACITY SEQUENCE CLOSED'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW TIME BUDGET ALIGNED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-time-budget-alignment-v318.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v318 — Subject A Review Time-Budget Alignment Audit\n==============================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW TIME BUDGET ALIGNED\nPrevious release: v317\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nCheck whether the v317 10-question review-session cap is consistent with the planner's review-minute allocation and the production per-question timing model before changing either policy.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior, spacing, queue, review launch and planner allocation functions are unchanged from v317.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nKeep the current review capacity. The standard 60-minute plan implies about 60 seconds per question and the 90-minute plan about 90 seconds per question at the 10-question cap, both inside the production model's neutral timing band. Since backlog is preserved across days and actual response time already feeds memory scheduling, do not introduce a dynamic cap or more review minutes without learner evidence. Close the Subject A review-lifecycle/capacity sequence and move to a different learning-quality frontier.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_TIME_BUDGET_ALIGNMENT_v318.txt').write_text(audit);print(audit)
