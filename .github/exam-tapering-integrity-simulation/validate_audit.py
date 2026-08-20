from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'exam-tapering-integrity-simulation-(v(\d+))',b);req(m,'bad v322 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    fn_names=sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js)))
    tail=r'''
const wanted=['examStudyPhase','taskAllocation','chooseTaperReviewQuestions','taperFocusRecommendation','finalFocusRecommendation','shortFinalFocusRecommendation','examDaysRemaining'];
const exact={};for(const n of wanted){try{const v=eval(n);exact[n]=typeof v==='function'?String(v):null;}catch(e){exact[n]=null;}}
const phases=[14,7,3,1,0].map(days=>({days,...examStudyPhase(days)}));
const fnNames=__FN_NAMES__;const budgetFns=[];
for(const n of fnNames){try{const v=eval(n);if(typeof v!=='function')continue;const s=String(v);if(/examDaysRemaining|taper/i.test(s)&&(/45/.test(s)||/30/.test(s)||/15/.test(s))){budgetFns.push({name:n,source:s.slice(0,6000)});if(budgetFns.length>=20)break;}}catch(e){}}
const terms=['45','30','15','allowNew','allowLongExam','days>=4','days<=3','chooseTaperReviewQuestions','examStudyPhase','taskAllocation'];const snippets={};
for(const term of terms){const rows=[];let i=0;while((i=__WHOLE__.indexOf(term,i))>=0&&rows.length<8){rows.push(__WHOLE__.slice(Math.max(0,i-300),i+650).replace(/\s+/g,' '));i+=term.length;}snippets[term]=rows;}
console.log('__V322__'+Buffer.from(JSON.stringify({v:APP_VERSION,exact,phases,budgetFns,snippets,alloc60:taskAllocation(60),alloc90:taskAllocation(90),sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__FN_NAMES__',json.dumps(fn_names)).replace('__WHOLE__',json.dumps(js,ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V322__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v322','v321'),'expects v322');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p321=Path('_regression/subject-a-readiness-mastery-presentation-audit-v321.fixture.json');req(p321.exists(),'v321 fixture missing');req(json.loads(p321.read_text()).get('result')=='PASS — READINESS/MASTERY PRESENTATION SEMANTICALLY DISTINCT','v321 result')
expected={'.github/exam-tapering-integrity-simulation/validate_audit.py','.github/workflows/exam-tapering-integrity-simulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/exam-tapering-integrity-simulation-v322.fixture.json','audits/EXAM_TAPERING_INTEGRITY_SIMULATION_v322.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v322' and par['v']=='v321','versions');stable_keys=['exact','phases','alloc60','alloc90'];req(all(cand[k]==par[k] for k in stable_keys),'audit-only taper runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
missing=[n for n,v in cand['exact'].items() if not v];req(not missing,'missing taper functions '+repr(missing))
by={x['days']:x for x in cand['phases']};
req(by[14]['id']=='finalPractice' and by[14]['allowNew'] is True and by[14]['allowLongExam'] is True,'14-day phase drift')
req(by[7]['id']=='taper' and by[7]['allowNew'] is True and by[7]['allowLongExam'] is True,'7-day phase drift')
req(by[3]['id']=='protect' and by[3]['allowNew'] is False and by[3]['allowLongExam'] is False and by[3]['ratios']['subjectB']==0,'3-day protection drift')
req(by[1]['id']=='eve' and by[1]['allowNew'] is False and by[1]['allowLongExam'] is False and by[1]['ratios']['lesson']==0 and by[1]['ratios']['subjectB']==0,'eve phase drift')
req(by[0]['id']=='examDay' and by[0]['allowNew'] is False and by[0]['allowLongExam'] is False and by[0]['ratios']['boss']==1,'exam-day phase drift')
taper=cand['exact']['taperFocusRecommendation'];final=cand['exact']['finalFocusRecommendation'];req('days>=4' in taper,'4-6 day bounded new-lesson rule missing');req('days<=3' in final or 'deepTaper' in final,'deep taper guard missing');req("if(days===0)" in final and "if(days===1)" in final,'exam/eve focus guards missing')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
budget_names=[x['name'] for x in cand['budgetFns']]
cap_evidence=bool(budget_names or cand['snippets']['45'])
result='PASS — EXAM TAPERING GUARDS INTACT' if cap_evidence else 'PASS — TAPERING GUARDS INTACT; DAILY-CAP EVIDENCE NOT RESOLVED'
summary={
 'phaseMatrix':cand['phases'],
 'baselinePlanner':{'60min':cand['alloc60'],'90min':cand['alloc90']},
 'taperBudgetFunctionCandidates':budget_names,
 'taperMinuteEvidenceResolved':cap_evidence,
 'guards':{'day14LongPracticeAllowed':True,'day7BoundedNewLearningAllowed':True,'day3NoNewLearning':True,'day3NoLongExam':True,'day3GenericSubjectBShareZero':True,'day1ReviewOnlyStructure':True,'day0WarmupOnlyStructure':True,'newLessonRuleStartsAtDay4':True},
 'interpretation':'The current production phase boundary remains conservative at the point that matters most: exact day 3 enters protect mode, disables new learning and long exams, and removes the generic Subject B allocation; day 1 removes lesson/Subject B work; exam day is a warm-up-only phase. Exact day 7 remains a taper phase where a small amount of bounded new learning can still be allowed, consistent with taperFocusRecommendation only opening a new lesson when days>=4. The audit also inventories any explicit 45/30/15-minute taper-cap implementation separately rather than inferring it from phase ratios.',
 'decision':'KEEP PHASE GUARDS. If explicit taper-minute cap evidence is unresolved, inspect the planner-cap helper before changing learner behavior; otherwise proceed to end-to-end daily-plan simulation.'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/exam-tapering-integrity-simulation-v322.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v322 — Exam Tapering Integrity Simulation\n===================================================\n\nResult\n------\n{result}\nPrevious release: v321\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nRe-check the production exam-day phase boundaries after the recent learning, review, mock and readiness changes. The audit covers exact 14/7/3/1/0-day states, the no-new-learning/no-long-exam protection boundary, and discovery of any explicit taper-specific daily-minute cap.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and tapering functions are unchanged from v321.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nKeep the existing phase guards. Exact day 3 still activates the hard protection boundary and exact day 1/day 0 reduce the plan further. Treat the daily-minute taper cap as a separately verified contract: if the runtime inventory resolves the cap helper, use it in the next end-to-end simulation; if it does not, perform a narrow helper-discovery audit rather than changing phase ratios.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EXAM_TAPERING_INTEGRITY_SIMULATION_v322.txt').write_text(audit);print(audit)
