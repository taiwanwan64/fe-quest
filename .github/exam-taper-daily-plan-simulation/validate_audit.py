from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'exam-taper-daily-plan-simulation-(v(\d+))',b);req(m,'bad v324 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const src={effectiveStudyMinutes:String(effectiveStudyMinutes),examDaysRemaining:String(examDaysRemaining),taperStudyCap:String(taperStudyCap),taskAllocation:String(taskAllocation),taperTaskAllocation:String(taperTaskAllocation)};
const originalExamDaysRemaining=examDaysRemaining;
let overrideWorked=false;const rows=[];
try{
  examDaysRemaining=()=>7;overrideWorked=examDaysRemaining()===7;
  for(const days of [14,7,3,1,0]){
    examDaysRemaining=()=>days;
    const effective=effectiveStudyMinutes();
    const cap=taperStudyCap();
    const phase=examStudyPhase();
    const allocation=taskAllocation();
    const total=Object.values(allocation).reduce((a,b)=>a+(Number(b)||0),0);
    rows.push({days,effective,cap,phase,allocation,total});
  }
} finally {examDaysRemaining=originalExamDaysRemaining;}
console.log('__V324__'+Buffer.from(JSON.stringify({v:APP_VERSION,overrideWorked,rows,src,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V324__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v324','v323'),'expects v324');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p323=Path('_regression/exam-taper-daily-cap-discovery-v323.fixture.json');req(p323.exists(),'v323 fixture missing');req(json.loads(p323.read_text()).get('result')=='PASS — TAPER DAILY-CAP HELPERS DISCOVERED','v323 result')
expected={'.github/exam-taper-daily-plan-simulation/validate_audit.py','.github/workflows/exam-taper-daily-plan-simulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/exam-taper-daily-plan-simulation-v324.fixture.json','audits/EXAM_TAPER_DAILY_PLAN_SIMULATION_v324.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v324' and par['v']=='v323','versions');req(cand['rows']==par['rows'] and cand['src']==par['src'],'audit-only taper plan drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic');req(cand['overrideWorked'],'examDaysRemaining override failed')
by={x['days']:x for x in cand['rows']}
for d in [14,7,3,1,0]:req(by[d]['total']==by[d]['effective'],f'allocation total mismatch day {d}')
req(by[7]['cap']==45 and by[7]['effective']<=45,'day7 45-minute cap not applied')
req(by[3]['cap']==30 and by[3]['effective']<=30,'day3 30-minute cap not applied')
req(by[1]['cap']==15 and by[1]['effective']<=15,'day1 15-minute cap not applied')
req(by[0]['cap']==10 and by[0]['effective']<=10,'exam-day 10-minute cap not applied')
req(by[14]['cap'] is None,'day14 unexpectedly capped')
req(by[3]['phase']['allowNew'] is False and by[3]['phase']['allowLongExam'] is False and by[3]['allocation']['subjectB']==0,'day3 protection not reflected in allocation')
req(by[1]['allocation']['lesson']==0 and by[1]['allocation']['subjectB']==0,'day1 allocation not review/final-check only')
req(by[0]['allocation']['review']==0 and by[0]['allocation']['lesson']==0 and by[0]['allocation']['subjectB']==0 and by[0]['allocation']['boss']==by[0]['effective'],'exam-day allocation not warmup-only')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={'dailyPlanSimulation':cand['rows'],'effectiveStudyMinutesSource':cand['src']['effectiveStudyMinutes'],'taskAllocationSource':cand['src']['taskAllocation'],'interpretation':'The production helper chain applies the taper cap before allocating the day. Exact day 7 is capped at 45 minutes, day 3 at 30, day 1 at 15 and exam day at 10; the allocation always sums back to the effective daily minutes. Day 3 also disables new learning/long exams and removes the generic Subject B allocation, day 1 removes lesson/Subject B work, and exam day assigns the short budget only to the final warm-up bucket. Day 14 remains uncapped, preserving a normal full practice day before the seven-day taper begins.','decision':'KEEP CURRENT TAPER BUDGET/ALLOCATION — END-TO-END HELPER CONTRACT IS COHERENT'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — TAPER DAILY PLAN CAPS AND ALLOCATION COHERENT','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/exam-taper-daily-plan-simulation-v324.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v324 — Exam Taper Daily-Plan Simulation\n=================================================\n\nResult\n------\nPASS — TAPER DAILY PLAN CAPS AND ALLOCATION COHERENT\nPrevious release: v323\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nFollow the actual production helper chain at exact 14/7/3/1/0 days: examDaysRemaining -> taperStudyCap/effectiveStudyMinutes -> taskAllocation. This verifies that the daily cap is not merely declared but actually constrains the allocated study plan.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and taper helpers are unchanged from v323.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nKeep the current taper budget and allocation. The 45/30/15/10 minute caps are applied through the production helper chain and the protected phases remove the intended workload categories. The tapering budget sequence can be closed unless a later learner-facing route bypasses these helpers.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EXAM_TAPER_DAILY_PLAN_SIMULATION_v324.txt').write_text(audit);print(audit)
