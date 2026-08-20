from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-task-capacity-discovery-(v(\d+))',b);req(m,'bad v316 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    names=['launchDailyTask','startReviewPrescription','startRecommendedPrescription','startQuiz','buildTodayTasks','taskAllocation','dueQuestions','topReviewCandidates','startJourneyAction','openProblemsHub','renderDailyPlan']
    tail=r'''
const names=__NAMES__,exact={};
for(const name of names){try{const v=eval(name);exact[name]=typeof v==='function'?String(v):v;}catch(e){exact[name]=null;}}
const calls={};const whole=__WHOLE__;
for(const name of names){const rx=new RegExp(name+'\\s*\\(','g'),occ=[];let m;while((m=rx.exec(whole))&&occ.length<20)occ.push({at:m.index,snippet:whole.slice(Math.max(0,m.index-260),m.index+520).replace(/\\s+/g,' ')});calls[name]=occ;}
console.log('__V316__'+Buffer.from(JSON.stringify({v:APP_VERSION,exact,calls,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__NAMES__',json.dumps(names,ensure_ascii=False)).replace('__WHOLE__',json.dumps(js,ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V316__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v316','v315'),'expects v316');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p315=Path('_regression/subject-a-review-queue-simulation-v315.fixture.json');req(p315.exists(),'v315 fixture missing');req(json.loads(p315.read_text()).get('result')=='PASS — SUBJECT A REVIEW QUEUE INTEGRITY COHERENT','v315 result')
expected={'.github/subject-a-review-task-capacity-discovery/validate_audit.py','.github/workflows/subject-a-review-task-capacity-discovery.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-task-capacity-discovery-v316.fixture.json','audits/SUBJECT_A_REVIEW_TASK_CAPACITY_DISCOVERY_v316.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v316' and par['v']=='v315','versions');req(cand['exact']==par['exact'] and cand['calls']==par['calls'],'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
required=['launchDailyTask','startReviewPrescription','startQuiz','buildTodayTasks','taskAllocation','dueQuestions'];missing=[n for n in required if not cand['exact'].get(n)];req(not missing,'missing capacity path '+repr(missing))
launch=cand['exact']['launchDailyTask'];start=cand['exact']['startQuiz'];rx=cand['exact']['startReviewPrescription'];req('review' in launch.lower(),'daily task launcher has no review branch');req('dueQuestions' in start or 'dueQuestions' in rx or 'reviewCandidates' in start or 'reviewCandidates' in rx,'review launch source does not resolve review candidates')
nums={name:sorted(set(int(x) for x in re.findall(r'(?<![\w.])([1-9][0-9]?)(?![\w.])',src or ''))) for name,src in cand['exact'].items()}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'resolved':{k:(v is not None) for k,v in cand['exact'].items()},
 'numericLiteralsByFunction':nums,
 'exactSources':cand['exact'],
 'callSites':cand['calls'],
 'interpretation':'The production path from today-plan review task to the actual quiz launcher is now captured. v316 deliberately records the exact candidate slicing/count logic rather than assuming that the planner review-minute allocation equals a question count. The next step should execute this path with small, medium and large due backlogs and measure the actual launched quiz size and whether guided recovery journeys pre-empt generic due items.',
 'decision':'PROCEED TO REVIEW TASK LAUNCH-CAPACITY SIMULATION'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW TASK CAPACITY PATH DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-task-capacity-discovery-v316.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n')
summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v316 — Subject A Review Task Capacity Discovery Audit\n===============================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW TASK CAPACITY PATH DISCOVERED\nPrevious release: v315\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nTrace the production action launched from today's review task through review prescription / quiz startup, so actual question capacity can be measured before changing fixed 10/15-minute review allocations.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and review/task functions are unchanged from v315.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nUse the captured path for a controlled v317 launch simulation across small, medium and large due queues. Do not infer capacity from planner minutes alone.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_TASK_CAPACITY_DISCOVERY_v316.txt').write_text(audit);print(audit)
