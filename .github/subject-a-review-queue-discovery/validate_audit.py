from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-queue-discovery-(v(\d+))',b);req(m,'bad v314 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const names=['dueQuestions','reviewUrgency','reviewCandidates','topReviewCandidates','reviewWorkloadCount','reviewForecast','buildTodayTasks','taskAllocation','buildDailyQuest','buildTaperTodayTasks','taperTaskAllocation','renderHomeReviewCandidates','updateDueCount','activeReviewJourneys','actionableReviewJourneys'];
const exact={};
for(const name of names){try{const v=eval(name);exact[name]=typeof v==='function'?String(v):v;}catch(e){exact[name]=null;}}
const calls={};
const whole=__WHOLE__;
for(const name of names){const rx=new RegExp(name+'\\s*\\(','g');calls[name]=(whole.match(rx)||[]).length;}
console.log('__V314__'+Buffer.from(JSON.stringify({v:APP_VERSION,exact,calls,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__WHOLE__',json.dumps(js,ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:])
        m=re.search(r'__V314__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v314','v313'),'expects v314')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p313=Path('_regression/subject-a-review-lifecycle-simulation-v313.fixture.json');req(p313.exists(),'v313 fixture missing');req(json.loads(p313.read_text()).get('result')=='PASS — SUBJECT A REVIEW LIFECYCLE SEQUENCES COHERENT','v313 result')
expected={'.github/subject-a-review-queue-discovery/validate_audit.py','.github/workflows/subject-a-review-queue-discovery.yml'}
generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-queue-discovery-v314.fixture.json','audits/SUBJECT_A_REVIEW_QUEUE_DISCOVERY_v314.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v314' and par['v']=='v313','versions');req(cand['exact']==par['exact'] and cand['calls']==par['calls'],'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
required=['dueQuestions','reviewUrgency','reviewWorkloadCount','reviewForecast','buildTodayTasks','taskAllocation','activeReviewJourneys'];missing=[x for x in required if cand['exact'].get(x) is None];req(not missing,'missing queue functions '+repr(missing))
for n in ['dueQuestions','reviewWorkloadCount','reviewForecast','buildTodayTasks']:
    req(cand['calls'].get(n,0)>=2,f'{n} has no caller evidence')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'resolved':{k:(v is not None) for k,v in cand['exact'].items()},
 'callOccurrences':cand['calls'],
 'exactSources':cand['exact'],
 'interpretation':'The app already has explicit production functions for due selection, review urgency, workload counting/forecasting, active guided-recovery journeys, and daily task allocation. v314 intentionally does not infer a daily capacity from names alone. The exact sources define the next audit: populate a controlled learner profile with staggered due dates and active journeys, then measure what the planner counts, surfaces, defers, and forecasts over consecutive days.',
 'decision':'PROCEED TO MULTI-DAY REVIEW-QUEUE SIMULATION'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW QUEUE ROUTING DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-queue-discovery-v314.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v314 — Subject A Review Queue Discovery Audit\n======================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW QUEUE ROUTING DISCOVERED\nPrevious release: v313\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nMap how individually coherent spaced-review states are aggregated into workload, forecast and today's study plan before simulating many questions over time.\n\nSummary\n-------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nLearner-facing behavior and scheduling functions are unchanged from v313.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nUse these exact queue/planner functions for a controlled multi-day v315 simulation. Do not add a new review cap or queue policy until actual planner throughput and starvation behavior are measured.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_QUEUE_DISCOVERY_v314.txt').write_text(audit);print(audit)
