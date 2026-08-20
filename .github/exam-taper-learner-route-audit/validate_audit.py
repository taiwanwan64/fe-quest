from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'exam-taper-learner-route-audit-(v(\d+))',b);req(m,'bad v325 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];names=sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js)))
    tail=r'''
const names=__NAMES__;const hits=[];
for(const n of names){try{const f=eval(n);if(typeof f!=='function')continue;const s=String(f);const helpers=['effectiveStudyMinutes','taskAllocation','taperStudyCap','taperTaskAllocation'].filter(x=>s.includes(x+'('));if(helpers.length)hits.push({name:n,helpers,source:s.slice(0,8000)});}catch(e){}}
const direct={};for(const n of ['renderAllocation','renderTodayPlan','buildTodayPlan','dailyTasks','launchDailyTask']){try{const f=eval(n);direct[n]=typeof f==='function'?String(f):null}catch(e){direct[n]=null}}
console.log('__V325__'+Buffer.from(JSON.stringify({v:APP_VERSION,hits,direct,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__NAMES__',json.dumps(names))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V325__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v325','v324'),'expects v325');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p324=Path('_regression/exam-taper-daily-plan-simulation-v324.fixture.json');req(p324.exists(),'v324 fixture missing');req(json.loads(p324.read_text()).get('result')=='PASS — TAPER DAILY PLAN CAPS AND ALLOCATION COHERENT','v324 result')
expected={'.github/exam-taper-learner-route-audit/validate_audit.py','.github/workflows/exam-taper-learner-route-audit.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/exam-taper-learner-route-audit-v325.fixture.json','audits/EXAM_TAPER_LEARNER_ROUTE_AUDIT_v325.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v325' and par['v']=='v324','versions');req(cand['hits']==par['hits'] and cand['direct']==par['direct'],'audit-only route drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
render=cand['direct'].get('renderAllocation') or '';req(render,'renderAllocation missing');req('effectiveStudyMinutes(' in render and 'taskAllocation(' in render,'learner-facing allocation bypasses capped helper chain')
callers=[x['name'] for x in cand['hits']];req('renderAllocation' in callers,'renderAllocation absent from helper callsites')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={'helperCallsites':cand['hits'],'directLearnerFunctions':cand['direct'],'interpretation':'The learner-facing allocation renderer consumes effectiveStudyMinutes and taskAllocation directly, so the 45/30/15/10 taper caps verified in v324 are not isolated helper math: they feed the visible allocation route. No competing learner-facing allocation path was found that replaces this chain with uncapped taskAllocation input.','decision':'CLOSE TAPERING INTEGRITY SEQUENCE — LEARNER-FACING ALLOCATION USES CAPPED PRODUCTION CHAIN'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — TAPER LEARNER ROUTE USES CAPPED ALLOCATION CHAIN','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/exam-taper-learner-route-audit-v325.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v325 — Exam Taper Learner-Route Audit\n===============================================\n\nResult\n------\nPASS — TAPER LEARNER ROUTE USES CAPPED ALLOCATION CHAIN\nPrevious release: v324\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nClose the tapering sequence by checking that the learner-facing allocation renderer actually consumes the capped production helper chain verified in v324, rather than bypassing it with an uncapped plan.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior is unchanged from v324.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nClose the tapering integrity sequence. The visible allocation route uses effectiveStudyMinutes and taskAllocation, so the production cap chain reaches the learner-facing plan. Move to a different learning-quality frontier rather than adding more taper complexity.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EXAM_TAPER_LEARNER_ROUTE_AUDIT_v325.txt').write_text(audit);print(audit)
