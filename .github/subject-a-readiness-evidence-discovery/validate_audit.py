from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-readiness-evidence-discovery-(v(\d+))',b);req(m,'bad v319 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    names=['calcReadiness','readinessComponents','subjectACognitiveEvidence','categoryCognitiveEvidence','cognitiveLevelEvidence','courseMasteryStatus','memoryHealth','examAreaProgress','renderReadiness','mockAttemptDiagnostics','examStudyPhase'];
    tail=r'''
const names=__NAMES__,exact={};
for(const name of names){try{const v=eval(name);exact[name]=typeof v==='function'?String(v):v;}catch(e){exact[name]=null;}}
const combined=Object.values(exact).filter(Boolean).join('\n');
const profileRefs=[...new Set([...combined.matchAll(/profile\.([A-Za-z_$][\w$]*)/g)].map(m=>m[1]))].sort();
const functionCalls={};for(const name of names){functionCalls[name]=(combined.match(new RegExp(name+'\\s*\\(','g'))||[]).length;}
const numberLiterals={};for(const [name,src] of Object.entries(exact)){numberLiterals[name]=src?[...new Set([...src.matchAll(/(?<![\w.])([0-9]+(?:\.[0-9]+)?)(?![\w.])/g)].map(m=>Number(m[1])))].sort((a,b)=>a-b):[];}
console.log('__V319__'+Buffer.from(JSON.stringify({v:APP_VERSION,exact,profileRefs,functionCalls,numberLiterals,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__NAMES__',json.dumps(names,ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V319__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v319','v318'),'expects v319');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p318=Path('_regression/subject-a-review-time-budget-alignment-v318.fixture.json');req(p318.exists(),'v318 fixture missing');req(json.loads(p318.read_text()).get('result')=='PASS — SUBJECT A REVIEW TIME BUDGET ALIGNED','v318 result')
expected={'.github/subject-a-readiness-evidence-discovery/validate_audit.py','.github/workflows/subject-a-readiness-evidence-discovery.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-readiness-evidence-discovery-v319.fixture.json','audits/SUBJECT_A_READINESS_EVIDENCE_DISCOVERY_v319.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v319' and par['v']=='v318','versions');req({k:v for k,v in cand.items() if k not in ('v','sem')}=={k:v for k,v in par.items() if k not in ('v','sem')},'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
required=['calcReadiness','readinessComponents','subjectACognitiveEvidence','categoryCognitiveEvidence','cognitiveLevelEvidence','courseMasteryStatus','memoryHealth','examAreaProgress','renderReadiness'];missing=[n for n in required if not cand['exact'].get(n)];req(not missing,'missing readiness evidence functions '+repr(missing))
calc=cand['exact']['calcReadiness'];components=cand['exact']['readinessComponents'];req('readinessComponents' in calc or 'subjectACognitiveEvidence' in calc or 'memoryHealth' in calc,'readiness score has no evidence dependency');req('QUESTION_BANK' in cand['exact']['subjectACognitiveEvidence'],'Subject A cognitive evidence does not derive from question bank');req('qStats' in cand['exact']['subjectACognitiveEvidence'],'Subject A cognitive evidence does not inspect question attempts')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
 'resolved':{k:(v is not None) for k,v in cand['exact'].items()},
 'profileReferences':cand['profileRefs'],
 'functionCallCountsInsideReadinessSet':cand['functionCalls'],
 'numericLiteralsByFunction':cand['numberLiterals'],
 'exactSources':cand['exact'],
 'interpretation':'The app has a concrete readiness/evidence stack rather than a single UI percentage: readiness calculation, component decomposition, question-bank cognitive evidence, per-category/per-cognitive evidence, course mastery, memory health, exam-area progress and rendering are all present. Subject A evidence reads QUESTION_BANK and qStats, so the next audit can test whether readiness remains conservative for fresh or lesson-only profiles and rises only when actual answer evidence becomes strong. v319 is discovery-only and does not alter thresholds.',
 'decision':'PROCEED TO CONTROLLED READINESS-CALIBRATION SIMULATION'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A READINESS EVIDENCE STACK DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-readiness-evidence-discovery-v319.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v319 — Subject A Readiness Evidence Discovery Audit\n============================================================\n\nResult\n------\nPASS — SUBJECT A READINESS EVIDENCE STACK DISCOVERED\nPrevious release: v318\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nAfter closing the Subject A review-lifecycle/capacity sequence, map the production readiness evidence stack before judging whether the app can become overconfident from lesson completion or shallow activity.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and readiness functions are unchanged from v318.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nUse these exact functions in v320 to compare fresh, lesson-heavy but untested, weak-answer, strong-answer and mature-memory profiles. Do not change readiness thresholds until the score response is measured.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_READINESS_EVIDENCE_DISCOVERY_v319.txt').write_text(audit);print(audit)
