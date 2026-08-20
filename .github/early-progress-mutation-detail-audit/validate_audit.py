from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'early-progress-mutation-detail-audit-(v(\d+))',b);req(m,'bad v328 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];names=sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js)))
    tail=r'''
const names=__NAMES__;
const exact={};for(const n of ['saveProfile','completeLesson','_completeLessonV65','registerReviewJourney','subjectBPerformanceFlushV254','markDailyTask','buildTodayTasks','dueQuestions','actionableReviewJourneys']){try{const f=eval(n);exact[n]=typeof f==='function'?String(f).slice(0,7000):null}catch(e){exact[n]=null}}
const pick=(tests)=>{const rows=[];for(const n of names){let f,s;try{f=eval(n);if(typeof f!=='function')continue;s=String(f)}catch(e){continue}if(tests.every(r=>r.test(n+'\n'+s))){let score=0;for(const t of ['profile.qStats','profile.lessonProgress','profile.sessions','profile.streak','profile.lastStudyDate','.push(','saveProfile','markDailyTask','due','correct','wrong','completed'])if(s.includes(t))score++;rows.push({name:n,score,source:s.slice(0,5000)})}}return rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,10)};
const mutators={
 qStats:pick([/profile\.qStats/i,/=|push|correct|wrong|due/i]),
 lessonProgress:pick([/profile\.lessonProgress/i,/=|complete|progress|save/i]),
 subjectB:pick([/subjectBPerformanceV254|bFinalHistory|bMockHistory|bCompoundHistory/i,/=|push|flush|save/i]),
 review:pick([/reviewJourney|reviewJourneys|qStats.*due|dueQuestions/i,/=|push|register|save|schedule/i]),
 session:pick([/profile\.(sessions|streak|lastStudyDate)|markDailyTask/i,/=|push|save|date|streak/i])
};
console.log('__V328__'+Buffer.from(JSON.stringify({v:APP_VERSION,exact,mutators,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__NAMES__',json.dumps(names))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V328__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v328','v327'),'expects v328');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p327=Path('_regression/early-progress-state-contract-discovery-v327.fixture.json');req(p327.exists(),'v327 fixture missing');req(json.loads(p327.read_text()).get('result')=='PASS — EARLY-PROGRESS MUTATION SURFACES RESOLVED','v327 result')
expected={'.github/early-progress-mutation-detail-audit/validate_audit.py','.github/workflows/early-progress-mutation-detail-audit.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/early-progress-mutation-detail-audit-v328.fixture.json','audits/EARLY_PROGRESS_MUTATION_DETAIL_AUDIT_v328.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v328' and par['v']=='v327','versions');req(cand['exact']==par['exact'] and cand['mutators']==par['mutators'],'audit-only mutation-detail drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
required_exact=['saveProfile','completeLesson','registerReviewJourney','subjectBPerformanceFlushV254','markDailyTask','buildTodayTasks'];exact_ok={n:bool(cand['exact'].get(n)) for n in required_exact};counts={k:len(v) for k,v in cand['mutators'].items()};surface_ok={k:counts.get(k,0)>0 for k in ['qStats','lessonProgress','subjectB','review','session']};result='PASS — CONCRETE EARLY-PROGRESS MUTATION CONTRACTS RESOLVED' if all(exact_ok.values()) and all(surface_ok.values()) else 'FINDING — CONCRETE EARLY-PROGRESS MUTATION CONTRACTS INCOMPLETE'
summary={'requiredExactResolved':exact_ok,'mutatorCounts':counts,'exactSources':cand['exact'],'mutatorCandidates':cand['mutators'],'interpretation':'The first-week simulator now has concrete production contracts instead of broad signal classes: lesson completion, question-stat mutation, Subject B performance flushing, review-journey creation, daily-task/session recording and atomic profile persistence are all inspected as code paths. The next audit may execute a controlled sequence against a disposable runtime profile and rebuild today tasks after each transition, but must not equate the synthetic sequence with real learner retention or exam readiness.','decision':'EXECUTE DISPOSABLE EARLY-USE TRANSITION SIMULATION' if all(exact_ok.values()) and all(surface_ok.values()) else 'DETAIL THE MISSING CONTRACT BEFORE ANY STATE SIMULATION'}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/early-progress-mutation-detail-audit-v328.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v328 — Early-Progress Mutation Detail Audit\n====================================================\n\nResult\n------\n{result}\nPrevious release: v327\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nTurn v327's broad mutation-surface inventory into concrete production contracts that can safely drive a disposable early-use state-transition simulation.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and mutation contracts are unchanged from v327.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EARLY_PROGRESS_MUTATION_DETAIL_AUDIT_v328.txt').write_text(audit);print(audit)
